import { IsString, IsNotEmpty, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: 'user@example.com', required: false, description: 'Customer email address to send OTP' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+919876543210', required: false, description: 'Mobile number with country code' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: 'DELIVERY_LOGIN', required: false, description: 'Authentication purpose' })
  @IsString()
  @IsOptional()
  purpose?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'verification_uuid_123', required: false })
  @IsString()
  @IsOptional()
  verificationId?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 'rider@example.com', required: false, description: 'Email address for delivery OTP verification' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'DELIVERY_LOGIN', required: false })
  @IsString()
  @IsOptional()
  purpose?: string;
}

export class RegisterRiderDto {
  @ApiProperty({ example: 'verification_uuid_123' })
  @IsString()
  @IsNotEmpty()
  verificationId: string;

  @ApiProperty({ example: 'rider@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Ramesh Patel' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '9876543210', description: '10-digit mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit Indian mobile number' })
  phoneNumber: string;

  @ApiProperty({ example: 'Ahmedabad' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'EV_SCOOTER' })
  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @ApiProperty({ example: 'GJ-01-AB-1234' })
  @IsString()
  @IsNotEmpty()
  vehicleNumber: string;

  @ApiProperty({ example: 'GJ01 20220001234', required: false })
  @IsString()
  @IsOptional()
  drivingLicenseNumber?: string;

  @ApiProperty({ example: '102, Shivalik Highstreet, Vastrapur', required: false })
  @IsString()
  @IsOptional()
  address?: string;
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
