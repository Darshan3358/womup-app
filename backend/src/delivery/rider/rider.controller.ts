import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { RiderService } from './rider.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class DutyStatusDto {
  @IsBoolean()
  isOnline: boolean;
}

class LocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsString()
  orderId?: string;
}

@ApiTags('Delivery Partner Profile & Operations')
@Controller('api/v1/delivery')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated rider profile from DB' })
  async getProfile(@CurrentUser() user: any) {
    return this.riderService.getProfile(user.id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get live rider dashboard metrics and active delivery offer' })
  async getDashboard(@CurrentUser() user: any) {
    return this.riderService.getDashboard(user.id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current rider duty status' })
  async getDutyStatus(@CurrentUser() user: any) {
    return this.riderService.getDutyStatus(user.id);
  }

  @Post('status')
  @ApiOperation({ summary: 'Toggle rider online/offline duty status' })
  async updateDutyStatus(@CurrentUser() user: any, @Body() body: DutyStatusDto) {
    return this.riderService.updateDutyStatus(user.id, body.isOnline);
  }

  @Post('location')
  @ApiOperation({ summary: 'Post GPS telemetry and broadcast to real-time tracking gateway' })
  async updateLocation(@CurrentUser() user: any, @Body() body: LocationDto) {
    const userId = user?.id || user?._id || user?.sub;
    if (!userId) {
      return { success: false, message: 'Rider session not authenticated' };
    }
    return this.riderService.updateLocation(userId, body);
  }
}
