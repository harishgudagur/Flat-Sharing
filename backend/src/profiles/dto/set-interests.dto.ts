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
  @ArrayMaxSize(20, { message: 'You can select up to 20 interests' })
  @ValidateNested({ each: true })
  @Type(() => InterestItemDto)
  interests: InterestItemDto[];
}

