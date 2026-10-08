export enum OrderStatus {
  PLACED = 'PLACED',
  PACKING = 'PACKING',
  PACKED = 'PACKED',
  ASSIGNED = 'ASSIGNED',
  GOING_TO_STORE = 'GOING_TO_STORE',
  ARRIVED_AT_STORE = 'ARRIVED_AT_STORE',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  ARRIVED_AT_CUSTOMER = 'ARRIVED_AT_CUSTOMER',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.PACKING, OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.PACKING]: [OrderStatus.PACKED, OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.ASSIGNED, OrderStatus.GOING_TO_STORE, OrderStatus.ARRIVED_AT_STORE, OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.ASSIGNED]: [OrderStatus.GOING_TO_STORE, OrderStatus.ARRIVED_AT_STORE, OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.GOING_TO_STORE]: [OrderStatus.ARRIVED_AT_STORE, OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.ARRIVED_AT_STORE]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.ARRIVED_AT_CUSTOMER, OrderStatus.DELIVERED],
  [OrderStatus.ARRIVED_AT_CUSTOMER]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.PAYMENT_FAILED]: [],
};

