import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVendorDto {
  @ApiProperty({ example: 'Gokul Vegetables' })
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @ApiPropertyOptional({ example: 'VND001' })
  @IsString()
  @IsOptional()
  vendorCode?: string;

  @ApiProperty({ example: 'Ramesh Patel' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @IsNotEmpty()
  ownerPhone: string;

  @ApiPropertyOptional({ example: 'Vegetables' })
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 'Near Nandanvan Society, Mahesana' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Ahmedabad' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: '380015' })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiPropertyOptional({ example: 23.1288 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 72.5507 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 15, description: 'Shopping Coin percentage set by Admin' })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  shoppingCoinPercent?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  platformCommissionPercent?: number;

  @ApiPropertyOptional({ example: '8:00 AM' })
  @IsString()
  @IsOptional()
  openingTime?: string;

  @ApiPropertyOptional({ example: '9:00 PM' })
  @IsString()
  @IsOptional()
  closingTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'gokul@okhdfcbank' })
  @IsString()
  @IsOptional()
  upiId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  bankAccount?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };

  // ── tbl_vendor SQL Fields ──
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorFirmName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorOwnerName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorGstNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorMobile?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorAlternateMobile?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorAadharNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  businessAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  businessLandmark?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  businessCategoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  talukaId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  districtId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stateId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  businessPincode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankBranch?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ifscCode?: string;

  // KYC Images
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancelledChequeImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorAadharFrontImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorAadharBackImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gstCertificateImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tradeLicenseImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  panCardImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  businessCardImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shopPhotoImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ownerPhotoImage?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  vendorPersantage?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  vendorCustomerPersantage?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  vendorStatus?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorRejectReason?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  isBlocked?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  isSuspended?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorPassword?: string;
}

export class UpdateVendorDto extends CreateVendorDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Vegetables' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'vegetables' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'carrot' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: '#D1FAE5' })
  @IsString()
  @IsOptional()
  bgColor?: string;

  @ApiPropertyOptional({ example: '#10B981' })
  @IsString()
  @IsOptional()
  iconColor?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class VerifyOfflinePaymentDto {
  @ApiProperty({ example: '60d0fe4f...' })
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(1)
  billAmount: number;

  @ApiProperty({ enum: ['COIN', 'WALLET', 'CASH', 'UPI'], example: 'COIN' })
  @IsEnum(['COIN', 'WALLET', 'CASH', 'UPI'])
  paymentMethod: 'COIN' | 'WALLET' | 'CASH' | 'UPI';

  @ApiPropertyOptional({ example: 1500, description: 'Coins used to reduce bill amount' })
  @IsNumber()
  @IsOptional()
  coinsUsed?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerPhone?: string;
}

export class CreateCollectionRequestDto {
  @ApiProperty({ example: 'VND001' })
  @IsString()
  @IsNotEmpty()
  vendorCode: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'Rohit Kumar' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(1)
  billAmount: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsNumber()
  @IsOptional()
  coinsUsed?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  walletUsed?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  cashToCollect?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  upiAmount?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsNumber()
  @IsOptional()
  coinsEarned?: number;

  @ApiProperty({ example: 'COINS' })
  @IsString()
  paymentMethod: string;
}

export class WithdrawWalletDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accountMasked?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ifsc?: string;
}

