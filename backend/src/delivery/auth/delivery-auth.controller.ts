import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeliveryAuthService } from './delivery-auth.service';

import { IsString, IsNotEmpty } from 'class-validator';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

@ApiTags('Delivery Partner Authentication')
@Controller('api/v1/delivery/auth')
export class DeliveryAuthController {
  constructor(private readonly authService: DeliveryAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request 6-digit verification OTP for delivery partner login' })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  async login(@Body() dto: LoginDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 6-digit OTP and return rider profile with JWT' })
  @ApiResponse({ status: 200, description: 'Rider authenticated' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.otp);
  }
}
