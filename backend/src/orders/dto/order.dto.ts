import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1', description: 'Selected Address ID', required: false })
  @IsString()
  @IsOptional()
  addressId?: string;

  @ApiProperty({ description: 'Optional specific Dark Store ID', required: false })
  @IsString()
  @IsOptional()
  storeId?: string;

  @ApiProperty({ description: 'Optional Area ID', required: false })
  @IsString()
  @IsOptional()
  areaId?: string;

  @ApiProperty({ required: false, description: 'Optional delivery address payload if addressId is not in DB' })
  @IsOptional()
  address?: {
    houseFlat?: string;
    houseNumber?: string;
    street?: string;
    areaLandmark?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    label?: string;
    type?: string;
  };

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

  @ApiProperty({ example: 20, required: false, description: 'Tip amount for delivery partner' })
  @IsOptional()
  tip?: number;

  @ApiProperty({ example: 40, required: false, description: 'Calculated dynamic delivery fee' })
  @IsOptional()
  deliveryFee?: number;

  @IsOptional()
  handlingFee?: number;

  @IsOptional()
  convenienceFee?: number;

  @IsOptional()
  mrpSubtotal?: number;

  @IsOptional()
  deliveryDistanceKm?: number;

  @IsOptional()
  deliveryRatePerKm?: number;

  @IsOptional()
  deliveryMinFee?: number;

  @IsOptional()
  deliveryMaxFee?: number;

  @IsOptional()
  deliveryRateSource?: string;

  @IsOptional()
  deliveryDistanceMeters?: number;

  @IsOptional()
  rawDeliveryFee?: number;

  @IsOptional()
  floorApplied?: boolean;

  @IsOptional()
  capApplied?: boolean;

  @IsOptional()
  roundingPolicy?: string;

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
