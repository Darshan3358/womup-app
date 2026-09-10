import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Addresses')
@Controller('api/v1/addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all saved delivery addresses for current user' })
  async getAddresses(@CurrentUser() user: any) {
    return this.addressesService.findAllByUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a new delivery address' })
  @ApiResponse({ status: 201, description: 'Address created' })
  async createAddress(@CurrentUser() user: any, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(user.id, dto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set address as default primary delivery address' })
  async setDefault(@CurrentUser() user: any, @Param('id') id: string) {
    return this.addressesService.setDefault(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved delivery address' })
  async deleteAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return this.addressesService.delete(user.id, id);
  }
}
