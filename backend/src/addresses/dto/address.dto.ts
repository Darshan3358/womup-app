import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home', enum: ['Home', 'Work', 'Other'] })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'Flat 402, Shivalik Residency' })
  @IsString()
  @IsNotEmpty()
  houseNumber: string;

  @ApiProperty({ example: 'Prahlad Nagar Main Road' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Near Corporate Road Garden', required: false })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiProperty({ example: 'Ahmedabad' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Gujarat', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '380015' })
  @IsString()
  @IsNotEmpty()
  pincode: string;

  @ApiProperty({ example: [72.5714, 23.0225], required: false })
  @IsArray()
  @IsOptional()
  coordinates?: number[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ example: 'Leave with security guard', required: false })
  @IsString()
  @IsOptional()
  deliveryInstructions?: string;
}
