import { Controller, Post, Get, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RegisterDto, RegisterRiderDto, RefreshTokenDto, GoogleAuthDto, LinkPhoneDto, AdminLoginDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate Admin and return tokens with Master Sponsor ID WORMUP001' })
  @ApiResponse({ status: 200, description: 'Admin authentication successful' })
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Get('registration-timing')
  @ApiOperation({ summary: 'Check if registration is open (6 AM to 10 PM IST)' })
  async getRegistrationTiming() {
    return this.authService.isRegistrationAllowed();
  }

  @Get('check-pincode')
  @ApiOperation({ summary: 'Validate if pincode is serviceable and approved for registration' })
  @ApiQuery({ name: 'pin', required: false, example: '380015' })
  @ApiQuery({ name: 'pincode', required: false, example: '380015' })
  async checkPincode(@Query('pin') pin?: string, @Query('pincode') pincode?: string) {
    return this.authService.checkPincode(pin || pincode || '');
  }

  @Get('validate-sponsor')
  @ApiOperation({ summary: 'Validate sponsor code or default to Company Root' })
  @ApiQuery({ name: 'code', required: false, example: 'WORM1234' })
  async validateSponsor(@Query('code') code?: string) {
    return this.authService.validateSponsor(code);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate or register customer via Google OAuth' })
  @ApiResponse({ status: 200, description: 'Google authentication successful' })
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleLogin(dto);
  }

  @Post('link-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link mobile number to Google-authenticated user' })
  @ApiResponse({ status: 200, description: 'Mobile number linked successfully' })
  async linkPhone(@Body() dto: LinkPhoneDto) {
    return this.authService.linkPhone(dto);
  }

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

  @Post('token-for-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore session tokens for verified customer' })
  async getTokenForUser(@Body('identifier') identifier: string) {
    return this.authService.getTokenForUser(identifier);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out current user and invalidate session' })
  @ApiResponse({ status: 200, description: 'Session ended successfully' })
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }
}
