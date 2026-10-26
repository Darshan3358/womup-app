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

  @ApiProperty({ example: '66f...city_id', required: false })
  @IsString()
  @IsOptional()
  cityId?: string;

  @ApiProperty({ example: 'Ahmedabad' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Ahmedabad', required: false })
  @IsString()
  @IsOptional()
  cityName?: string;

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

  @ApiProperty({ example: 'WORM50', required: false, description: 'Sponsor / referral code' })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiProperty({ example: 'WORM1234', required: false, description: 'Sponsor Code (MLM Tree)' })
  @IsString()
  @IsOptional()
  sponsorCode?: string;

  @ApiProperty({ example: '380015', required: false, description: 'Service PIN code' })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiProperty({ example: 'Ahmedabad', required: false, description: 'City name' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Darshan Kumar Thanki', required: false, description: 'Full name as per Aadhaar' })
  @IsString()
  @IsOptional()
  fullNameAsPerAadhaar?: string;

  @ApiProperty({ example: '123456789012', required: false, description: '12-digit Aadhaar number' })
  @IsString()
  @IsOptional()
  aadhaarNumber?: string;

  @ApiProperty({ example: 'https://...', required: false, description: 'Aadhaar front image URL' })
  @IsString()
  @IsOptional()
  aadhaarFrontImage?: string;

  @ApiProperty({ example: 'https://...', required: false, description: 'Aadhaar back image URL' })
  @IsString()
  @IsOptional()
  aadhaarBackImage?: string;

  @ApiProperty({ example: '65f...cityId', required: false })
  @IsString()
  @IsOptional()
  preferredCityId?: string;

  @ApiProperty({ example: 'Ahmedabad', required: false })
  @IsString()
  @IsOptional()
  preferredCityName?: string;

  @ApiProperty({ example: 'SecurePassword123', required: false, description: 'User login password' })
  @IsString()
  @IsOptional()
  password?: string;
}

export class CustomerLoginDto {
  @ApiProperty({ example: 'admin@wormup.com, 9999999999, or WORMADMIN', description: 'Phone, Email, or Sponsor ID' })
  @IsString()
  @IsNotEmpty({ message: 'Please enter your Phone, Email, or Sponsor ID' })
  identifier: string;

  @ApiProperty({ example: 'SecurePassword123', required: false, description: 'User password' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ example: '123456', required: false, description: '6-digit OTP' })
  @IsString()
  @IsOptional()
  otp?: string;
}

export class VerifyAadhaarDto {
  @ApiProperty({ example: '123456789012', description: '12-digit Aadhaar Number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{12}$/, { message: 'Aadhaar number must be exactly 12 digits' })
  aadhaarNumber: string;

  @ApiProperty({ example: 'Darshan Kumar Thanki', description: 'Full name as per Aadhaar card' })
  @IsString()
  @IsNotEmpty()
  fullNameAsPerAadhaar: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Valid refresh token string' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class GoogleAuthDto {
  @ApiProperty({ required: false, description: 'Google Identity JWT ID Token' })
  @IsString()
  @IsOptional()
  credential?: string;

  @ApiProperty({ example: 'customer@gmail.com', required: true, description: 'User Gmail address' })
  @IsEmail({}, { message: 'Please provide a valid Google email address' })
  email: string;

  @ApiProperty({ example: 'Mukesh Thanki', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '1029384756', required: false })
  @IsString()
  @IsOptional()
  googleId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  photoUrl?: string;
}

export class LinkPhoneDto {
  @ApiProperty({ example: '9876543210', description: '10-digit mobile number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ required: false, description: 'User ID if linking without bearer token' })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@wormup.com', required: false, description: 'Admin Email or Mobile' })
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiProperty({ example: 'admin123', required: false, description: 'Admin Password or PIN' })
  @IsString()
  @IsOptional()
  password?: string;
}

