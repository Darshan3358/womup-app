import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Customer Support Tickets')
@Controller('api/v1/support')
export class CustomerSupportController {
  constructor(private readonly usersService: UsersService) {}

  @Post('ticket')
  @ApiOperation({ summary: 'Submit a new customer support ticket' })
  async createTicket(@Body() body: any) {
    return this.usersService.createSupportTicket(body);
  }

  @Get('admin/tickets')
  @ApiOperation({ summary: 'Admin: List all support tickets with status, category and date filters' })
  async getAdminTickets(@Query() query: any) {
    return this.usersService.getAdminSupportTickets(query);
  }

  @Patch('admin/tickets/:id')
  @ApiOperation({ summary: 'Admin: Update ticket status and resolution response' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() body: { status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'; adminResponse?: string; resolvedBy?: string },
  ) {
    return this.usersService.updateSupportTicketStatus(id, body);
  }
}
