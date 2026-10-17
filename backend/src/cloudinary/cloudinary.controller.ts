import 'multer';
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
import { DeliveryPartner, DeliveryPartnerDocument } from '../delivery/schemas/delivery-partner.schema';
import { Vendor, VendorDocument } from '../local-shops/schemas/vendor.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Cloudinary Media Storage')
@Controller(['api/v1/media', 'api/v1/upload', 'api/v1/uploads', 'media', 'upload', 'uploads'])
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(DeliveryPartner.name) private readonly partnerModel: Model<DeliveryPartnerDocument>,
    @InjectModel(Vendor.name) private readonly vendorModel: Model<VendorDocument>,
    @InjectModel(Store.name) private readonly storeModel: Model<StoreDocument>,
  ) {}

  @Post('signature')
  @ApiOperation({ summary: 'Generate signed parameters for direct Cloudinary upload' })
  async getUploadSignature(
    @Body('folder') folder?: string,
    @Body('publicId') publicId?: string,
  ) {
    const signatureData = this.cloudinaryService.generateSignature(folder, publicId);
    return {
      success: true,
      message: 'Upload signature generated successfully',
      data: signatureData,
    };
  }

  @Post(['upload', 'image'])
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

  @Post('save')
  @ApiOperation({ summary: 'Save uploaded media metadata and persist URL to entity in MongoDB' })
  async saveUploadRecord(@Body() body: {
    resourceType?: string;
    url: string;
    publicId: string;
    entityType?: 'customer' | 'user' | 'rider' | 'vendor' | 'store';
    entityId?: string;
    metadata?: any;
  }) {
    if (!body.url || !body.publicId) {
      throw new BadRequestException('url and publicId are required to save upload record');
    }

    const { entityType, entityId, resourceType, url } = body;
    let updatedEntity: any = null;

    if (entityType && entityId) {
      const type = (resourceType || '').toUpperCase();
      if (entityType === 'customer' || entityType === 'user') {
        const user = await this.userModel.findById(entityId);
        if (user) {
          if (type.includes('FRONT') || type === 'AADHAAR_FRONT') {
            user.aadharFrontImage = url;
            user.customer_image_aadhar_front = url;
          } else if (type.includes('BACK') || type === 'AADHAAR_BACK') {
            user.aadharBackImage = url;
            user.customer_image_aadhar_back = url;
          } else if (type.includes('PROFILE') || type.includes('AVATAR')) {
            user.avatar = url;
          }
          await user.save();
          updatedEntity = { id: user._id, role: user.role };
        }
      } else if (entityType === 'rider') {
        const partner = await this.partnerModel.findById(entityId);
        if (partner) {
          if (type.includes('DL_FRONT') || type === 'DL_FRONT') {
            partner.dlImageUrl = url;
          } else if (type.includes('DL_BACK') || type === 'DL_BACK') {
            partner.dlBackUrl = url;
          } else if (type.includes('RC_FRONT') || type === 'RC_FRONT') {
            partner.rcImageUrl = url;
          } else if (type.includes('RC_BACK') || type === 'RC_BACK') {
            partner.rcBackUrl = url;
          } else if (type.includes('AADHAAR_FRONT') || type === 'AADHAAR_FRONT') {
            partner.aadharFrontUrl = url;
          } else if (type.includes('AADHAAR_BACK') || type === 'AADHAAR_BACK') {
            partner.aadharBackUrl = url;
          } else if (type.includes('INSURANCE')) {
            partner.vehicleInsuranceUrl = url;
          } else if (type.includes('PROFILE')) {
            partner.profilePhotoUrl = url;
          }
          await partner.save();
          updatedEntity = { id: partner._id, partnerCode: partner.partnerCode };
        }
      } else if (entityType === 'vendor') {
        const vendor = await this.vendorModel.findById(entityId);
        if (vendor) {
          if (type.includes('AADHAAR_FRONT')) {
            vendor.vendorAadharFrontImage = url;
            if (!vendor.kycDocuments) vendor.kycDocuments = {} as any;
            vendor.kycDocuments.aadhaarUrl = url;
          } else if (type.includes('AADHAAR_BACK')) {
            vendor.vendorAadharBackImage = url;
          } else if (type.includes('PAN')) {
            vendor.panCardImage = url;
            if (!vendor.kycDocuments) vendor.kycDocuments = {} as any;
            vendor.kycDocuments.panUrl = url;
          } else if (type.includes('GST')) {
            vendor.gstCertificateImage = url;
            if (!vendor.kycDocuments) vendor.kycDocuments = {} as any;
            vendor.kycDocuments.gstUrl = url;
          } else if (type.includes('TRADE_LICENSE') || type.includes('LICENSE')) {
            vendor.tradeLicenseImage = url;
            if (!vendor.kycDocuments) vendor.kycDocuments = {} as any;
            vendor.kycDocuments.shopLicenseUrl = url;
          } else if (type.includes('CHEQUE')) {
            vendor.cancelledChequeImage = url;
          } else if (type.includes('CARD') || type.includes('BUSINESS_CARD')) {
            vendor.businessCardImage = url;
          } else if (type.includes('SHOP')) {
            vendor.shopPhotoImage = url;
            vendor.imageUrl = url;
          } else if (type.includes('OWNER')) {
            vendor.ownerPhotoImage = url;
          }
          await vendor.save();
          updatedEntity = { id: vendor._id, vendorCode: vendor.vendorCodeNumber || vendor.loginId };
        }
      } else if (entityType === 'store') {
        const store = await this.storeModel.findById(entityId);
        if (store) {
          if (type.includes('LICENSE')) {
            store.storeLicenseUrl = url;
          } else if (type.includes('AADHAAR_FRONT')) {
            store.ownerAadhaarFrontUrl = url;
          } else if (type.includes('AADHAAR_BACK')) {
            store.ownerAadhaarBackUrl = url;
          } else if (type.includes('SHOP') || type.includes('PHOTO')) {
            if (!store.shopPhotosUrls) store.shopPhotosUrls = [];
            store.shopPhotosUrls.push(url);
            store.imageUrl = url;
          }
          await store.save();
          updatedEntity = { id: store._id, code: store.code };
        }
      }
    }

    return {
      success: true,
      message: 'Upload record saved and entity updated successfully in MongoDB',
      data: {
        ...body,
        updatedEntity,
        savedAt: new Date().toISOString(),
      },
    };
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Delete media by ID or public ID' })
  async deleteMediaById(@Query('publicId') publicIdQuery?: string, @Body('publicId') publicIdBody?: string) {
    const targetPublicId = publicIdQuery || publicIdBody;
    if (!targetPublicId) {
      throw new BadRequestException('publicId is required to delete media');
    }
    const result = await this.cloudinaryService.deleteImage(targetPublicId);
    return {
      success: true,
      message: 'Media deleted successfully',
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
