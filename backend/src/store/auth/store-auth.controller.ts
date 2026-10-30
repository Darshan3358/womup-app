import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoreAuthService } from './store-auth.service';
import {
  StoreSendOtpDto,
  StoreVerifyOtpDto,
  UpdateShiftDto,
  RegisterStoreDto,
} from './dto/store-auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Store App Operations')
@Controller(['api/v1/store', 'store'])
export class StoreAuthController {
  constructor(private readonly storeAuthService: StoreAuthService) {}

  @Post('auth/register')
  @ApiOperation({ summary: 'Self-register a new Dark Store with admin master city and available area' })
  async register(@Body() dto: RegisterStoreDto) {
    return this.storeAuthService.registerStore(dto);
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Login with Store ID and Password (Shared store tablet credentials)' })
  async login(@Body() body: { loginId: string; password: string }) {
    return this.storeAuthService.loginWithStoreCredentials(body.loginId, body.password);
  }

  @Post('auth/send-otp')
  @ApiOperation({ summary: 'Send 6-digit OTP to registered email for Dark Store Staff login' })
  async sendOtp(@Body() dto: StoreSendOtpDto) {
    return this.storeAuthService.sendOtp(dto.email);
  }

  @Post('auth/verify-otp')
  @ApiOperation({ summary: 'Verify OTP and return Store Staff JWT tokens' })
  async verifyOtp(@Body() dto: StoreVerifyOtpDto) {
    return this.storeAuthService.verifyOtp(dto.email, dto.otp);
  }

  @Post('auth/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change Store Login password' })
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword?: string; oldPassword?: string; newPassword: string }
  ) {
    const curPass = body.currentPassword || body.oldPassword || '';
    return this.storeAuthService.changePassword(req.user.id, curPass, body.newPassword);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in store staff profile and store' })
  async getMe(@Request() req: any) {
    return this.storeAuthService.getMe(req.user.id);
  }

  @Patch('me/shift')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle ON/OFF shift duty status' })
  async updateShift(@Request() req: any, @Body() dto: UpdateShiftDto) {
    return this.storeAuthService.updateShift(req.user.id, dto.isOnShift);
  }

  @Get('me/performance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get picker speed, accuracy, and streak metrics' })
  async getPerformance(@Request() req: any) {
    return this.storeAuthService.getPerformance(req.user.id);
  }

  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shift and order picking history' })
  async getHistory(@Request() req: any) {
    return this.storeAuthService.getHistory(req.user.id);
  }

  @Get('earnings/summary')
  @ApiOperation({ summary: 'Get store earnings summary: lifetime, today, pending, available' })
  async getEarningsSummary(
    @Request() req: any,
    @Query('storeId') queryStoreId?: string,
  ) {
    const userId = req?.user?.id || req?.user?._id;
    return this.storeAuthService.getEarningsSummary(userId, queryStoreId);
  }
}
