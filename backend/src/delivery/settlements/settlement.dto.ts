import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RequestPayoutDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}

export class UpdateBankAccountDto {
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  ifsc?: string;
}
