import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { Gender } from '@prisma/client';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let service: any;

  beforeEach(async () => {
    service = {
      getMyProfile: jest.fn(),
      getMyLifestyle: jest.fn(),
      upsertMyProfile: jest.fn(),
      updateLifestyle: jest.fn(),
      updateLocation: jest.fn(),
      addPhoto: jest.fn(),
      deletePhoto: jest.fn(),
      setInterests: jest.fn(),
      getPublicProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get current user profile', async () => {
    service.getMyProfile.mockResolvedValue({ id: 'prof-1', displayName: 'Sam' });

    const result = await controller.getMyProfile('user-1');
    expect(result.data).toEqual({ id: 'prof-1', displayName: 'Sam' });
    expect(result.message).toBe('Profile retrieved successfully');
  });

  it('should get current user lifestyle preferences', async () => {
    service.getMyLifestyle.mockResolvedValue({ sleepSchedule: 'EARLY_BIRD' });

    const result = await controller.getMyLifestyle('user-1');
    expect(result.data).toEqual({ sleepSchedule: 'EARLY_BIRD' });
    expect(result.message).toBe('Lifestyle preferences retrieved successfully');
  });

  it('should upsert profile', async () => {
    const dto = {
      displayName: 'Sam',
      dateOfBirth: '1996-03-22',
      gender: Gender.NON_BINARY,
      budgetMin: 10000,
      budgetMax: 20000,
      city: 'Pune',
    };
    service.upsertMyProfile.mockResolvedValue({ id: 'prof-1', ...dto });

    const result = await controller.upsertMyProfile('user-1', dto);
    expect(result.data.displayName).toBe('Sam');
    expect(result.message).toBe('Profile updated successfully');
  });

  it('should update lifestyle preferences', async () => {
    const dto = { sleepSchedule: 'EARLY_BIRD' as any };
    service.updateLifestyle.mockResolvedValue({
      lifestyle: { sleepSchedule: 'EARLY_BIRD' },
      isComplete: true,
    });

    const result = await controller.updateMyLifestyle('user-1', dto);
    expect(result.data.isComplete).toBe(true);
    expect(result.message).toBe('Lifestyle preferences updated successfully');
  });

  it('should update location', async () => {
    const dto = {
      latitude: 12.9716,
      longitude: 77.5946,
      cityName: 'Bengaluru',
      areaName: 'Indiranagar',
    };
    service.updateLocation.mockResolvedValue({ id: 'loc-1', ...dto });

    const result = await controller.updateMyLocation('user-1', dto);
    expect(result.data.cityName).toBe('Bengaluru');
    expect(result.message).toBe('Location updated successfully');
  });

  it('should add a photo', async () => {
    const dto = { url: 'https://cdn.flatmate.com/photo1.jpg' };
    service.addPhoto.mockResolvedValue({ id: 'photo-1', ...dto });

    const result = await controller.addPhoto('user-1', dto);
    expect(result.data.url).toBe(dto.url);
    expect(result.message).toBe('Photo added successfully');
  });

  it('should delete a photo', async () => {
    service.deletePhoto.mockResolvedValue({ message: 'Photo deleted successfully' });

    const result = await controller.deletePhoto('user-1', 'photo-1');
    expect(result.message).toBe('Photo deleted successfully');
    expect(result.data).toBeNull();
  });

  it('should set interests', async () => {
    const dto = { interests: [{ interestName: 'Reading', category: 'Leisure' }] };
    service.setInterests.mockResolvedValue([{ id: 'int-1', interestName: 'Reading' }]);

    const result = await controller.setMyInterests('user-1', dto);
    expect(result.data).toHaveLength(1);
    expect(result.message).toBe('Interests updated successfully');
  });

  it('should get public profile of another user', async () => {
    service.getPublicProfile.mockResolvedValue({ userId: 'user-2', displayName: 'Jane' });

    const result = await controller.getPublicProfile('user-2');
    expect(result.data.displayName).toBe('Jane');
  });
});

