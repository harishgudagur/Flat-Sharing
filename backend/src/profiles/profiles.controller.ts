import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProfilesService } from './profiles.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AddPhotoDto,
  SetInterestsDto,
  UpdateLifestyleDto,
  UpdateLocationDto,
  UpsertProfileDto,
} from './dto';

@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /**
   * Get authenticated user's complete private profile.
   */
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('me')
  async getMyProfile(@CurrentUser('userId') userId: string) {
    const profile = await this.profilesService.getMyProfile(userId);
    return {
      message: profile ? 'Profile retrieved successfully' : 'Profile not created yet',
      data: profile,
    };
  }

  /**
   * Create or update authenticated user's core profile.
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Put('me')
  async upsertMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpsertProfileDto,
  ) {
    const profile = await this.profilesService.upsertMyProfile(userId, dto);
    return {
      message: 'Profile updated successfully',
      data: profile,
    };
  }

  /**
   * Get authenticated user's lifestyle preferences.
   */
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('me/lifestyle')
  async getMyLifestyle(@CurrentUser('userId') userId: string) {
    const lifestyle = await this.profilesService.getMyLifestyle(userId);
    return {
      message: 'Lifestyle preferences retrieved successfully',
      data: lifestyle,
    };
  }

  /**
   * Update authenticated user's lifestyle preferences.
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Put('me/lifestyle')
  async updateMyLifestyle(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateLifestyleDto,
  ) {
    const result = await this.profilesService.updateLifestyle(userId, dto);
    return {
      message: 'Lifestyle preferences updated successfully',
      data: result,
    };
  }

  /**
   * Update authenticated user's preferred search location / apartment area.
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Put('me/location')
  async updateMyLocation(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    const location = await this.profilesService.updateLocation(userId, dto);
    return {
      message: 'Location updated successfully',
      data: location,
    };
  }

  /**
   * Add a photo to authenticated user's profile gallery.
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('me/photos')
  @HttpCode(HttpStatus.CREATED)
  async addPhoto(
    @CurrentUser('userId') userId: string,
    @Body() dto: AddPhotoDto,
  ) {
    const photo = await this.profilesService.addPhoto(userId, dto);
    return {
      message: 'Photo added successfully',
      data: photo,
    };
  }

  /**
   * Remove a photo from authenticated user's profile gallery.
   */
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Delete('me/photos/:photoId')
  async deletePhoto(
    @CurrentUser('userId') userId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    const result = await this.profilesService.deletePhoto(userId, photoId);
    return {
      message: result.message,
      data: null,
    };
  }

  /**
   * Set or update authenticated user's interests.
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Put('me/interests')
  async setMyInterests(
    @CurrentUser('userId') userId: string,
    @Body() dto: SetInterestsDto,
  ) {
    const interests = await this.profilesService.setInterests(userId, dto);
    return {
      message: 'Interests updated successfully',
      data: interests,
    };
  }

  /**
   * Fetch public profile of another user (IDOR sanitized).
   */
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get(':userId')
  async getPublicProfile(@Param('userId', ParseUUIDPipe) targetUserId: string) {
    const profile = await this.profilesService.getPublicProfile(targetUserId);
    return {
      message: 'Profile retrieved successfully',
      data: profile,
    };
  }
}
