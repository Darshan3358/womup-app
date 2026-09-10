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
      landmark: address.areaLandmark || 'Prahlad Nagar',
      city: address.city.split(',')[0].trim() || 'Ahmedabad',
      state: 'Gujarat',
      pincode: address.pincode || '380015',
      coordinates: [address.longitude || 72.5714, address.latitude || 23.0225],
      isDefault: address.isDefault ?? true,
      deliveryInstructions: '',
    };

    const res = await api.post<any>('/addresses', payload);
    return res;
  },

  async checkServiceability(lat: number = 23.0225, lng: number = 72.5714): Promise<ServiceabilityResponse> {
    const res = await api.post<any>('/serviceability/check', {
      latitude: lat,
      longitude: lng,
    });
    if (res.success && res.data) {
      return res.data;
    }
    return {
      serviceable: true,
      estimatedDeliveryMinutes: 9,
      storeName: 'Worm Up Ahmedabad Central Dark Store',
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
