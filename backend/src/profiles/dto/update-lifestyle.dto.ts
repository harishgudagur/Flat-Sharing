import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  CleanlinessLevel,
  FoodPreference,
  HabitPreference,
  PetPreference,
  PrivacyPreference,
  SleepSchedule,
  SocialPreference,
  WorkSchedule,
} from '@prisma/client';

export class UpdateLifestyleDto {
  @IsEnum(SleepSchedule, {
    message: 'sleepSchedule must be EARLY_BIRD, NIGHT_OWL, or FLEXIBLE',
  })
  @IsOptional()
  sleepSchedule?: SleepSchedule;

  @IsEnum(CleanlinessLevel, {
    message: 'cleanliness must be VERY_CLEAN, MODERATE, or RELAXED',
  })
  @IsOptional()
  cleanliness?: CleanlinessLevel;

  @IsEnum(SocialPreference, {
    message: 'socialPreference must be INTROVERT, EXTROVERT, AMBIVERT, or OCCASIONAL_GUESTS',
  })
  @IsOptional()
  socialPreference?: SocialPreference;

  @IsEnum(FoodPreference, {
    message: 'foodPreference must be VEGETARIAN, NON_VEGETARIAN, VEGAN, or EGGETARIAN',
  })
  @IsOptional()
  foodPreference?: FoodPreference;

  @IsEnum(WorkSchedule, {
    message: 'workSchedule must be WORK_FROM_HOME, OFFICE, HYBRID, or STUDENT',
  })
  @IsOptional()
  workSchedule?: WorkSchedule;

  @IsEnum(HabitPreference, {
    message: 'smokingPreference must be NEVER, OUTSIDE_ONLY, OCCASIONALLY, or REGULAR',
  })
  @IsOptional()
  smokingPreference?: HabitPreference;

  @IsEnum(HabitPreference, {
    message: 'drinkingPreference must be NEVER, OUTSIDE_ONLY, OCCASIONALLY, or REGULAR',
  })
  @IsOptional()
  drinkingPreference?: HabitPreference;

  @IsEnum(PetPreference, {
    message: 'petPreference must be LOVES_PETS, NO_PETS, or HAS_PET',
  })
  @IsOptional()
  petPreference?: PetPreference;

  @IsEnum(PrivacyPreference, {
    message: 'privacyPreference must be HIGH, MODERATE, or LOW',
  })
  @IsOptional()
  privacyPreference?: PrivacyPreference;

  @IsArray({ message: 'nonNegotiables must be an array of strings' })
  @IsString({ each: true, message: 'Each non-negotiable must be a string' })
  @MaxLength(100, { each: true, message: 'Each non-negotiable cannot exceed 100 characters' })
  @IsOptional()
  nonNegotiables?: string[];
}

