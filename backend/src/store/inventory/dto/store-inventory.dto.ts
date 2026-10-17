import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockAdjustmentDto {
  @ApiProperty({ example: -5, description: 'Quantity difference (negative for damage, positive for return)' })
  @IsNotEmpty()
  @IsNumber()
  delta: number;

  @ApiProperty({ example: 'Damaged item removed from shelf' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'DAMAGE', enum: ['DAMAGE', 'RETURN', 'ADJUSTMENT'] })
  @IsOptional()
  @IsString()
  changeType?: string;

  @ApiPropertyOptional({ example: '6aa11866c6c3e5984e2ef5ef', description: 'Optional variant ID for variant-level stock adjustment' })
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class RestockDto {
  @ApiProperty({ example: 50, description: 'Units received' })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 'BAT-2026-SEP-09' })
  @IsOptional()
  @IsString()
  batchNumber?: string;
}

export class UpdateShelfLocationDto {
  @ApiProperty({ example: 'A3-R2', description: 'Shelf location format: Aisle-Rack e.g. A3-R2' })
  @IsNotEmpty()
  @IsString()
  shelfLocation: string;
}

export class StoreAddProductVariantDto {
  @ApiPropertyOptional({ example: '250 g' })
  @IsOptional()
  @IsString()
  packSize?: string;

  @ApiPropertyOptional({ example: 13 })
  @IsOptional()
  @IsNumber()
  sellingPrice?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  mrp?: number;

  @ApiPropertyOptional({ example: 'SKU-TOM-250G' })
  @IsOptional()
  @IsString()
  sku?: string;
}

export class StoreAddProductDto {
  @ApiProperty({ example: 'Fresh Tomato' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Vegetables' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Farm Fresh' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Locally grown fresh tomatoes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [StoreAddProductVariantDto] })
  @IsOptional()
  variants?: StoreAddProductVariantDto[];

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  initialStock?: number;

  @ApiPropertyOptional({ example: 'A3-R2' })
  @IsOptional()
  @IsString()
  shelfLocation?: string;
}

