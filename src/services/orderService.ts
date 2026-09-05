import { Order, OrderStatus } from '../types';
import { MOCK_ORDERS } from '../data/mockOrders';

export const OrderService = {
  getOrders(): Order[] {
    return MOCK_ORDERS;
  },

  getOrderById(id: string): Order | undefined {
    return MOCK_ORDERS.find((o) => o.id === id || o.orderNumber === id);
  },

  getOrdersByStatus(status: 'ALL' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'): Order[] {
    if (status === 'ALL') return MOCK_ORDERS;
    if (status === 'ONGOING') {
      return MOCK_ORDERS.filter(
        (o) =>
          o.status === 'PLACED' ||
          o.status === 'ACCEPTED' ||
          o.status === 'PACKED' ||
          o.status === 'OUT_FOR_DELIVERY'
      );
    }
    if (status === 'COMPLETED') {
      return MOCK_ORDERS.filter((o) => o.status === 'DELIVERED');
    }
    if (status === 'CANCELLED') {
      return MOCK_ORDERS.filter((o) => o.status === 'CANCELLED');
    }
    return MOCK_ORDERS;
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
