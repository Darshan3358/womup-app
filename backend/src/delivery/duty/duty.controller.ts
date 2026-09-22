import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DutyService } from './duty.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Delivery Duty & Performance')
@Controller('api/v1/delivery')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DutyController {
  constructor(private readonly dutyService: DutyService) {}

  @Get('duty-history')
  @ApiOperation({ summary: 'Get shift history and attendance hours' })
  async getDutyHistory(@CurrentUser() user: any) {
    return this.dutyService.getDutyHistory(user.id);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get calculated rider performance metrics and customer rating' })
  async getPerformance(@CurrentUser() user: any) {
    return this.dutyService.getPerformance(user.id);
  }
}
