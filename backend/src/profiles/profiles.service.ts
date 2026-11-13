import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PROFILE_CONSTANTS } from '../common/constants/profile.constants';
import {
  AddPhotoDto,
  SetInterestsDto,
  UpdateLifestyleDto,
  UpdateLocationDto,
  UpsertProfileDto,
} from './dto';
import { UserStatus } from '@prisma/client';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  get maxPhotos(): number {
    return (
      this.configService.get<number>('MAX_PROFILE_PHOTOS') ??
      PROFILE_CONSTANTS.DEFAULT_MAX_PHOTOS
    );
  }

  get minAge(): number {
    return (
      this.configService.get<number>('MIN_PROFILE_AGE') ??
      PROFILE_CONSTANTS.DEFAULT_MIN_AGE
    );
  }

  get maxInterests(): number {
    return (
      this.configService.get<number>('MAX_PROFILE_INTERESTS') ??
      PROFILE_CONSTANTS.DEFAULT_MAX_INTERESTS
    );
  }

  /**
   * Helper: calculate age from date of birth.
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }
    return age;
  }

  /**
   * Evaluates if a profile meets minimum requirements for matching discovery.
   */
  private evaluateCompleteness(profile: {
    displayName?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    city?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    lifestyle?: any | null;
  }): boolean {
    return Boolean(
      profile.displayName &&
        profile.dateOfBirth &&
        profile.gender &&
        profile.city &&
        profile.budgetMin !== null &&
        profile.budgetMin !== undefined &&
        profile.budgetMax !== null &&
        profile.budgetMax !== undefined &&
        profile.budgetMax > 0 &&
        profile.lifestyle,
    );
  }

  /**
   * Fetch current authenticated user's full profile.
   */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        lifestyle: true,
        photos: {
          orderBy: { order: 'asc' },
        },
        location: true,
        interests: {
          orderBy: { interestName: 'asc' },
        },
      },
    });

    return profile;
  }

  /**
   * Fetch current authenticated user's lifestyle preferences.
   */
  async getMyLifestyle(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: {
        lifestyle: true,
      },
    });

    return profile?.lifestyle || null;
  }

  /**
   * Create or update current user's core profile.
   */
  async upsertMyProfile(userId: string, dto: UpsertProfileDto) {
    // 1. Budget validation
    if (dto.budgetMin > dto.budgetMax) {
      throw new BadRequestException('budgetMin cannot exceed budgetMax');
    }

    // 2. Minimum age validation (18+ requirement)
    const dob = new Date(dto.dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new BadRequestException('Invalid date of birth format');
    }
    const age = this.calculateAge(dob);
    if (age < this.minAge) {
      throw new BadRequestException(
        `User must be at least ${this.minAge} years old`,
      );
    }

    const moveIn = dto.moveInDate ? new Date(dto.moveInDate) : null;

    // 3. Upsert profile record
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: dto.displayName.trim(),
        dateOfBirth: dob,
        gender: dto.gender,
        bio: dto.bio?.trim() || null,
        occupation: dto.occupation?.trim() || null,
        companyOrCollege: dto.companyOrCollege?.trim() || null,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        city: dto.city.trim(),
        preferredLocality: dto.preferredLocality?.trim() || null,
        moveInDate: moveIn,
        lifestyle: {
          create: {},
        },
      },
      update: {
        displayName: dto.displayName.trim(),
        dateOfBirth: dob,
        gender: dto.gender,
        bio: dto.bio?.trim() || null,
        occupation: dto.occupation?.trim() || null,
        companyOrCollege: dto.companyOrCollege?.trim() || null,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        city: dto.city.trim(),
        preferredLocality: dto.preferredLocality?.trim() || null,
        moveInDate: moveIn,
      },
      include: {
        lifestyle: true,
        photos: {
          orderBy: { order: 'asc' },
        },
        location: true,
        interests: true,
      },
    });

    // 4. Update profile completion flag
    const isComplete = this.evaluateCompleteness(profile);
    if (profile.isComplete !== isComplete) {
      return this.prisma.userProfile.update({
        where: { id: profile.id },
        data: { isComplete },
        include: {
          lifestyle: true,
          photos: {
            orderBy: { order: 'asc' },
          },
          location: true,
          interests: true,
        },
      });
    }

    return profile;
  }

  /**
   * Fetch public profile for another user (IDOR safe & privacy sanitized).
   */
  async getPublicProfile(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        status: true,
        profile: {
          include: {
            lifestyle: true,
            photos: {
              orderBy: { order: 'asc' },
            },
            location: {
              select: {
                cityName: true,
                areaName: true,
              },
            },
            interests: {
              select: {
                interestName: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE || !user.profile) {
      throw new NotFoundException('Profile not found or unavailable');
    }

    const { profile } = user;
    const age = this.calculateAge(profile.dateOfBirth);

    return {
      userId: user.id,
      displayName: profile.displayName,
      age,
      gender: profile.gender,
      bio: profile.bio,
      occupation: profile.occupation,
      companyOrCollege: profile.companyOrCollege,
      budgetMin: profile.budgetMin,
      budgetMax: profile.budgetMax,
      city: profile.city,
      preferredLocality: profile.preferredLocality,
      moveInDate: profile.moveInDate,
      isComplete: profile.isComplete,
      lifestyle: profile.lifestyle,
      photos: profile.photos.map((p) => ({
        id: p.id,
        url: p.url,
        order: p.order,
        isPrimary: p.isPrimary,
      })),
      location: profile.location,
      interests: profile.interests,
    };
  }

  /**
   * Update current user's lifestyle preferences.
   */
  async updateLifestyle(userId: string, dto: UpdateLifestyleDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { lifestyle: true },
    });

    if (!profile) {
      throw new NotFoundException(
        'Profile not found. Please create your profile before updating lifestyle preferences.',
      );
    }

    const lifestyle = await this.prisma.lifestylePreferences.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        ...dto,
      },
      update: {
        ...dto,
      },
    });

    // Check if completeness changed
    const isComplete = this.evaluateCompleteness({
      ...profile,
      lifestyle,
    });

    if (profile.isComplete !== isComplete) {
      await this.prisma.userProfile.update({
        where: { id: profile.id },
        data: { isComplete },
      });
    }

    return {
      lifestyle,
      isComplete,
    };
  }

  /**
   * Update current user's location.
   */
  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Profile not found. Please create your profile before setting location.',
      );
    }

    const location = await this.prisma.userLocation.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        latitude: dto.latitude ?? 0.0,
        longitude: dto.longitude ?? 0.0,
        cityName: dto.cityName.trim(),
        areaName: dto.areaName?.trim() || null,
      },
      update: {
        latitude: dto.latitude ?? 0.0,
        longitude: dto.longitude ?? 0.0,
        cityName: dto.cityName.trim(),
        areaName: dto.areaName?.trim() || null,
      },
    });

    return location;
  }

  /**
   * Add a photo to current user's profile.
   */
  async addPhoto(userId: string, dto: AddPhotoDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { photos: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.photos.length >= this.maxPhotos) {
      throw new BadRequestException(
        `You can upload a maximum of ${this.maxPhotos} photos`,
      );
    }

    // If marked as primary, reset existing primary photos
    const isFirstPhoto = profile.photos.length === 0;
    const isPrimary = dto.isPrimary ?? isFirstPhoto;

    return this.prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.userPhoto.updateMany({
          where: { profileId: profile.id },
          data: { isPrimary: false },
        });
      }

      const photo = await tx.userPhoto.create({
        data: {
          profileId: profile.id,
          url: dto.url,
          order: dto.order ?? profile.photos.length,
          isPrimary,
        },
      });

      return photo;
    });
  }

  /**
   * Delete a photo belonging to current user's profile.
   */
  async deletePhoto(userId: string, photoId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const photo = await this.prisma.userPhoto.findFirst({
      where: {
        id: photoId,
        profileId: profile.id,
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found or does not belong to your profile');
    }

    await this.prisma.userPhoto.delete({
      where: { id: photoId },
    });

    // If deleted photo was primary, assign first remaining photo as primary
    if (photo.isPrimary) {
      const remaining = await this.prisma.userPhoto.findFirst({
        where: { profileId: profile.id },
        orderBy: { order: 'asc' },
      });
      if (remaining) {
        await this.prisma.userPhoto.update({
          where: { id: remaining.id },
          data: { isPrimary: true },
        });
      }
    }

    return { message: 'Photo deleted successfully' };
  }

  /**
   * Set or update current user's interests.
   */
  async setInterests(userId: string, dto: SetInterestsDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Atomic sync: remove old interests and insert new unique interests
    return this.prisma.$transaction(async (tx) => {
      await tx.userInterest.deleteMany({
        where: { profileId: profile.id },
      });

      // Deduplicate by interestName (case-insensitive)
      const uniqueInterestsMap = new Map<
        string,
        { interestName: string; category?: string | null }
      >();
      for (const item of dto.interests) {
        const key = item.interestName.trim().toLowerCase();
        if (!uniqueInterestsMap.has(key)) {
          uniqueInterestsMap.set(key, {
            interestName: item.interestName.trim(),
            category: item.category?.trim() || null,
          });
        }
      }

      if (uniqueInterestsMap.size > this.maxInterests) {
        throw new BadRequestException(
          `You can select up to ${this.maxInterests} interests`,
        );
      }

      if (uniqueInterestsMap.size > 0) {
        await tx.userInterest.createMany({
          data: Array.from(uniqueInterestsMap.values()).map((item) => ({
            profileId: profile.id,
            interestName: item.interestName,
            category: item.category,
          })),
        });
      }

      return tx.userInterest.findMany({
        where: { profileId: profile.id },
        orderBy: { interestName: 'asc' },
      });
    });
  }
}
