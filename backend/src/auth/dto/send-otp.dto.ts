import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OtpPurpose } from '@prisma/client';

export class SendOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Phone number or email is required' })
  identifier: string;

  @IsEnum(OtpPurpose, {
    message:
      'Purpose must be one of: REGISTRATION, LOGIN, PHONE_VERIFY, EMAIL_VERIFY, PASSWORD_RESET',
  })
  purpose: OtpPurpose;
}

