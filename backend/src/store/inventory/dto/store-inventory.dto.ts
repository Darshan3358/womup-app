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
