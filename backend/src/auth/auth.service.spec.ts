import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OtpPurpose, UserStatus } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      otpVerification: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      securityEvent: {
        create: jest.fn().mockResolvedValue({ id: 'sec-1' }),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock_jwt_access_token'),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'test_jwt_secret_32_characters_long';
        if (key === 'JWT_ACCESS_EXPIRATION') return '15m';
        if (key === 'NODE_ENV') return 'test';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully with hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        phoneNumber: null,
        isEmailVerified: false,
        isPhoneVerified: false,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.register({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock_jwt_access_token');
      expect(result.tokens.refreshToken).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email: 'taken@example.com' });

      await expect(
        service.register({
          email: 'taken@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if neither email nor phone is provided', async () => {
      await expect(
        service.register({
          password: 'Password123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login & account lockout', () => {
    it('should successfully log in an active user with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 0,
        lockedUntil: null,
        isEmailVerified: true,
        isPhoneVerified: false,
      });
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.login(
        { identifier: 'user@example.com', password: 'Password123!' },
        '127.0.0.1',
      );

      expect(result.user.id).toBe('user-1');
      expect(result.tokens.accessToken).toBe('mock_jwt_access_token');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ failedLoginAttempts: 0 }),
        }),
      );
    });

    it('should increment failed attempts on invalid password and throw UnauthorizedException', async () => {
      const passwordHash = await bcrypt.hash('RealPassword123!', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 2,
        lockedUntil: null,
      });
      prisma.user.update.mockResolvedValue({});

      await expect(
        service.login(
          { identifier: 'user@example.com', password: 'WrongPassword' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 3 }),
        }),
      );
    });

    it('should lock account after 5 failed login attempts', async () => {
      const passwordHash = await bcrypt.hash('RealPassword123!', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 4, // 5th attempt incoming
        lockedUntil: null,
      });
      prisma.user.update.mockResolvedValue({});

      await expect(
        service.login(
          { identifier: 'user@example.com', password: 'WrongPassword' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('should reject login if account is currently locked', async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 mins remaining
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 5,
        lockedUntil,
      });

      await expect(
        service.login(
          { identifier: 'user@example.com', password: 'AnyPassword' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('OTP flow', () => {
    it('should generate an OTP and enforce 60s cooldown', async () => {
      prisma.otpVerification.findFirst.mockResolvedValue(null);
      prisma.otpVerification.create.mockResolvedValue({ id: 'otp-1' });

      const result = await service.sendOtp({
        identifier: '+919876543210',
        purpose: OtpPurpose.LOGIN,
      });

      expect(result.resendAfterSeconds).toBe(60);
      expect(result.debugOtp).toHaveLength(6);
      expect(prisma.otpVerification.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if requesting OTP before cooldown expires', async () => {
      const futureCooldown = new Date(Date.now() + 45 * 1000);
      prisma.otpVerification.findFirst.mockResolvedValue({
        id: 'otp-recent',
        resendAfter: futureCooldown,
      });

      await expect(
        service.sendOtp({
          identifier: '+919876543210',
          purpose: OtpPurpose.LOGIN,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should verify correct OTP and issue tokens', async () => {
      const codeHash = await bcrypt.hash('123456', 10);
      prisma.otpVerification.findFirst.mockResolvedValue({
        id: 'otp-1',
        identifier: '+919876543210',
        purpose: OtpPurpose.LOGIN,
        codeHash,
        attempts: 0,
        isUsed: false,
        expiresAt: new Date(Date.now() + 60000),
      });
      prisma.otpVerification.update.mockResolvedValue({});
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        phoneNumber: '+919876543210',
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
      });
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.verifyOtp({
        identifier: '+919876543210',
        code: '123456',
        purpose: OtpPurpose.LOGIN,
      });

      expect(result.tokens?.accessToken).toBe('mock_jwt_access_token');
      expect(prisma.otpVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isUsed: true } }),
      );
    });

    it('should throttle and invalidate OTP after 3 incorrect attempts', async () => {
      const codeHash = await bcrypt.hash('123456', 10);
      prisma.otpVerification.findFirst.mockResolvedValue({
        id: 'otp-1',
        identifier: '+919876543210',
        purpose: OtpPurpose.LOGIN,
        codeHash,
        attempts: 2, // 3rd failed attempt
        isUsed: false,
        expiresAt: new Date(Date.now() + 60000),
      });
      prisma.otpVerification.update.mockResolvedValue({});

      await expect(
        service.verifyOtp({
          identifier: '+919876543210',
          code: '999999',
          purpose: OtpPurpose.LOGIN,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.otpVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { attempts: 3, isUsed: true },
        }),
      );
    });
  });

  describe('Refresh Token Rotation & Replay Attack Detection', () => {
    it('should rotate tokens and revoke old refresh token', async () => {
      const rawToken = 'valid_raw_refresh_token_string';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-1',
          email: 'user@example.com',
          status: UserStatus.ACTIVE,
        },
      });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const tokens = await service.refreshToken(rawToken);

      expect(tokens.accessToken).toBe('mock_jwt_access_token');
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-1' },
          data: { isRevoked: true },
        }),
      );
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should detect token replay, revoke all user tokens and record security event', async () => {
      const rawToken = 'compromised_refresh_token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        tokenHash,
        isRevoked: true, // ALREADY REVOKED! Replay attack!
        user: { id: 'user-1', status: UserStatus.ACTIVE },
      });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 5 });

      await expect(service.refreshToken(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify all tokens for user were revoked
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { isRevoked: true },
      });
      // Verify security event logged
      expect(prisma.securityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'TOKEN_REPLAY_ATTEMPT',
            severity: 'CRITICAL',
          }),
        }),
      );
    });
  });

  describe('logout', () => {
    it('should revoke user refresh token', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-1', 'raw_token');

      expect(result.message).toBe('Logged out successfully');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user data without sensitive password hashes', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
        profile: null,
      });

      const user = await service.getMe('user-1');

      expect(user.id).toBe('user-1');
      expect(user.passwordHash).toBeUndefined();
    });
  });
});

