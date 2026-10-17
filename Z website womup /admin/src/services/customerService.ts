import { AdminApiService, NEST_API_BASE_URL, API_BASE_URL } from './api';
import { Customer } from '../types/admin';

export interface CustomerKycResponse {
  success: boolean;
  data?: {
    kycStatus: number; // 1 = Pending, 2 = Confirmed/Verified, 3 = Rejected
    statusLabel: 'Pending' | 'Verified' | 'Rejected';
    submittedAt: string;
    aadhaarNumber: string;
    rawAadhaarNumber?: string;
    aadhaarFrontUrl: string;
    aadhaarBackUrl: string;
    bankDetails: {
      bankName: string;
      branchName?: string;
      accountHolderName: string;
      accountNumber: string;
      rawAccountNumber?: string;
      ifscCode: string;
      upiId: string;
    };
    personalInfo: {
      firstName: string;
      surname: string;
      fatherHusbandName?: string;
      gender?: string;
      birthdate?: string;
    };
    address?: string;
    landmark?: string;
    village?: string;
    pincode?: string;
    adminNotes?: string;
    kycRejectReason?: string;
  };
  error?: string;
}

export const CustomerService = {
  /**
   * Fetch full customer KYC data (Aadhaar front/back images, personal info, bank details)
   */
  async getCustomerKyc(customerId: string): Promise<CustomerKycResponse> {
    try {
      const res = await fetch(`${NEST_API_BASE_URL}/admin/customers/${customerId}/kyc`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      console.warn('[CustomerService] getCustomerKyc fallback to AdminApiService:', err);
    }
    return await AdminApiService.getCustomerKyc(customerId);
  },

  /**
   * Approve customer KYC document verification
   */
  async approveCustomerKyc(customerId: string): Promise<any> {
    try {
      const res = await fetch(`${NEST_API_BASE_URL}/admin/customers/${customerId}/approve-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      console.warn('[CustomerService] approveCustomerKyc fallback to AdminApiService:', err);
    }
    return await AdminApiService.approveCustomerKyc(customerId);
  },

  /**
   * Reject customer KYC with reason
   */
  async rejectCustomerKyc(customerId: string, rejectionReason?: string): Promise<any> {
    const reason = rejectionReason || 'Aadhaar image not clear';
    try {
      const res = await fetch(`${NEST_API_BASE_URL}/admin/customers/${customerId}/reject-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: reason,
          reason,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      console.warn('[CustomerService] rejectCustomerKyc fallback to AdminApiService:', err);
    }
    return await AdminApiService.rejectCustomerKyc(customerId, reason);
  },

  /**
   * Update full customer details from Edit Modal
   */
  async updateCustomer(customerId: string, updateData: Partial<Customer> & Record<string, any>): Promise<any> {
    try {
      // 1. First sync to Nest API
      await fetch(`${NEST_API_BASE_URL}/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      }).catch(() => null);

      // 2. Sync to Express API
      return await AdminApiService.updateCustomer(customerId, updateData);
    } catch (err: any) {
      console.error('[CustomerService] updateCustomer error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch areas / zones list
   */
  async getAreas(): Promise<Array<{ id: string; name: string }>> {
    try {
      const res = await fetch(`${NEST_API_BASE_URL}/admin/areas`);
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        return data.data.map((a: any) => ({
          id: a._id || a.id || a.name,
          name: a.name,
        }));
      }
    } catch (err) {
      // fallback
    }
    return [
      { id: 'z1', name: 'Bopal' },
      { id: 'z2', name: 'Satellite' },
      { id: 'z3', name: 'Prahlad Nagar' },
      { id: 'z4', name: 'Vastrapur' },
      { id: 'z5', name: 'Bodakdev' },
      { id: 'z6', name: 'Thaltej' },
      { id: 'z7', name: 'Navrangpura' },
      { id: 'z8', name: 'Maninagar' },
      { id: 'z9', name: 'SG Highway' },
      { id: 'z10', name: 'Gota' },
      { id: 'z11', name: 'South Bopal' },
      { id: 'z12', name: 'Ahmedabad' },
    ];
  },
};
