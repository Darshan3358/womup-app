import 'multer';
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { MediaAsset, CloudinaryOptimizedOptions } from './interfaces/media-asset.interface';
import { CLOUDINARY_FOLDERS } from './constants/cloudinary-folders.constant';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn('Cloudinary credentials missing in environment configuration.');
    } else {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.logger.log(`Cloudinary configured successfully for cloud: ${cloudName}`);
    }
  }

  /**
   * Upload an image buffer to Cloudinary
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = CLOUDINARY_FOLDERS.PRODUCTS_MAIN,
    tags: string[] = ['wormup'],
  ): Promise<MediaAsset> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file: File buffer is empty or missing.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          tags,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`);
            return reject(
              new InternalServerErrorException('Failed to upload image to Cloudinary'),
            );
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: (result.resource_type as 'image' | 'video' | 'raw') || 'image',
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Upload an image directly from a remote URL to Cloudinary
   */
  async uploadFromUrl(
    imageUrl: string,
    folder: string = CLOUDINARY_FOLDERS.PRODUCTS_MAIN,
  ): Promise<MediaAsset> {
    try {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: (result.resource_type as 'image' | 'video' | 'raw') || 'image',
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (err: any) {
      this.logger.error(`Cloudinary upload from URL failed: ${err.message}`);
      throw new InternalServerErrorException(`Failed to upload image from URL: ${err.message}`);
    }
  }

  /**
   * Delete an asset from Cloudinary by public ID
   */
  async deleteImage(publicId: string): Promise<{ result: string }> {
    if (!publicId) {
      throw new BadRequestException('Public ID is required to delete an image');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (err: any) {
      this.logger.error(`Failed to delete Cloudinary asset ${publicId}: ${err.message}`);
      throw new InternalServerErrorException(`Could not delete asset: ${err.message}`);
    }
  }

  /**
   * Replace an existing image with a new uploaded file
   */
  async replaceImage(
    oldPublicId: string,
    newFile: Express.Multer.File,
    folder: string = CLOUDINARY_FOLDERS.PRODUCTS_MAIN,
  ): Promise<MediaAsset> {
    if (oldPublicId) {
      try {
        await this.deleteImage(oldPublicId);
      } catch (err) {
        this.logger.warn(`Could not delete old asset ${oldPublicId} during replace: ${err}`);
      }
    }
    return this.uploadImage(newFile, folder);
  }

  /**
   * Upload multiple image buffers to Cloudinary in parallel
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = CLOUDINARY_FOLDERS.PRODUCTS_GALLERY,
  ): Promise<MediaAsset[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload');
    }

    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Build dynamic transformed / optimized delivery URL
   */
  getOptimizedUrl(
    publicId: string,
    options: CloudinaryOptimizedOptions = {},
  ): string {
    const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: format,
      secure: true,
    });
  }

  /**
   * Generate signed Cloudinary upload parameters for secure direct client uploads
   */
  generateSignature(folder = 'wormup/kyc', publicId?: string) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || 'wormup';
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY') || '';
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET') || '';

    const paramsToSign: Record<string, any> = {
      timestamp,
      folder,
    };
    if (publicId) paramsToSign.public_id = publicId;

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      publicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    };
  }
}
