import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1', description: 'Selected Address ID' })
  @IsString()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({ example: 'UPI', enum: ['UPI', 'WALLET', 'CARD', 'NET_BANKING', 'COD'] })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ example: 'RES-1234-uuid', required: false })
  @IsString()
  @IsOptional()
  reservationId?: string;

  @ApiProperty({ example: 'Leave at front door', required: false })
  @IsString()
  @IsOptional()
  deliveryInstructions?: string;

  @ApiProperty({ required: false, description: 'Client cart items to sync before checkout' })
  @IsOptional()
  items?: {
    productId: string;
    quantity: number;
    name?: string;
    price?: number;
    mrp?: number;
    imageUrl?: string;
    quantityLabel?: string;
  }[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'PACKING', description: 'Target order status' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: 'Order items packed by store staff', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CancelOrderDto {
  @ApiProperty({ example: 'Ordered by mistake', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
