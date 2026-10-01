import { IsNotEmpty, IsString, IsEmail, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StoreSendOtpDto {
  @ApiProperty({ example: 'picker@wormup.com', description: 'Registered email address' })
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class StoreVerifyOtpDto {
  @ApiProperty({ example: 'picker@wormup.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: '654321', description: '6-digit OTP' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}

export class UpdateShiftDto {
  @ApiProperty({ example: true })
  @IsNotEmpty()
  isOnShift: boolean;
}

export class RegisterStoreDto {
  @ApiProperty({ example: 'Raj Super Mart', description: 'Name of the dark store' })
  @IsNotEmpty()
  @IsString()
  storeName: string;

  @ApiProperty({ example: 'Raj Patel', description: 'Store owner or manager full name' })
  @IsNotEmpty()
  @IsString()
  ownerName: string;

  @ApiProperty({ example: '+919876543210', description: 'Store contact phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'raj@example.com', description: 'Store contact email' })
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: '65f...cityId', description: 'ID of active city selected from master data' })
  @IsNotEmpty()
  @IsString()
  cityId: string;

  @ApiProperty({ example: '65f...areaId', description: 'ID of active and available area in selected city' })
  @IsNotEmpty()
  @IsString()
  areaId: string;

  @ApiProperty({ example: 'MySecurePass123', description: 'Owner login password' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 64, { message: 'Password must be at least 6 characters' })
  password: string;
}

