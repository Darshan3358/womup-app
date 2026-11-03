import { api } from './api';

export interface CustomerKycPayload {
  aadharNumber: string;
  fullNameAsPerAadhaar?: string;
  aadharFront?: string;
  aadharBack?: string;
  bankName: string;
  bankBranch?: string;
  branchName?: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  bankProof?: string;
  bankProofUrl?: string;
  passbookImage?: string;
  bankProofImage?: string;
}

export type NormalizedKycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface CustomerKycStatusResponse {
  kycStatus: number | 'pending' | 'verified' | 'rejected' | 'none' | any;
  statusLabel?: string;
  isVerified?: boolean;
  rejectionReason?: string;
  fullNameAsPerAadhaar?: string;
  aadharNumber?: string;
  rawAadhaarNumber?: string;
  bankName?: string;
  accountNumber?: string;
  rawAccountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  submittedAt?: string;
  aadharFront?: string;
  aadharBack?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  bankProofUrl?: string;
  bankDetails?: {
    bankName?: string;
    branchName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    rawAccountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    bankProofUrl?: string;
  };
}

export function normalizeKycStatus(rawStatus: any, rawData?: any): NormalizedKycStatus {
  // If explicitly verified flags are true
  if (
    rawData?.isVerified === true ||
    rawData?.customerIsVerify === 1 ||
    rawData?.aadhaarVerified === true
  ) {
    return 'VERIFIED';
  }

  // Check numeric status: 0=NotSubmitted, 1=Pending, 2=Verified, 3=Rejected
  const num =
    typeof rawStatus === 'number'
      ? rawStatus
      : rawStatus !== undefined && rawStatus !== null && rawStatus !== '' && !isNaN(Number(rawStatus))
      ? Number(rawStatus)
      : null;

  if (num === 2) return 'VERIFIED';
  if (num === 1) return 'PENDING';
  if (num === 3) return 'REJECTED';
  if (num === 0) return 'NOT_SUBMITTED';

  // Check string status
  const str = String(
    rawStatus ??
      rawData?.statusLabel ??
      rawData?.kycStatus ??
      rawData?.verificationStatus ??
      ''
  )
    .toUpperCase()
    .trim();

  if (str === 'VERIFIED' || str === 'APPROVED') return 'VERIFIED';
  if (str === 'PENDING' || str === 'UNDER_REVIEW' || str === 'UNDER_VERIFICATION') return 'PENDING';
  if (str === 'REJECTED') return 'REJECTED';

  return 'NOT_SUBMITTED';
}

export const KycService = {
  async submitKyc(payload: CustomerKycPayload): Promise<{ success: boolean; data?: any; message?: string }> {
    return api.request<any>('/users/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getKycStatus(): Promise<{ success: boolean; data?: CustomerKycStatusResponse; message?: string }> {
    return api.request<CustomerKycStatusResponse>('/users/kyc/status', {
      method: 'GET',
    });
  },
};
