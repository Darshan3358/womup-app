import { api } from './api';
import { Address } from '../types';

export interface ServiceabilityResponse {
  serviceable: boolean;
  estimatedDeliveryMinutes?: number;
  storeId?: string;
  storeName?: string;
  deliveryFee?: number;
  message?: string;
}

export const AddressService = {
  async saveAddress(address: {
    type: 'Home' | 'Work' | 'Other' | 'Current';
    fullName: string;
    phoneNumber: string;
    houseFlat: string;
    areaLandmark: string;
    city: string;
    pincode?: string;
    isDefault?: boolean;
    latitude?: number;
    longitude?: number;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    const parts = address.houseFlat.split(',');
    const houseNumber = parts[0]?.trim() || address.houseFlat || 'B-402';
    const street = parts.length > 1 ? parts.slice(1).join(',').trim() : address.areaLandmark || 'Shivalik Heights';

    const payload = {
      label: address.type || 'Home',
      houseNumber,
      street,
      landmark: address.areaLandmark || '',
      city: address.city.split(',')[0].trim() || 'Ahmedabad',
      state: 'Gujarat',
      pincode: address.pincode || '',
      coordinates: address.longitude !== undefined && address.latitude !== undefined
        ? [address.longitude, address.latitude]
        : [],
      isDefault: address.isDefault ?? true,
      deliveryInstructions: '',
    };

    const res = await api.post<any>('/addresses', payload);
    return res;
  },

  async checkServiceability(lat?: number, lng?: number): Promise<ServiceabilityResponse> {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return {
        serviceable: false,
        estimatedDeliveryMinutes: 0,
        storeName: 'Location Required',
        deliveryFee: 0,
        message: 'Valid GPS coordinates are required to verify serviceability.',
      };
    }
    const res = await api.post<any>('/serviceability/check', {
      latitude: lat,
      longitude: lng,
    });
    if (res.success && res.data) {
      return res.data;
    }
    return {
      serviceable: false,
      estimatedDeliveryMinutes: 0,
      storeName: 'Unserviceable Area',
      deliveryFee: 0,
    };
  },

  async getAddresses(): Promise<Address[]> {
    const res = await api.get<any>('/addresses');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map((item: any) => ({
        id: item._id,
        type: item.label,
        fullName: item.fullName || 'Customer',
        phoneNumber: item.phoneNumber || '',
        houseFlat: `${item.houseNumber}, ${item.street}`,
        areaLandmark: item.landmark || '',
        city: item.city,
        pincode: item.pincode,
        isDefault: item.isDefault,
      }));
    }
    return [];
  },

  async deleteAddress(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete<any>(`/addresses/${id}`);
    return res;
  },
};
