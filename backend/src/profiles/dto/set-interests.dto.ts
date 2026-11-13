import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PROFILE_CONSTANTS } from '../../common/constants/profile.constants';

export class InterestItemDto {
  @IsString()
  @IsNotEmpty({ message: 'interestName cannot be empty' })
  @MaxLength(50, { message: 'interestName cannot exceed 50 characters' })
  interestName: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'category cannot exceed 50 characters' })
  category?: string;
}

export class SetInterestsDto {
  @IsArray({ message: 'interests must be an array' })
  @ArrayMaxSize(PROFILE_CONSTANTS.DEFAULT_MAX_INTERESTS, {
    message: `You can select up to ${PROFILE_CONSTANTS.DEFAULT_MAX_INTERESTS} interests`,
  })
  @ValidateNested({ each: true })
  @Type(() => InterestItemDto)
  interests: InterestItemDto[];
}


