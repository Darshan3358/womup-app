import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeliveryAuthService, RegisterRiderDto } from './delivery-auth.service';
import { IsString, IsNotEmpty, IsEmail, IsOptional, MinLength } from 'class-validator';

class SendOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;
}

class VerifyEmailOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsOptional()
  verificationId?: string;
}

class EmailLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}

class EmailOtpLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

// Backwards-compatible Login DTO
class LegacyLoginDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;
}

@ApiTags('Rider & Delivery Partner Authentication')
@Controller(['api/v1/rider/auth', 'api/v1/delivery/auth'])
export class DeliveryAuthController {
  constructor(private readonly authService: DeliveryAuthService) {}

  /**
   * API 1: Send Email OTP
   * POST /api/v1/rider/auth/send-otp
   */
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 6-digit verification code to rider email' })
  async sendOtp(@Body() body: any) {
    const email = body.email || body.phone;
    return this.authService.sendEmailOtp(email);
  }

  /**
   * API 2: Verify OTP
   * POST /api/v1/rider/auth/verify-otp
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 6-digit email OTP and issue registrationToken' })
  async verifyOtp(@Body() body: any) {
    if (body.email) {
      return this.authService.verifyEmailOtp(body.email, body.otp, body.verificationId);
    }
    // Fallback to phone-based verify
    return this.authService.verifyOtp(body.phone, body.otp);
  }

  /**
   * API 3: Complete Registration
   * POST /api/v1/rider/auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Complete 4-step rider registration with vehicle details' })
  async register(@Body() dto: RegisterRiderDto) {
    return this.authService.registerRider(dto);
  }

  /**
   * API 4: Primary Email + Password Login
   * POST /api/v1/rider/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rider login with email and password' })
  async login(@Body() body: LegacyLoginDto) {
    if (body.email && body.password) {
      return this.authService.loginWithPassword(body.email, body.password);
    }
    if (body.email && !body.password) {
      return this.authService.sendEmailOtp(body.email);
    }
    if (body.phone) {
      return this.authService.sendOtp(body.phone);
    }
    return this.authService.loginWithPassword(body.email || '', body.password || '');
  }

  /**
   * API 5: Login with Email OTP
   * POST /api/v1/rider/auth/login-otp
   */
  @Post('login-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rider login with email and 6-digit OTP' })
  async loginOtp(@Body() dto: EmailOtpLoginDto) {
    return this.authService.loginWithEmailOtp(dto.email, dto.otp);
  }

  /**
   * API 6: Forgot Password Request
   * POST /api/v1/rider/auth/forgot-password
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset OTP code to rider email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * API 7: Reset Password
   * POST /api/v1/rider/auth/reset-password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and set new password' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  /**
   * API 8: Get Profile
   * GET /api/v1/rider/auth/me
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current rider authenticated profile' })
  async getMe(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.headers['x-rider-id'];
    return this.authService.getMe(userId);
  }
}
