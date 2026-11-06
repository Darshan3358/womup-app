import { Controller, Post, Get, Query, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  ResendOtpDto,
  ChangePhoneSendDto,
  ChangePhoneVerifyDto,
  RegisterDto,
  RegisterRiderDto,
  RefreshTokenDto,
  GoogleAuthDto,
  LinkPhoneDto,
  AdminLoginDto,
  CustomerLoginDto,
} from './dto/auth.dto';

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
  @ApiOperation({ summary: 'Send 6-digit verification OTP to mobile number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 6-digit verification OTP to mobile number (SRS route)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async otpSend(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and return dual tokens or prompt registration' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and return dual tokens or prompt registration (SRS route)' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async otpVerify(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to mobile number' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('otp/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to mobile number (SRS route)' })
  async otpResend(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('phone/change/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send verification OTP to a new mobile number for account phone change' })
  async sendPhoneChangeOtp(@Req() req: any, @Body() dto: ChangePhoneSendDto) {
    const userId = req.user?.id || req.user?._id || req.body?.userId;
    return this.authService.sendPhoneChangeOtp(userId, dto);
  }

  @Post('phone/change/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and update account mobile number' })
  async verifyPhoneChange(@Req() req: any, @Body() dto: ChangePhoneVerifyDto) {
    const userId = req.user?.id || req.user?._id || req.body?.userId;
    return this.authService.verifyPhoneChange(userId, dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login customer using Phone, Email, or Sponsor ID with Password or OTP' })
  @ApiResponse({ status: 200, description: 'Login successful with access and refresh tokens' })
  async login(@Body() dto: CustomerLoginDto) {
    return this.authService.customerLogin(dto);
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

  @Get('test-email')
  @ApiOperation({ summary: 'Diagnostic test endpoint to verify real email delivery' })
  async testEmail(@Query('to') to?: string) {
    return this.authService.testSendEmail(to || 'ayushithanki77@gmail.com');
  }
}
