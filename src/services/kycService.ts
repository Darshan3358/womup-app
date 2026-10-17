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

export interface CustomerKycStatusResponse {
  kycStatus: 'pending' | 'verified' | 'rejected' | 'none' | any;
  statusLabel?: string;
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
