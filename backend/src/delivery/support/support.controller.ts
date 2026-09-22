import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class CreateTicketDto {
  category: string;
  description: string;
  orderId?: string;
}

@ApiTags('Delivery Support & Help')
@Controller('api/v1/delivery')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('support/options')
  @ApiOperation({ summary: 'Get operational helpline contacts and report issue categories' })
  async getOptions() {
    return this.supportService.getSupportOptions();
  }

  @Post('support/tickets')
  @ApiOperation({ summary: 'Register operational support ticket' })
  async createTicket(@CurrentUser() user: any, @Body() body: CreateTicketDto) {
    return this.supportService.createTicket(user.id, body);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get recent delivery partner operational notifications' })
  async getNotifications(@CurrentUser() user: any) {
    return this.supportService.getNotifications(user.id);
  }
}
