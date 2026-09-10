import {
  Customer,
  Zone,
  ProductItem,
  InventoryItem,
  Order,
  StaffMember,
  MarketingCampaign,
  CoinLedgerItem,
  AuditLogItem,
} from '../types/admin';

export const INITIAL_ZONES: Zone[] = [
  { id: 'z1', name: 'Bopal', darkStore: 'Bopal Dark Store', activeOrders: 0, gmvSharePercent: 0 },
  { id: 'z2', name: 'Satellite', darkStore: 'Satellite Dark Store', activeOrders: 0, gmvSharePercent: 0 },
  { id: 'z3', name: 'SG Highway', darkStore: 'SG Highway Dark Store', activeOrders: 0, gmvSharePercent: 0 },
  { id: 'z4', name: 'Vastrapur', darkStore: 'Vastrapur Dark Store', activeOrders: 0, gmvSharePercent: 0 },
  { id: 'z5', name: 'Maninagar', darkStore: 'Maninagar Dark Store', activeOrders: 0, gmvSharePercent: 0 },
];

export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_PRODUCTS: ProductItem[] = [];
export const INITIAL_ZONE_PRICES: Record<string, Record<string, number>> = {};
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_STAFF: StaffMember[] = [];
export const INITIAL_CAMPAIGNS: MarketingCampaign[] = [];
export const INITIAL_COIN_LEDGER: CoinLedgerItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];
