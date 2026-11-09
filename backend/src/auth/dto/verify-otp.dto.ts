import { IsEnum, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { OtpPurpose } from '@prisma/client';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Phone number or email is required' })
  identifier: string;

  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP code must contain only numbers' })
  code: string;

  @IsEnum(OtpPurpose, {
    message:
      'Purpose must be one of: REGISTRATION, LOGIN, PHONE_VERIFY, EMAIL_VERIFY, PASSWORD_RESET',
  })
  purpose: OtpPurpose;
}

