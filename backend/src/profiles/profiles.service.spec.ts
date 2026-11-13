import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Gender, UserStatus } from '@prisma/client';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      userProfile: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      lifestylePreferences: {
        upsert: jest.fn(),
      },
      userLocation: {
        upsert: jest.fn(),
      },
      userPhoto: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      userInterest: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'MAX_PROFILE_PHOTOS') return 6;
              if (key === 'MIN_PROFILE_AGE') return 18;
              if (key === 'MAX_PROFILE_INTERESTS') return 20;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyProfile', () => {
    it('should return full profile for current user', async () => {
      const mockProfile = {
        id: 'prof-1',
        userId: 'user-1',
        displayName: 'John Doe',
        lifestyle: {},
        photos: [],
      };
      prisma.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getMyProfile('user-1');
      expect(result).toEqual(mockProfile);
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.any(Object),
      });
    });
  });

  describe('upsertMyProfile', () => {
    const validDto = {
      displayName: 'Alice Smith',
      dateOfBirth: '2000-01-15',
      gender: Gender.FEMALE,
      budgetMin: 8000,
      budgetMax: 15000,
      city: 'Bengaluru',
      bio: 'Software engineer looking for flatmates',
    };

    it('should throw BadRequestException if budgetMin exceeds budgetMax', async () => {
      await expect(
        service.upsertMyProfile('user-1', {
          ...validDto,
          budgetMin: 20000,
          budgetMax: 10000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if age is less than 18', async () => {
      const futureDob = new Date();
      futureDob.setFullYear(futureDob.getFullYear() - 16); // 16 years old
      await expect(
        service.upsertMyProfile('user-1', {
          ...validDto,
          dateOfBirth: futureDob.toISOString().split('T')[0],
        }),
      ).rejects.toThrow('User must be at least 18 years old');
    });

    it('should create or update profile and evaluate completeness', async () => {
      const mockResult = {
        id: 'prof-1',
        userId: 'user-1',
        ...validDto,
        dateOfBirth: new Date(validDto.dateOfBirth),
        lifestyle: { id: 'life-1' },
        photos: [],
        location: null,
        interests: [],
        isComplete: false,
      };

      prisma.userProfile.upsert.mockResolvedValue(mockResult);
      prisma.userProfile.update.mockResolvedValue({
        ...mockResult,
        isComplete: true,
      });

      const result = await service.upsertMyProfile('user-1', validDto);
      expect(result.isComplete).toBe(true);
      expect(prisma.userProfile.upsert).toHaveBeenCalled();
    });
  });

  describe('getPublicProfile', () => {
    it('should throw NotFoundException if user does not exist or is not active', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getPublicProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user has no profile', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        status: UserStatus.ACTIVE,
        profile: null,
      });

      await expect(service.getPublicProfile('user-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return sanitized public profile without sensitive fields', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-3',
        status: UserStatus.ACTIVE,
        profile: {
          id: 'prof-3',
          displayName: 'Bob',
          dateOfBirth: new Date('1995-06-20'),
          gender: Gender.MALE,
          city: 'Mumbai',
          budgetMin: 12000,
          budgetMax: 20000,
          isComplete: true,
          lifestyle: { sleepSchedule: 'EARLY_BIRD' },
          photos: [{ id: 'ph-1', url: 'https://example.com/p.jpg', order: 0, isPrimary: true }],
          location: { cityName: 'Mumbai', areaName: 'Bandra' },
          interests: [{ interestName: 'Tech', category: 'Career' }],
        },
      });

      const result = await service.getPublicProfile('user-3');
      expect(result.userId).toBe('user-3');
      expect(result.displayName).toBe('Bob');
      expect(result.age).toBeGreaterThanOrEqual(18);
      expect((result as any).passwordHash).toBeUndefined();
      expect((result as any).email).toBeUndefined();
    });
  });

  describe('updateLifestyle', () => {
    it('should throw NotFoundException if profile does not exist yet', async () => {
      prisma.userProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLifestyle('user-1', { sleepSchedule: 'NIGHT_OWL' as any }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update lifestyle preferences and return result', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        displayName: 'John',
        dateOfBirth: new Date('2000-01-01'),
        gender: Gender.MALE,
        city: 'Delhi',
        budgetMin: 10000,
        budgetMax: 15000,
        isComplete: true,
      });

      prisma.lifestylePreferences.upsert.mockResolvedValue({
        id: 'life-1',
        profileId: 'prof-1',
        sleepSchedule: 'NIGHT_OWL',
      });

      const result = await service.updateLifestyle('user-1', {
        sleepSchedule: 'NIGHT_OWL' as any,
      });

      expect(result.lifestyle.sleepSchedule).toBe('NIGHT_OWL');
      expect(result.isComplete).toBe(true);
    });
  });

  describe('manage photos', () => {
    it('should reject adding photo if max 6 photos limit is reached', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        photos: [{}, {}, {}, {}, {}, {}], // 6 existing photos
      });

      await expect(
        service.addPhoto('user-1', { url: 'https://example.com/img.jpg' }),
      ).rejects.toThrow('You can upload a maximum of 6 photos');
    });

    it('should add photo and set as primary if first photo', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        photos: [],
      });

      prisma.userPhoto.create.mockResolvedValue({
        id: 'ph-new',
        profileId: 'prof-1',
        url: 'https://example.com/img.jpg',
        isPrimary: true,
      });

      const photo = await service.addPhoto('user-1', {
        url: 'https://example.com/img.jpg',
      });

      expect(photo.isPrimary).toBe(true);
    });

    it('should throw NotFoundException if deleting non-existent photo', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({ id: 'prof-1' });
      prisma.userPhoto.findFirst.mockResolvedValue(null);

      await expect(service.deletePhoto('user-1', 'ph-missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setInterests', () => {
    it('should deduplicate and set unique interests', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({ id: 'prof-1' });
      prisma.userInterest.findMany.mockResolvedValue([
        { id: 'int-1', interestName: 'Music', category: 'Hobby' },
      ]);

      const result = await service.setInterests('user-1', {
        interests: [
          { interestName: 'Music', category: 'Hobby' },
          { interestName: 'music', category: 'Hobby' }, // duplicate case
        ],
      });

      expect(prisma.userInterest.createMany).toHaveBeenCalledWith({
        data: [{ profileId: 'prof-1', interestName: 'Music', category: 'Hobby' }],
      });
      expect(result).toHaveLength(1);
    });
  });
});

