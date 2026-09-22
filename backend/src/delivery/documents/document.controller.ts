import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Delivery KYC & Vehicle')
@Controller('api/v1/delivery')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('documents')
  @ApiOperation({ summary: 'Get list of rider KYC documents and verification status' })
  async getDocuments(@CurrentUser() user: any) {
    return this.documentService.getDocuments(user.id);
  }

  @Get('vehicle')
  @ApiOperation({ summary: 'Get registered delivery vehicle details' })
  async getVehicle(@CurrentUser() user: any) {
    return this.documentService.getVehicle(user.id);
  }
}
