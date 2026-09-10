import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UploadUrlDto {
  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  folder?: string;
}

export class DeleteMediaDto {
  @IsString()
  publicId: string;
}

export class GetOptimizedUrlDto {
  @IsString()
  publicId: string;

  @IsOptional()
  width?: number;

  @IsOptional()
  height?: number;

  @IsOptional()
  crop?: string;

  @IsOptional()
  format?: 'auto' | 'webp' | 'jpg' | 'png';

  @IsOptional()
  quality?: 'auto' | number;
}
