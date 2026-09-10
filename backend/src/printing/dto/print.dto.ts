import { IsNumber, IsBoolean, IsString, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PrintQuoteDto {
  @ApiProperty({ example: 5, description: 'Number of pages in document' })
  @IsNumber()
  @Min(1)
  pageCount: number;

  @ApiProperty({ example: 1, description: 'Number of document sets/copies' })
  @IsNumber()
  @Min(1)
  numberOfCopies: number;

  @ApiProperty({ example: false, description: 'Whether color printing is required' })
  @IsBoolean()
  isColor: boolean;

  @ApiProperty({ example: false, description: 'Print on both sides of page', required: false })
  @IsOptional()
  @IsBoolean()
  isDoubleSided?: boolean;

  @ApiProperty({ example: '70 GSM Standard', required: false })
  @IsOptional()
  @IsString()
  paperQuality?: string;

  @ApiProperty({ example: 'none', required: false })
  @IsOptional()
  @IsString()
  binding?: string;
}

export class CreatePrintOrderDto extends PrintQuoteDto {
  @ApiProperty({ example: 'Project_Report_Final.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 's3://wormup-private-prints/doc-98234-uuid.pdf', description: 'Internal private storage key', required: false })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/dp6ukil0g/image/upload/...', required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/dp6ukil0g/image/upload/c_thumb,w_200/...', required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ example: 'image/png', required: false })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiProperty({ example: '1.4 MB', required: false })
  @IsOptional()
  @IsString()
  fileSize?: string;

  @ApiProperty({ example: 'Home — Prahlad Nagar, Ahmedabad', required: false })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({ example: 'guest_123', required: false })
  @IsOptional()
  @IsString()
  guestUserId?: string;

  @ApiProperty({ example: 'a3f7c2d1-stable-uuid-from-async-storage', required: false, description: 'Stable client UUID stored in AsyncStorage for unauthenticated guest order scoping' })
  @IsOptional()
  @IsString()
  guestSessionId?: string;
}

