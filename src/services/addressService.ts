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

let _cachedAddresses: Address[] | null = null;
let _cachedAddressesTime = 0;
const ADDRESS_CACHE_TTL = 60 * 1000; // 1 minute in-memory cache

export const AddressService = {
  clearAddressCache() {
    _cachedAddresses = null;
    _cachedAddressesTime = 0;
  },

  async saveAddress(address: {
    type: 'Home' | 'Work' | 'Other' | 'Current';
    fullName: string;
    phoneNumber: string;
    houseFlat: string;
    areaLandmark: string;
    city: string;
    areaId?: string;
    areaName?: string;
    storeId?: string;
    pincode?: string;
    isDefault?: boolean;
    latitude?: number;
    longitude?: number;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    // Ephemeral Current GPS location should NEVER be persisted to MongoDB Saved Addresses
    if (address.type === 'Current') {
      return { success: true, message: 'Current location is transient and not saved to DB' };
    }

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
      areaId: address.areaId,
      areaName: address.areaName,
      storeId: address.storeId,
      pincode: address.pincode || '',
      coordinates: address.longitude !== undefined && address.latitude !== undefined
        ? [address.longitude, address.latitude]
        : [],
      isDefault: address.isDefault ?? true,
      deliveryInstructions: '',
    };

    const res = await api.post<any>('/addresses', payload);
    if (res.success) {
      this.clearAddressCache();
    }
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

  async getAddresses(forceRefresh = false): Promise<Address[]> {
    if (!forceRefresh && _cachedAddresses && Date.now() - _cachedAddressesTime < ADDRESS_CACHE_TTL) {
      return _cachedAddresses;
    }

    const res = await api.get<any>('/addresses');
    if (res.success && Array.isArray(res.data)) {
      const mapped = res.data.map((item: any) => ({
        id: item._id,
        type: item.label,
        fullName: item.fullName || 'Customer',
        phoneNumber: item.phoneNumber || '',
        houseFlat: item.houseNumber ? `${item.houseNumber}, ${item.street}` : (item.street || ''),
        street: item.street || '',
        areaLandmark: item.landmark || '',
        city: item.city || 'Ahmedabad',
        areaId: item.areaId ? item.areaId.toString() : undefined,
        pincode: item.pincode || '',
        isDefault: item.isDefault,
        latitude: item.location?.coordinates?.[1] !== undefined ? Number(item.location.coordinates[1]) : undefined,
        longitude: item.location?.coordinates?.[0] !== undefined ? Number(item.location.coordinates[0]) : undefined,
      }));
      _cachedAddresses = mapped;
      _cachedAddressesTime = Date.now();
      return mapped;
    }
    return _cachedAddresses || [];
  },

  async deleteAddress(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete<any>(`/addresses/${id}`);
    if (res.success) {
      this.clearAddressCache();
    }
    return res;
  },
};
