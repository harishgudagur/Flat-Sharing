import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const testEmail = `e2e_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let accessToken = '';
  let refreshToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully and return standard envelope', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.statusCode).toBe(201);
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      accessToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should fail with 409 Conflict if email is already registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(409);
    });

    it('should fail with 400 Bad Request if validation rules fail', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'short',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      accessToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should return 401 Unauthorized for invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should reject request without Bearer token with 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return current user profile when valid Bearer token provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testEmail);
    });
  });

  describe('Rate Limiting & Throttling (Security Checklist #11)', () => {
    it('should trigger 429 Too Many Requests when rate limit is exceeded on /otp/send', async () => {
      const throttledIdentifier = `throttle_${Date.now()}@example.com`;

      // Call 1: OK
      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/send')
        .send({ identifier: throttledIdentifier, purpose: 'LOGIN' })
        .expect(200);

      // Call 2: rate limit or cooldown
      // Send 3 more requests in rapid succession to exceed the endpoint limit (limit: 3)
      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/send')
        .send({ identifier: throttledIdentifier, purpose: 'LOGIN' });

      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/send')
        .send({ identifier: throttledIdentifier, purpose: 'LOGIN' });

      // 4th request must trigger 429 Too Many Requests
      const throttledResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/otp/send')
        .send({ identifier: throttledIdentifier, purpose: 'LOGIN' })
        .expect(429);

      expect(throttledResponse.body.statusCode).toBe(429);
      expect(throttledResponse.body.message).toContain('ThrottlerException');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate tokens and return a new token pair', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken).not.toBe(refreshToken);

      // Save new rotated token
      refreshToken = response.body.data.refreshToken;
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should log out successfully and revoke the refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

