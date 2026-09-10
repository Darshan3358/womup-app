import { IsString, IsNotEmpty, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Customer email address to send OTP' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'verification_uuid_123' })
  @IsString()
  @IsNotEmpty()
  verificationId: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'verification_uuid_123' })
  @IsString()
  @IsNotEmpty()
  verificationId: string;

  @ApiProperty({ example: 'Darshan Thanki' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '9876543210', required: false, description: '10-digit mobile number' })
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit Indian mobile number' })
  phone?: string;

  @ApiProperty({ example: 'WORM50', required: false })
  @IsString()
  @IsOptional()
  referralCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Valid refresh token string' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
