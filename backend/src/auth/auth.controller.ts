import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RegisterDto, RegisterRiderDto, RefreshTokenDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 4-digit verification OTP to mobile number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and return dual tokens or prompt registration' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Complete new customer registration with optional referral code' })
  @ApiResponse({ status: 201, description: 'User account created with access and refresh tokens' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('delivery-register')
  @ApiOperation({ summary: 'Complete rider registration with verified email and unique mobile number' })
  @ApiResponse({ status: 201, description: 'Rider account created with access and refresh tokens' })
  async registerRider(@Body() dto: RegisterRiderDto) {
    return this.authService.registerRider(dto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate and refresh JWT access token using valid refresh token' })
  @ApiResponse({ status: 200, description: 'New access and refresh tokens' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out current user and invalidate session' })
  @ApiResponse({ status: 200, description: 'Session ended successfully' })
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }
}
