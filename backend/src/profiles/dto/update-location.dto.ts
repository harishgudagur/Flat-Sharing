import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO for updating user's preferred search location / apartment area.
 * - cityName: The metropolitan city (e.g., Bengaluru, Mumbai, Delhi).
 * - areaName: Specific locality or neighborhood (e.g., Koramangala 4th Block, Bandra West).
 * - latitude & longitude: GPS coordinates of the preferred neighborhood used for
 *   geographical distance-based flatmate matching (Phase 4 compatibility scoring).
 */
export class UpdateLocationDto {
  @IsLatitude({
    message:
      'latitude must be a valid GPS latitude coordinate between -90 and 90 (e.g. 12.9716 for Bengaluru)',
  })
  @IsOptional()
  latitude?: number;

  @IsLongitude({
    message:
      'longitude must be a valid GPS longitude coordinate between -180 and 180 (e.g. 77.5946 for Bengaluru)',
  })
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsNotEmpty({ message: 'cityName is required (e.g. Bengaluru)' })
  @MaxLength(100, { message: 'cityName cannot exceed 100 characters' })
  cityName: string;

  @IsString()
  @IsOptional()
  @MaxLength(150, { message: 'areaName cannot exceed 150 characters (e.g. Koramangala)' })
  areaName?: string;
}
