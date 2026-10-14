import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Toggle hide sensitive items' })
  @IsOptional()
  @IsBoolean()
  hideSensitiveItems?: boolean;

  @ApiPropertyOptional({ description: 'Avatar image URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Birthday stored as DD Month YYYY (e.g. 07 August 2005)' })
  @IsOptional()
  @IsString()
  birthday?: string;

  @ApiPropertyOptional({ description: 'Preferred operational city ID' })
  @IsOptional()
  @IsString()
  preferredCityId?: string;

  @ApiPropertyOptional({ description: 'Preferred operational city name' })
  @IsOptional()
  @IsString()
  preferredCityName?: string;

  // ── tbl_customer fields ──
  @ApiPropertyOptional({ description: 'Surname' })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Father / Husband name' })
  @IsOptional()
  @IsString()
  fatherHusbandName?: string;

  @ApiPropertyOptional({ description: 'Gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Birth date' })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Landmark' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({ description: 'Village' })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional({ description: 'Customer pincode' })
  @IsOptional()
  @IsString()
  customerPincode?: string;

  @ApiPropertyOptional({ description: 'Taluka ID' })
  @IsOptional()
  @IsString()
  talukaId?: string;

  @ApiPropertyOptional({ description: 'District ID' })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiPropertyOptional({ description: 'State ID' })
  @IsOptional()
  @IsString()
  stateId?: string;

  @ApiPropertyOptional({ description: 'Country ID' })
  @IsOptional()
  @IsString()
  countryId?: string;

  // Bank Details
  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Account holder name' })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiPropertyOptional({ description: 'Account number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'IFSC code' })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional({ description: 'Branch name' })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional({ description: 'UPI ID' })
  @IsOptional()
  @IsString()
  upiId?: string;

  // KYC Images
  @ApiPropertyOptional({ description: 'Aadhaar front image URL' })
  @IsOptional()
  @IsString()
  aadharFrontImage?: string;

  @ApiPropertyOptional({ description: 'Aadhaar back image URL' })
  @IsOptional()
  @IsString()
  aadharBackImage?: string;

  // Tokens & Version
  @ApiPropertyOptional({ description: 'Android FCM push token' })
  @IsOptional()
  @IsString()
  androidToken?: string;

  @ApiPropertyOptional({ description: 'iOS APNS push token' })
  @IsOptional()
  @IsString()
  iosToken?: string;

  @ApiPropertyOptional({ description: 'App version' })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiPropertyOptional({ description: 'Customer PIN' })
  @IsOptional()
  @IsString()
  customerPin?: string;
}
