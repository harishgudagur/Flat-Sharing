import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpPurpose } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let service: any;

  beforeEach(async () => {
    service = {
      register: jest.fn().mockResolvedValue({
        user: { id: 'u-1', email: 'test@example.com' },
        tokens: { accessToken: 'at-1', refreshToken: 'rt-1' },
      }),
      login: jest.fn().mockResolvedValue({
        user: { id: 'u-1', email: 'test@example.com' },
        tokens: { accessToken: 'at-1', refreshToken: 'rt-1' },
      }),
      sendOtp: jest.fn().mockResolvedValue({
        message: 'OTP sent',
        resendAfterSeconds: 60,
        debugOtp: '123456',
      }),
      verifyOtp: jest.fn().mockResolvedValue({
        message: 'OTP verified',
        user: { id: 'u-1' },
        tokens: { accessToken: 'at-1', refreshToken: 'rt-1' },
      }),
      refreshToken: jest.fn().mockResolvedValue({
        accessToken: 'new-at',
        refreshToken: 'new-rt',
      }),
      logout: jest.fn().mockResolvedValue({
        message: 'Logged out successfully',
      }),
      getMe: jest.fn().mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.register and format response', async () => {
    const req = { ip: '127.0.0.1', headers: { 'user-agent': 'Jest' } } as any;
    const result = await controller.register(
      { email: 'test@example.com', password: 'Password123!' },
      req,
    );

    expect(result.message).toBe('User registered successfully');
    expect(result.data.user.id).toBe('u-1');
    expect(service.register).toHaveBeenCalled();
  });

  it('should call authService.login and format response', async () => {
    const req = { ip: '127.0.0.1', headers: { 'user-agent': 'Jest' } } as any;
    const result = await controller.login(
      { identifier: 'test@example.com', password: 'Password123!' },
      req,
    );

    expect(result.message).toBe('Login successful');
    expect(result.data.tokens.accessToken).toBe('at-1');
    expect(service.login).toHaveBeenCalled();
  });

  it('should call authService.sendOtp', async () => {
    const result = await controller.sendOtp({
      identifier: '+919876543210',
      purpose: OtpPurpose.LOGIN,
    });

    expect(result.message).toBe('OTP sent');
    expect(result.data.resendAfterSeconds).toBe(60);
    expect(service.sendOtp).toHaveBeenCalled();
  });

  it('should call authService.verifyOtp', async () => {
    const req = { ip: '127.0.0.1', headers: {} } as any;
    const result = await controller.verifyOtp(
      { identifier: '+919876543210', code: '123456', purpose: OtpPurpose.LOGIN },
      req,
    );

    expect(result.message).toBe('OTP verified');
    expect(result.data.tokens.accessToken).toBe('at-1');
    expect(service.verifyOtp).toHaveBeenCalled();
  });

  it('should call authService.refresh', async () => {
    const req = { ip: '127.0.0.1', headers: {} } as any;
    const result = await controller.refresh({ refreshToken: 'old-rt' }, req);

    expect(result.message).toBe('Tokens refreshed successfully');
    expect(result.data.accessToken).toBe('new-at');
    expect(service.refreshToken).toHaveBeenCalled();
  });

  it('should call authService.logout', async () => {
    const user = { userId: 'u-1', email: 'test@example.com' };
    const result = await controller.logout(user, { refreshToken: 'rt-1' });

    expect(result.message).toBe('Logged out successfully');
    expect(service.logout).toHaveBeenCalledWith('u-1', 'rt-1');
  });

  it('should call authService.getMe', async () => {
    const user = { userId: 'u-1', email: 'test@example.com' };
    const result = await controller.getMe(user);

    expect(result.message).toBe('User profile fetched successfully');
    expect(result.data.id).toBe('u-1');
    expect(service.getMe).toHaveBeenCalledWith('u-1');
  });
});

