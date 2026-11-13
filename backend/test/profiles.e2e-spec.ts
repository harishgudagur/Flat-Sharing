import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ProfilesController (e2e)', () => {
  let app: INestApplication;
  const userAEmail = `profile_e2e_a_${Date.now()}@example.com`;
  const userBEmail = `profile_e2e_b_${Date.now()}@example.com`;
  const password = 'Password123!';
  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';
  let createdPhotoId = '';

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

    // Register User A
    const resA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: userAEmail, password })
      .expect(201);
    userAToken = resA.body.data.tokens.accessToken;
    userAId = resA.body.data.user.id;

    // Register User B
    const resB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: userBEmail, password })
      .expect(201);
    userBToken = resB.body.data.tokens.accessToken;
    userBId = resB.body.data.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Security Boundaries (Checklist #5, #7, #20)', () => {
    it('should reject unauthenticated access to /api/v1/profiles/me with 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/profiles/me')
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should reject invalid budget bounds with 400 Bad Request', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/profiles/me')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          displayName: 'Test User',
          dateOfBirth: '1998-04-12',
          gender: 'MALE',
          budgetMin: 30000,
          budgetMax: 10000,
          city: 'Bengaluru',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('Profile & Lifestyle Workflow', () => {
    it('should return null or not found message before profile is created', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/profiles/me')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should create profile for User A successfully', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/profiles/me')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          displayName: 'Alex Rivers',
          dateOfBirth: '1997-08-20',
          gender: 'NON_BINARY',
          bio: 'UI designer seeking flatmate in Koramangala',
          occupation: 'Product Designer',
          companyOrCollege: 'Design Labs',
          budgetMin: 12000,
          budgetMax: 22000,
          city: 'Bengaluru',
          preferredLocality: 'Koramangala 4th Block',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.displayName).toBe('Alex Rivers');
      expect(response.body.data.city).toBe('Bengaluru');
      expect(response.body.data.isComplete).toBe(true);
    });

    it('should update lifestyle preferences for User A', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/profiles/me/lifestyle')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          sleepSchedule: 'NIGHT_OWL',
          cleanliness: 'VERY_CLEAN',
          socialPreference: 'EXTROVERT',
          foodPreference: 'VEGAN',
          workSchedule: 'HYBRID',
          smokingPreference: 'NEVER',
          drinkingPreference: 'OCCASIONALLY',
          petPreference: 'LOVES_PETS',
          privacyPreference: 'HIGH',
          nonNegotiables: ['No smoking indoors', 'Quiet hours after 1 AM'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lifestyle.sleepSchedule).toBe('NIGHT_OWL');
      expect(response.body.data.lifestyle.cleanliness).toBe('VERY_CLEAN');
      expect(response.body.data.lifestyle.nonNegotiables).toContain('No smoking indoors');
      expect(response.body.data.isComplete).toBe(true);
    });

    it('should set location coordinates for User A', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/profiles/me/location')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          latitude: 12.9352,
          longitude: 77.6245,
          cityName: 'Bengaluru',
          areaName: 'Koramangala',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cityName).toBe('Bengaluru');
    });

    it('should add a photo for User A', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/profiles/me/photos')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          url: 'https://cdn.flatmate.app/photos/user_a_1.jpg',
          order: 0,
          isPrimary: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBe('https://cdn.flatmate.app/photos/user_a_1.jpg');
      expect(response.body.data.isPrimary).toBe(true);
      createdPhotoId = response.body.data.id;
    });

    it('should set interests for User A', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/profiles/me/interests')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          interests: [
            { interestName: 'Cooking', category: 'Food' },
            { interestName: 'Rock Climbing', category: 'Fitness' },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should fetch User A public profile from User B account (IDOR safe)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/profiles/${userAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.displayName).toBe('Alex Rivers');
      expect(response.body.data.city).toBe('Bengaluru');
      expect(response.body.data.lifestyle.sleepSchedule).toBe('NIGHT_OWL');
      expect(response.body.data.photos).toHaveLength(1);
      // Ensure email/phone are stripped
      expect(response.body.data.email).toBeUndefined();
      expect(response.body.data.phoneNumber).toBeUndefined();
    });

    it('should delete a photo belonging to User A', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/profiles/me/photos/${createdPhotoId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

