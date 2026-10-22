import { Order, OrderStatus } from '../types';
import { api } from './api';
import { StorageService } from './storageService';

let cachedOrders: Order[] = [];

export const OrderService = {
  async fetchOrders(page = 1, limit = 20): Promise<Order[]> {
    const res = await api.get<any>(`/orders?page=${page}&limit=${limit}`);
    const rawList: any[] = Array.isArray(res.data)
      ? res.data
      : (res.data?.orders || res.data?.items || []);

    if (res.success && Array.isArray(rawList)) {
      const mapped: Order[] = rawList.map((item: any) => ({
        id: item._id || item.id,
        orderNumber: item.orderNumber || `#W${(item._id || '').slice(-8).toUpperCase()}`,
        date: new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: item.status || 'PLACED',
        itemCount: item.items?.length || 0,
        items: (item.items || []).map((it: any) => ({
          productId: it.productId?._id || it.productId || '',
          name: it.name || it.title || 'Grocery Item',
          quantity: it.quantity || 1,
          price: it.unitPrice || it.price || 0,
        })),
        subtotal: item.itemSubtotal || item.pricing?.subtotal || item.subtotal || 0,
        discount: item.discount || item.pricing?.discount || 0,
        shoppingCoinsUsed: item.coinsUsed || item.pricing?.coinsUsed || item.shoppingCoinsUsed || 0,
        deliveryFee: item.deliveryFee || item.pricing?.deliveryFee || 0,
        totalAmount: item.totalAmount || item.pricing?.total || 0,
        deliveryAddress: item.deliveryAddress ? {
          id: 'addr_' + (item._id || Date.now()),
          type: item.deliveryAddress.label || 'Home',
          fullName: item.deliveryAddress.fullName || item.deliveryAddress.label || 'Customer',
          phoneNumber: item.deliveryAddress.phoneNumber || '',
          houseFlat: item.deliveryAddress.houseNumber ? `${item.deliveryAddress.houseNumber}, ${item.deliveryAddress.street || ''}`.trim() : (item.deliveryAddress.street || 'Address'),
          areaLandmark: item.deliveryAddress.landmark || '',
          city: item.deliveryAddress.city || 'Ahmedabad',
          pincode: item.deliveryAddress.pincode || '',
          isDefault: true,
        } : (item.address || {
          id: 'addr_' + (item._id || Date.now()),
          type: 'Home',
          name: 'Customer',
          phone: '',
          addressLine: 'Delivery Address',
          landmark: '',
          city: 'Ahmedabad',
          pincode: '',
          isDefault: true,
        }),
        deliverySlot: item.deliverySlot || '9 minutes delivery',
        paymentMethod: item.paymentMethod || 'UPI',
        _id: item._id,
        deliveryOtp: item.deliveryOtp || '4821',
        estimatedArrival: '9 min',
        deliveryPartner: item.deliveryPartner || (item.deliveryPartnerId ? {
          id: item.deliveryPartnerId._id || item.deliveryPartnerId.id,
          name: item.deliveryPartnerId.fullName || item.deliveryPartnerId.name || 'DARSHAN THANKI',
          phone: item.deliveryPartnerId.phoneNumber || item.deliveryPartnerId.phone || '',
          vehicleNumber: item.deliveryPartnerId.vehicleNumber || 'GJ AE 2020',
          rating: item.deliveryPartnerId.rating || 5,
        } : (item.rider ? {
          id: item.rider.id || item.rider._id,
          name: item.rider.name || item.rider.fullName || 'DARSHAN THANKI',
          phone: item.rider.phone || item.rider.phoneNumber || '',
          vehicleNumber: item.rider.vehicleNumber || 'GJ AE 2020',
          rating: item.rider.rating || 5,
        } : undefined)),
      }));
      cachedOrders = mapped;
      StorageService.saveItem(StorageService.KEYS.ORDERS, mapped);
      return mapped;
    }
    return cachedOrders;
  },

  getOrders(): Order[] {
    return cachedOrders;
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    const existing = cachedOrders.find((o) => o.id === id || o.orderNumber === id);
    if (existing) return existing;

    const res = await api.get<any>(`/orders/${id}`);
    if (res.success && res.data) {
      const item = res.data;
      const mapped: Order = {
        id: item._id || item.id,
        orderNumber: item.orderNumber || `#W${(item._id || '').slice(-8).toUpperCase()}`,
        date: new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        }),
        status: item.status || 'PLACED',
        itemCount: item.items?.length || 0,
        items: (item.items || []).map((it: any) => ({
          productId: it.productId?._id || it.productId || '',
          name: it.name || it.title || 'Item',
          quantity: it.quantity || 1,
          price: it.price || 0,
        })),
        subtotal: item.pricing?.subtotal || item.subtotal || 0,
        discount: item.pricing?.discount || item.discount || 0,
        shoppingCoinsUsed: item.pricing?.coinsUsed || item.shoppingCoinsUsed || 0,
        deliveryFee: item.pricing?.deliveryFee || item.deliveryFee || 0,
        totalAmount: item.pricing?.total || item.totalAmount || 0,
        deliveryAddress: item.address,
        deliverySlot: item.deliverySlot || '9 minutes delivery',
        paymentMethod: item.paymentMethod || 'UPI',
        _id: item._id,
        deliveryOtp: item.deliveryOtp || '4821',
        estimatedArrival: '9 min',
        deliveryPartner: item.deliveryPartner || (item.deliveryPartnerId ? {
          id: item.deliveryPartnerId._id || item.deliveryPartnerId.id,
          name: item.deliveryPartnerId.fullName || item.deliveryPartnerId.name || 'DARSHAN THANKI',
          phone: item.deliveryPartnerId.phoneNumber || item.deliveryPartnerId.phone || '',
          vehicleNumber: item.deliveryPartnerId.vehicleNumber || 'GJ AE 2020',
          rating: item.deliveryPartnerId.rating || 5,
        } : (item.rider ? {
          id: item.rider.id || item.rider._id,
          name: item.rider.name || item.rider.fullName || 'DARSHAN THANKI',
          phone: item.rider.phone || item.rider.phoneNumber || '',
          vehicleNumber: item.rider.vehicleNumber || 'GJ AE 2020',
          rating: item.rider.rating || 5,
        } : undefined)),
      };
      return mapped;
    }
    return undefined;
  },

  async createOrder(data: {
    addressId?: string;
    storeId?: string;
    areaId?: string;
    paymentMethod: string;
    reservationId?: string;
    deliveryInstructions?: string;
    address?: any;
    tip?: number;
    deliveryFee?: number;
    handlingFee?: number;
    items?: {
      productId: string;
      quantity: number;
      name?: string;
      price?: number;
      mrp?: number;
      imageUrl?: string;
      quantityLabel?: string;
    }[];
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    return api.post<any>('/orders', data);
  },

  async cancelOrder(id: string, reason?: string): Promise<{ success: boolean; message?: string }> {
    return api.post<any>(`/orders/${id}/cancel`, { reason });
  },

  getOrdersByStatus(status: 'ALL' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'): Order[] {
    if (status === 'ALL') return cachedOrders;
    if (status === 'ONGOING') {
      return cachedOrders.filter(
        (o) =>
          o.status === 'PLACED' ||
          o.status === 'ACCEPTED' ||
          o.status === 'PACKED' ||
          o.status === 'OUT_FOR_DELIVERY'
      );
    }
    if (status === 'COMPLETED') {
      return cachedOrders.filter((o) => o.status === 'DELIVERED');
    }
    if (status === 'CANCELLED') {
      return cachedOrders.filter((o) => o.status === 'CANCELLED');
    }
    return cachedOrders;
  },

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'PLACED':
        return 'Order Placed';
      case 'ACCEPTED':
        return 'Order Accepted';
      case 'PACKED':
        return 'Packed';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  },
};
