import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { UploadUrlDto, DeleteMediaDto, GetOptimizedUrlDto } from './dto/upload-media.dto';
import { CLOUDINARY_FOLDERS } from './constants/cloudinary-folders.constant';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Cloudinary Media Storage')
@Controller('api/v1/media')
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const targetFolder = folder || CLOUDINARY_FOLDERS.PRODUCTS_MAIN;
    const result = await this.cloudinaryService.uploadImage(file, targetFolder);
    return {
      success: true,
      message: 'Image uploaded successfully to Cloudinary',
      data: result,
    };
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required');
    }
    const targetFolder = folder || CLOUDINARY_FOLDERS.PRODUCTS_GALLERY;
    const results = await this.cloudinaryService.uploadMultipleImages(files, targetFolder);
    return {
      success: true,
      message: `${results.length} images uploaded successfully to Cloudinary`,
      data: results,
    };
  }

  @Post('upload-url')
  async uploadFromUrl(@Body() dto: UploadUrlDto) {
    const targetFolder = dto.folder || CLOUDINARY_FOLDERS.PRODUCTS_MAIN;
    const result = await this.cloudinaryService.uploadFromUrl(dto.url, targetFolder);
    return {
      success: true,
      message: 'Image uploaded successfully from URL to Cloudinary',
      data: result,
    };
  }

  @Delete()
  async deleteMedia(@Body() dto: DeleteMediaDto) {
    const result = await this.cloudinaryService.deleteImage(dto.publicId);
    return {
      success: true,
      message: 'Image deleted successfully from Cloudinary',
      data: result,
    };
  }

  @Get('optimized-url')
  getOptimizedUrl(@Query() query: GetOptimizedUrlDto) {
    if (!query.publicId) {
      throw new BadRequestException('publicId query param is required');
    }
    const url = this.cloudinaryService.getOptimizedUrl(query.publicId, {
      width: query.width ? Number(query.width) : undefined,
      height: query.height ? Number(query.height) : undefined,
      crop: query.crop,
      format: query.format,
      quality: query.quality,
    });
    return {
      success: true,
      data: { url },
    };
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar image file is required');
    }

    const userId = req.user.sub || req.user.userId;
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const result = await this.cloudinaryService.uploadImage(
      file,
      CLOUDINARY_FOLDERS.USERS_AVATARS,
      ['avatar', `user-${userId}`],
    );

    user.avatar = result.url;
    await user.save();

    return {
      success: true,
      message: 'User avatar uploaded and updated successfully in MongoDB',
      data: {
        avatarUrl: result.url,
        publicId: result.publicId,
        user: {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
        },
      },
    };
  }
}
