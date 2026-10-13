import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRazorpayOrderDto {
  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  billAmount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // 'UPI', 'CARD', etc.

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;
}

export class VerifyRazorpayPaymentDto {
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsNumber()
  billAmount?: number;

  @IsOptional()
  @IsString()
  customerId?: string;
}
