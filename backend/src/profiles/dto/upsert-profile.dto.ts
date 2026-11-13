import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class UpsertProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'Display name is required' })
  @MaxLength(60, { message: 'Display name must be under 60 characters' })
  displayName: string;

  @IsDateString({}, { message: 'Please provide a valid ISO date for dateOfBirth (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Date of birth is required' })
  dateOfBirth: string;

  @IsEnum(Gender, {
    message: 'Gender must be MALE, FEMALE, NON_BINARY, or OTHER',
  })
  gender: Gender;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Bio cannot exceed 1000 characters' })
  bio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Occupation cannot exceed 100 characters' })
  occupation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Company or college cannot exceed 100 characters' })
  companyOrCollege?: string;

  @IsInt({ message: 'Minimum budget must be an integer' })
  @Min(0, { message: 'Minimum budget cannot be negative' })
  budgetMin: number;

  @IsInt({ message: 'Maximum budget must be an integer' })
  @Min(0, { message: 'Maximum budget cannot be negative' })
  budgetMax: number;

  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(100, { message: 'City name cannot exceed 100 characters' })
  city: string;

  @IsString()
  @IsOptional()
  @MaxLength(150, { message: 'Preferred locality cannot exceed 150 characters' })
  preferredLocality?: string;

  @IsDateString({}, { message: 'Move in date must be a valid ISO date' })
  @IsOptional()
  moveInDate?: string;
}

