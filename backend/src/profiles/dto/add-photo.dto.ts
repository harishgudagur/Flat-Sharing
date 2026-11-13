import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class AddPhotoDto {
  @IsString()
  @IsNotEmpty({ message: 'Photo URL is required' })
  @IsUrl({}, { message: 'Photo URL must be a valid URL' })
  url: string;

  @IsInt({ message: 'Order must be an integer' })
  @Min(0, { message: 'Order cannot be negative' })
  @IsOptional()
  order?: number;

  @IsBoolean({ message: 'isPrimary must be a boolean' })
  @IsOptional()
  isPrimary?: boolean;
}

