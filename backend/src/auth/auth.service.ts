import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EventSeverity, OtpPurpose, SecurityEventType, UserStatus } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly OTP_MAX_ATTEMPTS = 3;
  private readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private readonly OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // -------------------------------------------------------------
  // USER REGISTRATION
  // -------------------------------------------------------------
  async register(
    dto: RegisterDto,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<{ user: any; tokens: AuthTokens }> {
    if (!dto.email && !dto.phoneNumber) {
      throw new BadRequestException(
        'Either email or phone number must be provided for registration',
      );
    }

    // Check uniqueness
    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existingEmail) {
        throw new ConflictException('Email address is already registered');
      }
    }

    if (dto.phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number is already registered');
      }
    }

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email ? dto.email.toLowerCase() : null,
        phoneNumber: dto.phoneNumber || null,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.phoneNumber, ipAddress, deviceInfo);

    return { user, tokens };
  }

  // -------------------------------------------------------------
  // USER LOGIN (WITH 5-ATTEMPT / 15-MIN LOCKOUT)
  // -------------------------------------------------------------
  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<{ user: any; tokens: AuthTokens }> {
    const identifier = dto.identifier.trim();
    const isEmail = identifier.includes('@');

    const user = await this.prisma.user.findFirst({
      where: isEmail
        ? { email: identifier.toLowerCase() }
        : { phoneNumber: identifier },
    });

    if (!user) {
      await this.logSecurityEvent(
        SecurityEventType.LOGIN_FAILED,
        EventSeverity.LOW,
        ipAddress,
        '/api/v1/auth/login',
        { reason: 'User not found', identifier },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw new ForbiddenException(
        `Account is locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      );
    }

    // Check account status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Account was created via OTP. Please log in with OTP.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      const updatedFailedAttempts = user.failedLoginAttempts + 1;
      const isNowLocked = updatedFailedAttempts >= this.MAX_FAILED_ATTEMPTS;
      const lockedUntil = isNowLocked
        ? new Date(Date.now() + this.LOCKOUT_DURATION_MS)
        : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: updatedFailedAttempts,
          lockedUntil,
        },
      });

      await this.logSecurityEvent(
        SecurityEventType.LOGIN_FAILED,
        isNowLocked ? EventSeverity.HIGH : EventSeverity.MEDIUM,
        ipAddress,
        '/api/v1/auth/login',
        {
          userId: user.id,
          failedAttempts: updatedFailedAttempts,
          isLocked: isNowLocked,
        },
        user.id,
      );

      if (isNowLocked) {
        throw new ForbiddenException(
          'Account locked due to 5 failed login attempts. Please try again in 15 minutes.',
        );
      }

      const remainingAttempts = this.MAX_FAILED_ATTEMPTS - updatedFailedAttempts;
      throw new UnauthorizedException(
        `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lockout.`,
      );
    }

    // Reset lockout counters on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.phoneNumber,
      ipAddress,
      userAgent,
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
    };

    return { user: safeUser, tokens };
  }

  // -------------------------------------------------------------
  // SEND OTP (60s COOLDOWN & 5m TTL)
  // -------------------------------------------------------------
  async sendOtp(dto: SendOtpDto): Promise<{ message: string; resendAfterSeconds: number; debugOtp?: string }> {
    const identifier = dto.identifier.trim();

    // Check active cooldown
    const latestOtp = await this.prisma.otpVerification.findFirst({
      where: {
        identifier,
        purpose: dto.purpose,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp && latestOtp.resendAfter > new Date()) {
      const waitSeconds = Math.ceil(
        (latestOtp.resendAfter.getTime() - Date.now()) / 1000,
      );
      throw new BadRequestException(
        `Please wait ${waitSeconds} seconds before requesting a new OTP code.`,
      );
    }

    // Generate 6-digit numeric OTP code
    const rawCode = crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(rawCode, 10);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MS);
    const resendAfter = new Date(now.getTime() + this.OTP_COOLDOWN_MS);

    await this.prisma.otpVerification.create({
      data: {
        identifier,
        codeHash,
        purpose: dto.purpose,
        expiresAt,
        resendAfter,
      },
    });

    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    this.logger.log(`[OTP] Generated OTP for ${identifier} (${dto.purpose}): ${rawCode}`);

    return {
      message: `OTP sent successfully to ${identifier}`,
      resendAfterSeconds: 60,
      ...(isDev ? { debugOtp: rawCode } : {}),
    };
  }

  // -------------------------------------------------------------
  // VERIFY OTP (MAX 3 ATTEMPTS & AUTO-ISSUANCE)
  // -------------------------------------------------------------
  async verifyOtp(
    dto: VerifyOtpDto,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<{ message: string; user?: any; tokens?: AuthTokens }> {
    const identifier = dto.identifier.trim();

    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        identifier,
        purpose: dto.purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    if (otpRecord.attempts >= this.OTP_MAX_ATTEMPTS) {
      await this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      throw new BadRequestException(
        'Too many failed attempts for this OTP. Please request a new code.',
      );
    }

    const isValid = await bcrypt.compare(dto.code, otpRecord.codeHash);

    if (!isValid) {
      const nextAttempts = otpRecord.attempts + 1;
      const isExhausted = nextAttempts >= this.OTP_MAX_ATTEMPTS;

      await this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: {
          attempts: nextAttempts,
          isUsed: isExhausted,
        },
      });

      const remaining = this.OTP_MAX_ATTEMPTS - nextAttempts;
      throw new BadRequestException(
        isExhausted
          ? 'Too many failed attempts. This OTP has been invalidated.'
          : `Invalid OTP code. ${remaining} attempt(s) remaining.`,
      );
    }

    // Mark OTP as used
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const isEmail = identifier.includes('@');

    // Handle purpose-specific logic
    if (dto.purpose === OtpPurpose.PHONE_VERIFY) {
      const user = await this.prisma.user.findUnique({
        where: { phoneNumber: identifier },
      });
      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { isPhoneVerified: true },
        });
      }
      return { message: 'Phone number verified successfully' };
    }

    if (dto.purpose === OtpPurpose.EMAIL_VERIFY) {
      const user = await this.prisma.user.findUnique({
        where: { email: identifier.toLowerCase() },
      });
      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true },
        });
      }
      return { message: 'Email address verified successfully' };
    }

    // For LOGIN or REGISTRATION via OTP
    let user = await this.prisma.user.findFirst({
      where: isEmail
        ? { email: identifier.toLowerCase() }
        : { phoneNumber: identifier },
    });

    if (!user) {
      // Create user if logging in/registering via new verified phone/email
      user = await this.prisma.user.create({
        data: {
          email: isEmail ? identifier.toLowerCase() : null,
          phoneNumber: !isEmail ? identifier : null,
          isEmailVerified: isEmail,
          isPhoneVerified: !isEmail,
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(isEmail ? { isEmailVerified: true } : { isPhoneVerified: true }),
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.phoneNumber,
      ipAddress,
      deviceInfo,
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      status: user.status,
    };

    return {
      message: 'OTP verified successfully',
      user: safeUser,
      tokens,
    };
  }

  // -------------------------------------------------------------
  // REFRESH TOKEN ROTATION & REPLAY ATTACK DETECTION
  // -------------------------------------------------------------
  async refreshToken(
    rawRefreshToken: string,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<AuthTokens> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Replay attack detection: if a revoked token is presented
    if (storedToken.isRevoked) {
      this.logger.warn(
        `Token replay attempt detected for user: ${storedToken.userId}! Revoking all sessions.`,
      );

      // Invalidate all tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { isRevoked: true },
      });

      await this.logSecurityEvent(
        SecurityEventType.TOKEN_REPLAY_ATTEMPT,
        EventSeverity.CRITICAL,
        ipAddress || 'unknown',
        '/api/v1/auth/refresh',
        { userId: storedToken.userId, compromisedTokenId: storedToken.id },
        storedToken.userId,
      );

      throw new UnauthorizedException(
        'Security alert: Token reuse detected. All active sessions have been terminated. Please log in again.',
      );
    }

    // Check expiration
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Check user status
    if (storedToken.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Rotate: Revoke current token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Issue new token pair
    return this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.phoneNumber,
      ipAddress,
      deviceInfo,
    );
  }

  // -------------------------------------------------------------
  // LOGOUT (REVOKE REFRESH TOKEN)
  // -------------------------------------------------------------
  async logout(userId: string, rawRefreshToken?: string): Promise<{ message: string }> {
    if (rawRefreshToken) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawRefreshToken)
        .digest('hex');

      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash },
        data: { isRevoked: true },
      });
    } else {
      // Revoke all tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }

    return { message: 'Logged out successfully' };
  }

  // -------------------------------------------------------------
  // GET CURRENT USER PROFILE (/me)
  // -------------------------------------------------------------
  async getMe(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            city: true,
            gender: true,
            budgetMin: true,
            budgetMax: true,
            isComplete: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // -------------------------------------------------------------
  // TOKEN GENERATION HELPER (15m ACCESS + 7d REFRESH)
  // -------------------------------------------------------------
  private async generateTokens(
    userId: string,
    email?: string | null,
    phoneNumber?: string | null,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email, phoneNumber };

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'flatmate_super_secret_jwt_access_key_min_32_chars';
    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn as any,
    });

    // 7-day cryptographically random refresh token
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        deviceInfo: deviceInfo || null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  // -------------------------------------------------------------
  // SECURITY EVENT LOGGING HELPER
  // -------------------------------------------------------------
  private async logSecurityEvent(
    eventType: SecurityEventType,
    severity: EventSeverity,
    ipAddress: string,
    endpoint: string,
    payloadSummary: Record<string, any>,
    userId?: string,
  ): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          eventType,
          severity,
          ipAddress: ipAddress || 'unknown',
          endpoint,
          payloadSummary,
          userId: userId || null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to record security event: ${(err as Error).message}`);
    }
  }
}

