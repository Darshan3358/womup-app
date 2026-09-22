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
