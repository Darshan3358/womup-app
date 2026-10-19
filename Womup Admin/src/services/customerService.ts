import { ApiService } from './api';
import { Customer } from '../types/admin';

const getNestApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:5050/api/v1';
    }
  }
  return 'https://womup-app-uquz.onrender.com/api/v1';
};

const BASE_URL = getNestApiBaseUrl();

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
      const res = await fetch(`${BASE_URL}/admin/customers/${customerId}/kyc`);
      return await res.json();
    } catch (err: any) {
      console.error('[CustomerService] getCustomerKyc error:', err);
      // Fallback via ApiService
      return await ApiService.getCustomerKyc(customerId);
    }
  },

  /**
   * Approve customer KYC document verification
   */
  async approveCustomerKyc(customerId: string): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/admin/customers/${customerId}/approve-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[CustomerService] approveCustomerKyc error:', err);
      return await ApiService.approveCustomerKyc(customerId);
    }
  },

  /**
   * Reject customer KYC with mandatory or optional reason
   */
  async rejectCustomerKyc(customerId: string, rejectionReason?: string): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/admin/customers/${customerId}/reject-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: rejectionReason || 'Aadhaar image not clear',
          reason: rejectionReason || 'Aadhaar image not clear',
        }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[CustomerService] rejectCustomerKyc error:', err);
      return await ApiService.rejectCustomerKyc(customerId, rejectionReason);
    }
  },

  /**
   * Update full customer details from Edit Modal
   */
  async updateCustomer(customerId: string, updateData: Partial<Customer> & Record<string, any>): Promise<any> {
    try {
      // First update via PATCH /api/v1/admin/customers/:id
      const res = await fetch(`${BASE_URL}/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();

      // Also sync through ApiService to maintain store consistency
      await ApiService.updateCustomer(customerId, updateData);

      return data;
    } catch (err: any) {
      console.error('[CustomerService] updateCustomer error:', err);
      const success = await ApiService.updateCustomer(customerId, updateData);
      return { success, message: success ? 'Saved' : 'Failed to update' };
    }
  },

  /**
   * Fetch areas / zones list
   */
  async getAreas(): Promise<Array<{ id: string; name: string }>> {
    try {
      const adminBase = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5001'
        : 'https://womup-app-uquz.onrender.com';

      let res = await fetch(`${adminBase}/api/admin/areas`).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`${BASE_URL}/location/areas`).catch(() => null);
      }
      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        if (list.length > 0) {
          return list.map((a: any) => ({
            id: a._id || a.id || a.name,
            name: a.name,
          }));
        }
      }
    } catch (err) {
      console.warn('[CustomerService] getAreas fallback to local zones');
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
