import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PickItemDto {
  @ApiProperty({ example: '8901030383748', description: 'Scanned SKU or EAN barcode' })
  @IsNotEmpty()
  @IsString()
  scannedBarcode: string;
}

export class OutOfStockDto {
  @ApiProperty({ example: 'Damaged or not found in shelf' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: '65b21...4f' })
  @IsOptional()
  @IsString()
  substituteProductId?: string;
}

export class PackCompleteDto {
  @ApiPropertyOptional({ example: 'BAG-9412-8021' })
  @IsOptional()
  @IsString()
  bagBarcode?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  itemCount?: number;

  @ApiPropertyOptional({ example: 1.25 })
  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class ReadyForPickupDto {
  @ApiProperty({ example: 'READY-14' })
  @IsNotEmpty()
  @IsString()
  shelfSlot: string;
}

export class HandoverDto {
  @ApiProperty({ example: 'BAG-9412-8021' })
  @IsNotEmpty()
  @IsString()
  bagBarcode: string;

  @ApiPropertyOptional({ example: 'BAG-9412-8021' })
  @IsOptional()
  @IsString()
  riderBagBarcode?: string;
}
