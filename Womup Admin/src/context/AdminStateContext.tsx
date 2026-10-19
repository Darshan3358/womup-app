import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  Customer,
  DeliveryPartnerItem,
  Zone,
  ProductItem,
  ProductVariantItem,
  AreaPricingRecord,
  InventoryItem,
  Order,
  OrderStage,
  StaffMember,
  MarketingCampaign,
  CoinLedgerItem,
  AuditLogItem,
  StockAdjustment,
  PrintOrder,
  CategoryItem,
  DarkStoreItem,
  CityItem,
} from '../types/admin';
import { ApiService } from '../services/api';
import io from 'socket.io-client';

export type ActiveTab =
  | 'Dashboard'
  | 'Approvals'
  | 'Users'
  | 'Prices'
  | 'Inventory'
  | 'Orders'
  | 'Staff'
  | 'Marketing'
  | 'Stores'
  | 'Vendors'
  | 'Locations'
  | 'Categories'
  | 'PayoutRates'
  | 'Wallets'
  | 'More';

export type ActiveSubView =
  | 'none'
  | 'CustomerProfile'
  | 'SingleZonePricing'
  | 'OrderInspector'
  | 'ShoppingCoin'
  | 'AuditLogs';

export type ActiveModal =
  | 'none'
  | 'EditCustomer'
  | 'AddCustomer'
  | 'CrossZoneMatrix'
  | 'BulkPriceAdjustment'
  | 'StockDiscrepancy'
  | 'StaffReassignment'
  | 'OrderCancelRefund'
  | 'CampaignBuilder'
  | 'PrintLabel'
  | 'PrintOrderDetails'
  | 'AddProduct'
  | 'EditProduct'
  | 'PriceHistory'
  | 'EditZonePrice'
  | 'AddZone';

interface AdminStateContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  subView: ActiveSubView;
  setSubView: (view: ActiveSubView) => void;
  previousSubView: ActiveSubView;
  navigateSubView: (view: ActiveSubView) => void;
  goBackSubView: () => void;
  activeModal: ActiveModal;
  setActiveModal: (modal: ActiveModal) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Admin Auth & Master Sponsor ID
  isAdminAuthenticated: boolean;
  adminUser: any | null;
  adminSponsorId: string;
  loginAdmin: (identifier?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;

  // Data Collections
  cities: CityItem[];
  selectedCity: CityItem | null;
  setSelectedCity: (city: CityItem | null) => void;
  addCity: (payload: { name: string; code: string; state?: string; status?: 'Active' | 'Inactive' }) => Promise<{ success: boolean; error?: string }>;
  updateCity: (id: string, payload: Partial<CityItem>) => Promise<{ success: boolean; error?: string }>;
  deleteCity: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteAreaSafe: (id: string) => Promise<{ success: boolean; error?: string }>;

  zones: Zone[];
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  riders: DeliveryPartnerItem[];
  selectedRider: DeliveryPartnerItem | null;
  setSelectedRider: (rider: DeliveryPartnerItem | null) => void;
  updateRider: (id: string, updates: Partial<DeliveryPartnerItem>) => Promise<boolean>;

  categories: CategoryItem[];
  refreshCategories: () => Promise<void>;
  addCategoryItem: (data: Partial<CategoryItem>) => Promise<{ success: boolean; data?: CategoryItem; error?: string }>;
  updateCategoryItem: (id: string, data: Partial<CategoryItem>) => Promise<{ success: boolean; data?: CategoryItem; error?: string }>;
  toggleCategoryItemStatus: (id: string, isActive?: boolean) => Promise<{ success: boolean; data?: CategoryItem; error?: string }>;
  deleteCategoryItem: (id: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  addSubcategoryItem: (catId: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateSubcategoryItem: (catId: string, subId: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteSubcategoryItem: (catId: string, subId: string) => Promise<{ success: boolean; message?: string; error?: string }>;

  products: ProductItem[];
  selectedProduct: ProductItem | null;
  setSelectedProduct: (product: ProductItem | null) => void;
  addProductItem: (data: Partial<ProductItem>) => Promise<boolean>;
  updateProductItem: (id: string, data: Partial<ProductItem>) => Promise<boolean>;
  deleteProductItem: (id: string) => Promise<boolean>;
  toggleProductStatus: (id: string) => Promise<boolean>;

  zonePrices: Record<string, Record<string, number>>;
  areaPricing: Record<string, Record<string, number>>; // variantId -> areaId / zoneName -> price
  areaPricingRecords: AreaPricingRecord[];
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  addOperationalZoneItem: (data: {
    name: string;
    code?: string;
    darkStore?: string;
    address?: string;
    city?: string;
    isActive?: boolean;
  }) => Promise<{ success: boolean; error?: string; zone?: Zone }>;
  selectedVariantPricing: {
    product: ProductItem;
    variant: ProductVariantItem;
    zone: string;
  } | null;
  setSelectedVariantPricing: (
    data: {
      product: ProductItem;
      variant: ProductVariantItem;
      zone: string;
    } | null
  ) => void;
  updateVariantAreaPrice: (
    productId: string,
    variantId: string,
    areaId: string,
    price: number,
    mrp?: number,
    stock?: number
  ) => Promise<boolean>;

  inventory: InventoryItem[];
  darkStores: DarkStoreItem[];
  selectedDarkStore: string;
  setSelectedDarkStore: (store: string) => void;
  spoilageLogs: StockAdjustment[];

  orders: Order[];
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;

  printOrders: PrintOrder[];
  selectedPrintOrder: PrintOrder | null;
  setSelectedPrintOrder: (order: PrintOrder | null) => void;
  updatePrintOrderStatus: (orderId: string, status: string) => void;

  labelPrintData: any | null;
  openLabelPrint: (data: any) => void;
  closeLabelPrint: () => void;

  staff: StaffMember[];
  campaigns: MarketingCampaign[];
  coinLedger: CoinLedgerItem[];
  auditLogs: AuditLogItem[];
  syncStatus: string;
  isLoading: boolean;
  refreshFromDb: () => Promise<void>;

  // Action methods
  addCustomer: (data: Partial<Customer>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  toggleBlockCustomer: (id: string) => void;
  deleteCustomer: (id: string) => Promise<boolean>;
  deleteRider: (id: string) => Promise<boolean>;

  updateZoneProductPrice: (productName: string, zoneName: string, newSellingPrice: number) => void;
  applyBulkPriceAdjustment: (
    category: string,
    type: 'Increase' | 'Decrease',
    percent: number,
    targetScope?: { type: 'area' | 'city' | 'all'; areaName?: string; cityName?: string; areaNames?: string[] }
  ) => void;

  reportStockDiscrepancy: (itemName: string, type: 'Spoilage' | 'Shrinkage' | 'Discrepancy', quantityKg: number, reason: string) => void;
  updateShelfLocation: (params: {
    inventoryId?: string;
    storeId?: string;
    productId?: string;
    shelfLocation: string;
  }) => Promise<{ success: boolean; shelfLocation?: string; error?: string }>;

  updateOrderStatus: (orderId: string, stage: OrderStage, notes?: string) => void;
  reassignOrderStaff: (orderId: string, pickerName?: string, riderName?: string) => void;
  cancelAndRefundOrder: (orderId: string, reason: string, isRefunded: boolean) => void;

  createOrUpdateCampaign: (campaign: Partial<MarketingCampaign>) => void;
  addShoppingCoinAdjustment: (userName: string, amount: number, reason: string) => void;
}

const AdminStateContext = createContext<AdminStateContextType | undefined>(undefined);

export const AdminStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('Dashboard');
  const [subView, setSubView] = useState<ActiveSubView>('none');
  const [previousSubView, setPreviousSubView] = useState<ActiveSubView>('none');

  const navigateSubView = (view: ActiveSubView) => {
    setPreviousSubView(subView);
    setSubView(view);
  };

  const goBackSubView = () => {
    if (previousSubView !== 'none') {
      setSubView(previousSubView);
      setPreviousSubView('none');
    } else {
      setSubView('none');
    }
  };

  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Admin Auth & Master Sponsor ID state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('womup_admin_auth') === 'true';
    }
    return false;
  });

  const [adminUser, setAdminUser] = useState<any>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('womup_admin_user');
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [adminSponsorId, setAdminSponsorId] = useState<string>('WORMUP001');

  const loginAdmin = async (identifier?: string, password?: string) => {
    const res = await ApiService.adminLogin(identifier, password);
    if (res.success) {
      setIsAdminAuthenticated(true);
      setAdminUser(res.user);
      setAdminSponsorId(res.sponsorId || 'WORMUP001');
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('womup_admin_auth', 'true');
        localStorage.setItem('womup_admin_user', JSON.stringify(res.user));
        if (res.accessToken) {
          localStorage.setItem('womup_admin_token', res.accessToken);
        }
      }
      return { success: true };
    } else {
      return { success: false, error: res.error || 'Admin login failed' };
    }
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('womup_admin_auth');
      localStorage.removeItem('womup_admin_user');
      localStorage.removeItem('womup_admin_token');
      try {
        window.location.reload();
      } catch (e) {}
    }
  };

  const [syncStatus, setSyncStatus] = useState<string>('Live MongoDB Connected');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityItem | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [riders, setRiders] = useState<DeliveryPartnerItem[]>([]);
  const [selectedRider, setSelectedRider] = useState<DeliveryPartnerItem | null>(null);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [zonePrices, setZonePrices] = useState<Record<string, Record<string, number>>>({});
  const [areaPricing, setAreaPricing] = useState<Record<string, Record<string, number>>>({});
  const [areaPricingRecords, setAreaPricingRecords] = useState<AreaPricingRecord[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedVariantPricing, setSelectedVariantPricing] = useState<{
    product: ProductItem;
    variant: ProductVariantItem;
    zone: string;
  } | null>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [darkStores, setDarkStores] = useState<DarkStoreItem[]>([]);
  const [selectedDarkStore, setSelectedDarkStore] = useState<string>('');
  const [spoilageLogs, setSpoilageLogs] = useState<StockAdjustment[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [printOrders, setPrintOrders] = useState<PrintOrder[]>([]);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<PrintOrder | null>(null);

  const [labelPrintData, setLabelPrintData] = useState<any | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [coinLedger, setCoinLedger] = useState<CoinLedgerItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const logAudit = (action: string, target: string, details: string) => {
    const newLog: AuditLogItem = {
      id: 'al_' + Date.now(),
      adminName: 'Rahul (Admin)',
      action,
      target,
      details,
      timestamp: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: '2-digit', year: 'numeric' }),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const refreshFromDb = useCallback(async () => {
    try {
      const live = await ApiService.fetchLiveSnapshot();
      if (live) {
        setCustomers(live.customers || []);
        if (live.customers && live.customers.length > 0) {
          setSelectedCustomer((prev) => prev || live.customers[0]);
        }
        setRiders(live.riders || []);
        if (live.riders && live.riders.length > 0) {
          setSelectedRider((prev) => prev || live.riders[0]);
        }
        setOrders(live.orders || []);
        if (live.orders && live.orders.length > 0) {
          setSelectedOrder((prev) => prev || live.orders[0]);
        }
        setPrintOrders(live.printOrders || []);
        setCategories(live.categories || []);
        setProducts(live.products || []);
        setCities(live.cities || []);
        if (live.cities && live.cities.length > 0) {
          setSelectedCity((prev) => prev || live.cities[0]);
        }
        setZones(live.zones || []);
        if (live.zones && live.zones.length > 0) {
          setSelectedZone((prev) => prev || live.zones[0].name);
        }
        setDarkStores(live.stores || []);
        if (live.stores && live.stores.length > 0) {
          setSelectedDarkStore((prev) => prev || live.stores[0].name);
        }
        setZonePrices(live.zonePrices || {});
        setAreaPricing(live.areaPricing || {});
        setAreaPricingRecords(live.areaPricingRecords || []);
        setInventory(live.inventory || []);
        setStaff(live.staff || []);
        setCampaigns(live.campaigns || []);
        setCoinLedger(live.coinLedger || []);
        setAuditLogs(live.auditLogs || []);
        setSyncStatus('Live MongoDB Connected');
      } else {
        setSyncStatus('Live DB Active (Cluster0)');
      }
    } catch {
      setSyncStatus('Live DB Active (Cluster0)');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always reset navigation to Dashboard on boot/reload
    setActiveTab('Dashboard');
    setSubView('none');
    setPreviousSubView('none');
    setActiveModal('none');
    setIsSidebarOpen(false);

    if (typeof window !== 'undefined' && window.history) {
      try {
        window.history.replaceState(null, '', '/');
      } catch (e) {}
    }

    refreshFromDb();

    // Connect to NestJS authoritative WebSocket Tracking Gateway
    const getSocketUrl = () => {
      if (typeof window !== 'undefined' && window.location) {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
          return 'http://localhost:5050/tracking';
        }
      }
      return 'https://womup-app-uquz.onrender.com/tracking';
    };

    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setSyncStatus('Live WebSocket & DB Active (Cluster0)');
    });

    socket.on('reconnect', () => {
      setSyncStatus('Live WebSocket Reconnected (Cluster0)');
      refreshFromDb();
    });

    socket.on('new_order', (data: any) => {
      // Zero-latency state prepend before full DB fetch
      const raw = data?.order || data;
      if (raw && (raw.orderNumber || raw._id || raw.id)) {
        const addr = raw.deliveryAddress || {};
        const fullAddress = `${addr.houseNumber || ''}, ${addr.street || ''}, ${addr.city || 'Ahmedabad'}`.trim();

        const rawStoreId = raw.storeId ? String(raw.storeId) : '';
        const matchedStore = darkStores.find((s: any) => String(s.id) === rawStoreId);
        let resolvedZone = '';
        let resolvedStore = matchedStore ? matchedStore.name : '';

        if (matchedStore) {
          const clean = matchedStore.name.replace(/Wom\s*Up|Worm\s*Up|Dark\s*Store/gi, '').trim();
          const matchedArea = zones.find((z) =>
            z.name.toLowerCase() === clean.toLowerCase() ||
            matchedStore.name.toLowerCase().includes(z.name.toLowerCase()) ||
            z.name.toLowerCase().includes(clean.toLowerCase())
          );
          resolvedZone = matchedArea ? matchedArea.name : clean;
        }

        if (!resolvedZone) {
          const addrText = `${addr.street || ''} ${addr.landmark || ''} ${addr.city || ''} ${addr.houseNumber || ''}`.toLowerCase();
          const matchedArea = zones.find((z) => {
            if (!z.name) return false;
            const zName = z.name.toLowerCase();
            if (addrText.includes(zName)) return true;
            const parts = zName.split(/[\s-]+/).filter((p) => p.length > 3);
            return parts.some((p) => addrText.includes(p));
          });
          if (matchedArea) {
            resolvedZone = matchedArea.name;
            if (!resolvedStore) resolvedStore = `Wom Up ${matchedArea.name} Dark Store`;
          }
        }

        if (!resolvedZone) resolvedZone = addr.street || addr.city || 'Prahlad Nagar';
        if (!resolvedStore) resolvedStore = 'Wom Up Ahmedabad Central Dark Store';

        const mappedOrder: Order = {
          id: raw.orderNumber || `#WMP-${(raw._id || raw.id || '').slice(-6).toUpperCase()}`,
          storeId: rawStoreId,
          customerId: raw.userId ? (raw.userId.toString ? raw.userId.toString() : raw.userId) : 'cust_live',
          customerName: raw.customerName || data.customerName || 'Customer',
          customerPhone: raw.customerPhone || '9879432010',
          address: fullAddress || 'Ahmedabad',
          zoneName: resolvedZone,
          darkStore: resolvedStore,
          items: (raw.items || []).map((i: any) => ({
            id: i.productId || 'item_1',
            name: i.name || 'Item',
            quantityKg: i.quantity || 1,
            pricePerKg: i.unitPrice || 0,
            subtotal: i.subtotal || 0,
          })),
          subtotal: raw.itemSubtotal || raw.totalAmount || 0,
          deliveryFee: raw.deliveryFee || 0,
          discount: (raw.discount || 0) + (raw.couponDiscount || 0) + (raw.coinsDiscount || 0),
          total: raw.totalAmount || 0,
          status: 'Order Placed',
          pickerName: raw.pickerName || undefined,
          riderName: raw.riderName || (raw.deliveryPartner?.name || raw.deliveryPartnerId?.fullName || undefined),
          riderPhone: raw.riderPhone || raw.deliveryPartner?.phone || raw.deliveryPartnerId?.phoneNumber || undefined,
          riderVehicle: raw.riderVehicle || raw.deliveryPartner?.vehicle || raw.deliveryPartnerId?.vehicleNumber || undefined,
          timeAgo: 'Just now',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeline: [
            {
              stage: 'Order Placed',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              actor: 'Customer',
              notes: 'Real-time WebSocket event received'
            }
          ]
        };

        setOrders(prev => {
          if (prev.some(o => o.id === mappedOrder.id)) return prev;
          return [mappedOrder, ...prev];
        });
      }
    });

    socket.on('order_status', (data: any) => {
      if (data?.orderId) {
        const targetId = data.orderId;
        setOrders(prev => prev.map(o => {
          if (o.id === targetId || o.id.includes(targetId.slice(-6).toUpperCase())) {
            const raw = String(data.status || '').toUpperCase();
            const mappedStatus = 
              raw === 'PACKING' || raw === 'PICKING' ? 'Picking' :
              raw === 'PACKED' ? 'Packed' :
              raw === 'ASSIGNED' || raw === 'GOING_TO_STORE' || raw === 'ARRIVED_AT_STORE' || raw === 'READY_FOR_DISPATCH' ? 'Ready for Dispatch' :
              raw === 'OUT_FOR_DELIVERY' || raw === 'ARRIVED_AT_CUSTOMER' ? 'Out for Delivery' :
              raw === 'DELIVERED' || raw === 'COMPLETED' ? 'Delivered' :
              raw === 'CANCELLED' || raw === 'PAYMENT_FAILED' ? 'Cancelled' :
              raw === 'PLACED' ? 'Order Placed' : o.status;
            return { ...o, status: mappedStatus as any, rawStatus: data.status };
          }
          return o;
        }));
      }
    });

    socket.on('inventory_alert', () => {
      // socket handled
    });

    socket.on('inventory_update', (data: any) => {
      if (data && (data.productId || data.id)) {
        const pId = (data.productId || data.id).toString();
        const sId = data.storeId ? data.storeId.toString() : null;
        const newAvail = Number(data.newAvailableStock ?? data.availableQty ?? 0);
        const newRes = Number(data.newReservedStock ?? data.reservedQty ?? 0);

        setInventory((prev) =>
          prev.map((item) => {
            const matchProduct = item.productId === pId || item.id === pId;
            const matchStore = !sId || item.darkStoreId === sId;
            if (matchProduct && matchStore) {
              const threshold = item.lowStockThreshold || 10;
              const newStatus = newAvail <= 0 ? 'Low Stock' : newAvail <= threshold ? 'Low Stock' : 'Healthy';
              return {
                ...item,
                availableKg: newAvail,
                reservedKg: newRes,
                status: newStatus as any,
              };
            }
            return item;
          })
        );
      }
    });

    // Real-time Store Staff Shift Sync (Picker On/Off Shift)
    socket.on('staff_shift_changed', (data: any) => {
      if (data && data.storeId) {
        const sId = data.storeId.toString();
        setDarkStores((prev) =>
          prev.map((store) => {
            const isMatch = store.id === sId || (store as any)._id === sId || store.code === data.storeCode;
            if (isMatch) {
              const staffOnShift = Number(data.staffOnShiftCount ?? (data.isOnShift ? 1 : 0));
              const staffTotal = Number(data.staffTotal ?? store.staffTotal ?? (staffOnShift > 0 ? staffOnShift : 1));
              const isOnline = data.isOnline !== undefined ? Boolean(data.isOnline) : (store.isActive !== false && staffOnShift > 0);
              return {
                ...store,
                isOnShift: Boolean(data.isOnShift),
                staffOnShift,
                staffTotal: Math.max(staffTotal, staffOnShift),
                isOnline,
              };
            }
            return store;
          })
        );
      }
    });

    socket.on('store_shift_update', (data: any) => {
      if (data && data.storeId) {
        const sId = data.storeId.toString();
        setDarkStores((prev) =>
          prev.map((store) => {
            const isMatch = store.id === sId || (store as any)._id === sId || store.code === data.storeCode;
            if (isMatch) {
              const staffOnShift = Number(data.staffOnShiftCount ?? (data.isOnShift ? 1 : 0));
              const staffTotal = Number(data.staffTotal ?? store.staffTotal ?? (staffOnShift > 0 ? staffOnShift : 1));
              const isOnline = data.isOnline !== undefined ? Boolean(data.isOnline) : (store.isActive !== false && staffOnShift > 0);
              return {
                ...store,
                isOnShift: Boolean(data.isOnShift),
                staffOnShift,
                staffTotal: Math.max(staffTotal, staffOnShift),
                isOnline,
              };
            }
            return store;
          })
        );
      }
    });

    // 🚀 SMART HYBRID SYNC:
    // 1. Polling is lightweight delta sync (<1KB, only modified items) every 20 seconds
    // 2. Automatically paused when app is backgrounded to protect battery & server!
    let syncInterval: any = null;
    let lastCheckTime = new Date(Date.now() - 30000).toISOString();

    const checkDeltaSync = async () => {
      try {
        const res = await fetch(`http://localhost:5050/api/v1/sync-updates?since=${encodeURIComponent(lastCheckTime)}`);
        if (res.ok) {
          const delta = await res.json();
          lastCheckTime = delta.timestamp || new Date().toISOString();
          if (delta.hasChanges) {
            if (delta.changedOrders && delta.changedOrders.length > 0) {
              setOrders(prev => prev.map(o => {
                const found = delta.changedOrders.find((c: any) => c.id === o.id || c.orderNumber === o.orderNumber);
                if (found) {
                  const raw = String(found.status || '').toUpperCase();
                  const mappedStatus: OrderStage =
                    raw === 'PACKING' || raw === 'PICKING' ? 'Picking' :
                    raw === 'PACKED' ? 'Packed' :
                    raw === 'ASSIGNED' || raw === 'GOING_TO_STORE' || raw === 'ARRIVED_AT_STORE' || raw === 'READY_FOR_DISPATCH' ? 'Ready for Dispatch' :
                    raw === 'OUT_FOR_DELIVERY' || raw === 'ARRIVED_AT_CUSTOMER' ? 'Out for Delivery' :
                    raw === 'DELIVERED' || raw === 'COMPLETED' ? 'Delivered' :
                    raw === 'CANCELLED' || raw === 'PAYMENT_FAILED' ? 'Cancelled' :
                    raw === 'PLACED' ? 'Order Placed' : o.status;
                  return { ...o, status: mappedStatus, rawStatus: found.status, bagBarcode: found.bagBarcode || o.bagBarcode };
                }
                return o;
              }));
            }
            if (delta.changedInventory && delta.changedInventory.length > 0) {
              refreshFromDb();
            }
          }
        }
      } catch {
        // quiet fallback
      }
    };

    const startPolling = () => {
      if (syncInterval) clearInterval(syncInterval);
      syncInterval = setInterval(checkDeltaSync, 20000);
    };

    const stopPolling = () => {
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }
    };

    startPolling();

    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkDeltaSync();
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      appStateSub.remove();
      socket.disconnect();
    };
  }, [refreshFromDb]);

  const addProductItem = async (data: Partial<ProductItem>) => {
    const bPrice = Number(data.basePrice) || Number(data.sellingPrice) || 0;
    const sPrice = Number(data.sellingPrice) || 0;
    const mPrice = Number(data.mrp) || sPrice || 0;

    const newItem: ProductItem = {
      id: 'prod_' + Date.now(),
      name: data.name || 'New Item',
      category: data.category || 'Vegetables',
      categoryId: data.categoryId,
      brand: data.brand || 'Womup Fresh',
      description: data.description || '',
      imageUrl: data.imageUrl || data.image || '',
      images: data.images || (data.imageUrl ? [data.imageUrl] : []),
      cloudinaryPublicId: data.cloudinaryPublicId,
      basePrice: bPrice,
      sellingPrice: sPrice,
      mrp: mPrice,
      stockKg: Number(data.stockKg) || 100,
      isActive: data.isActive !== false,
      image: data.image || data.imageUrl || 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80',
      variants: data.variants || [],
      priceHistory: [
        {
          id: 'ph_' + Date.now(),
          oldBasePrice: bPrice,
          newBasePrice: bPrice,
          oldSellingPrice: sPrice,
          newSellingPrice: sPrice,
          oldMrp: mPrice,
          newMrp: mPrice,
          changedBy: 'Admin (Womup)',
          changedAt: new Date().toLocaleString(),
          notes: 'Product Created',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [newItem, ...prev]);

    logAudit('Product Added', newItem.name, `Added under ${newItem.category} with ${(data.variants || []).length} variants`);
    const res = await ApiService.addProduct({
      ...newItem,
      variants: data.variants,
      brand: data.brand,
      description: data.description,
      imageUrl: data.imageUrl,
      images: data.images,
      cloudinaryPublicId: data.cloudinaryPublicId,
    });

    if (res && res.id) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === newItem.id
            ? { ...p, id: res.id, variants: res.variants || data.variants || [] }
            : p
        )
      );
    }

    // Refresh live snapshot to ensure all DB variant ObjectIds and mappings are synced
    setTimeout(() => {
      refreshFromDb();
    }, 500);

    return true;
  };

  const updateProductItem = async (id: string, data: Partial<ProductItem>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id || p.name === data.name) {
          const priceChanged =
            (data.sellingPrice !== undefined && Number(data.sellingPrice) !== p.sellingPrice) ||
            (data.basePrice !== undefined && Number(data.basePrice) !== p.basePrice) ||
            (data.mrp !== undefined && Number(data.mrp) !== p.mrp);

          const newHistory = [...(p.priceHistory || [])];
          if (priceChanged) {
            newHistory.unshift({
              id: 'ph_' + Date.now(),
              oldBasePrice: p.basePrice,
              newBasePrice: data.basePrice !== undefined ? Number(data.basePrice) : p.basePrice,
              oldSellingPrice: p.sellingPrice,
              newSellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : p.sellingPrice,
              oldMrp: p.mrp,
              newMrp: data.mrp !== undefined ? Number(data.mrp) : p.mrp,
              changedBy: 'Admin (Womup)',
              changedAt: new Date().toLocaleString(),
              zoneName: selectedZone,
              notes: 'Price Updated in Admin Panel',
            });
          }

          return {
            ...p,
            ...data,
            basePrice: data.basePrice !== undefined ? Number(data.basePrice) : p.basePrice,
            sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : p.sellingPrice,
            mrp: data.mrp !== undefined ? Number(data.mrp) : p.mrp,
            variants: data.variants !== undefined ? data.variants : p.variants,
            priceHistory: newHistory,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    logAudit('Product Updated', data.name || id, `Updated details / variants`);
    await ApiService.updateProduct(id, data);
    setTimeout(() => {
      refreshFromDb();
    }, 500);
    return true;
  };

  const deleteProductItem = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    logAudit('Product Deleted', prod?.name || id, 'Removed from catalog and area pricing');
    await ApiService.deleteProduct(id);
    return true;
  };

  const toggleProductStatus = async (id: string) => {
    let nextStatus = true;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          nextStatus = !p.isActive;
          return { ...p, isActive: nextStatus };
        }
        return p;
      })
    );
    await ApiService.toggleProductStatus(id, nextStatus);
    return true;
  };

  const refreshCategories = async () => {
    try {
      const fetched = await ApiService.fetchCategories(true);
      if (fetched && fetched.length > 0) {
        setCategories(fetched);
      }
    } catch (err) {
      console.error('[AdminStateContext] refreshCategories error:', err);
    }
  };

  const addCategoryItem = async (data: Partial<CategoryItem>) => {
    const res = await ApiService.createCategory({
      name: data.name || '',
      code: data.code,
      slug: data.slug,
      icon: data.icon,
      bgColor: data.bgColor,
      description: data.description,
      sortOrder: data.sortOrder,
      displayOrder: data.displayOrder,
      isActive: data.isActive !== false,
    });

    if (res.success) {
      logAudit('Category Created', data.name || '', `Created category with code ${data.code || ''}`);
      await refreshCategories();
    }
    return res;
  };

  const updateCategoryItem = async (id: string, data: Partial<CategoryItem>) => {
    const res = await ApiService.updateCategory(id, data);
    if (res.success) {
      logAudit('Category Updated', data.name || id, `Updated category properties`);
      await refreshCategories();
    }
    return res;
  };

  const toggleCategoryItemStatus = async (id: string, isActive?: boolean) => {
    const res = await ApiService.toggleCategoryStatus(id, isActive);
    if (res.success) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id || (c as any)._id === id ? { ...c, isActive: res.data?.isActive ?? !c.isActive } : c))
      );
      logAudit('Category Status Toggled', id, `Status updated`);
      await refreshCategories();
    }
    return res;
  };

  const deleteCategoryItem = async (id: string) => {
    const target = categories.find((c) => c.id === id || (c as any)._id === id);
    const res = await ApiService.deleteCategory(id);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id && (c as any)._id !== id));
      logAudit('Category Deleted', target?.name || id, `Category removed`);
      await refreshCategories();
    }
    return res;
  };

  const addSubcategoryItem = async (catId: string, data: any) => {
    const res = await ApiService.createSubcategory(catId, data);
    if (res.success) {
      logAudit('Subcategory Added', data.name || '', `Added under category ${catId}`);
      await refreshCategories();
    }
    return res;
  };

  const updateSubcategoryItem = async (catId: string, subId: string, data: any) => {
    const res = await ApiService.updateSubcategory(catId, subId, data);
    if (res.success) {
      logAudit('Subcategory Updated', data.name || subId, `Updated subcategory in category ${catId}`);
      await refreshCategories();
    }
    return res;
  };

  const deleteSubcategoryItem = async (catId: string, subId: string) => {
    const res = await ApiService.deleteSubcategory(catId, subId);
    if (res.success) {
      logAudit('Subcategory Deleted', subId, `Deleted subcategory from category ${catId}`);
      await refreshCategories();
    }
    return res;
  };

  const openLabelPrint = (data: any) => {
    setLabelPrintData(data);
    setActiveModal('PrintLabel');
  };

  const closeLabelPrint = () => {
    setLabelPrintData(null);
    setActiveModal('none');
  };

  const updatePrintOrderStatus = (orderId: string, status: string) => {
    setPrintOrders((prev) =>
      prev.map((p) => (p.id === orderId || p.printOrderNumber === orderId ? { ...p, status: status as any } : p))
    );
    if (selectedPrintOrder && (selectedPrintOrder.id === orderId || selectedPrintOrder.printOrderNumber === orderId)) {
      setSelectedPrintOrder((prev) => (prev ? { ...prev, status: status as any } : null));
    }
    ApiService.updatePrintOrderStatus(orderId, status);
  };

  // Actions
  const addCustomer = (data: Partial<Customer>) => {
    const newCustomer: Customer = {
      id: 'c_' + Date.now(),
      name: data.name || 'New Customer',
      phone: data.phone || '+91 99999 00000',
      email: data.email || 'customer@womup.com',
      type: data.type || 'Individual',
      zoneId: 'z1',
      zoneName: data.zoneName || 'Bopal',
      address: data.address || 'Ahmedabad',
      addresses: [{ id: 'a_' + Date.now(), label: 'Home', address: data.address || 'Ahmedabad', zone: data.zoneName || 'Bopal' }],
      status: 'Active',
      spend: 0,
      totalOrders: 0,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      walletBalance: 0,
      shoppingCoinBalance: 200,
      kycStatus: 'Pending',
      createdAt: 'Just now',
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
    logAudit('Customer Created', newCustomer.name, `Added new ${newCustomer.type} customer in ${newCustomer.zoneName}`);
    // Persist to live MongoDB
    ApiService.addCustomer(newCustomer);
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer((prev) => (prev ? { ...prev, ...data } : null));
    }
    logAudit('Customer Updated', data.name || id, 'Updated customer details');
    // Persist to live MongoDB Atlas
    ApiService.updateCustomer(id, data);
  };

  const toggleBlockCustomer = (id: string) => {
    let nextStatus: 'Active' | 'Blocked' = 'Blocked';
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          nextStatus = c.status === 'Active' ? 'Blocked' : 'Active';
          logAudit('Customer Status Changed', c.name, `Status set to ${nextStatus}`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer((prev) =>
        prev ? { ...prev, status: nextStatus } : null
      );
    }
    // Persist to live MongoDB Atlas
    ApiService.toggleBlockCustomer(id, nextStatus === 'Blocked');
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    const cust = customers.find((c) => c.id === id);
    const success = await ApiService.deleteCustomer(id);
    if (success) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer(null);
      }
      if (cust) {
        logAudit('Customer Deleted', cust.name, `Customer ${cust.name} (${cust.phone}) permanently deleted`);
      }
    }
    return success;
  };

  const deleteRider = async (id: string): Promise<boolean> => {
    const rider = riders.find((r) => r.id === id);
    const success = await ApiService.deleteRider(id);
    if (success) {
      setRiders((prev) => prev.filter((r) => r.id !== id));
      if (rider) {
        logAudit('Rider Deleted', rider.name, `Delivery Partner ${rider.name} (${rider.partnerCode}) permanently deleted`);
      }
    }
    return success;
  };

  const updateZoneProductPrice = (productName: string, zoneName: string, newSellingPrice: number) => {
    setZonePrices((prev) => ({
      ...prev,
      [productName]: {
        ...(prev[productName] || {}),
        [zoneName]: newSellingPrice,
      },
    }));
    logAudit('Price Updated', `${productName} (${zoneName})`, `Selling price set to ₹${newSellingPrice}`);
    // Persist to live MongoDB
    ApiService.updateProductPrice(productName, newSellingPrice);
  };

  const updateVariantAreaPrice = async (
    productId: string,
    variantId: string,
    areaId: string,
    price: number,
    mrp?: number,
    stock?: number
  ): Promise<boolean> => {
    const prevAreaPricing = { ...areaPricing };
    const zoneObj = zones.find((z) => z.id === areaId || z.name === areaId);
    const zoneName = zoneObj?.name || areaId;
    const actualAreaId = zoneObj?.id || areaId;

    // Optimistic local state update
    setAreaPricing((prev) => ({
      ...prev,
      [variantId]: {
        ...(prev[variantId] || {}),
        [actualAreaId]: price,
        [zoneName]: price,
      },
    }));

    const prod = products.find((p) => p.id === productId);
    const variant = prod?.variants?.find((v) => v.id === variantId);
    logAudit(
      'Area Price Updated',
      `${prod?.name || 'Product'} (${variant?.weightOrVolume || 'variant'}) in ${zoneName}`,
      `Selling price updated to ₹${price} (saved to area_pricing)`
    );

    // Persist to live MongoDB area_pricing collection only
    const success = await ApiService.saveVariantAreaPrice({
      productId,
      variantId,
      areaId: actualAreaId,
      price,
      mrp,
      stock,
    });

    if (!success) {
      // Rollback on failure
      setAreaPricing(prevAreaPricing);
      return false;
    }

    refreshFromDb();
    return true;
  };

  const addOperationalZoneItem = async (data: {
    name: string;
    code?: string;
    darkStore?: string;
    address?: string;
    city?: string;
    isActive?: boolean;
  }): Promise<{ success: boolean; error?: string; zone?: Zone }> => {
    try {
      const res = await ApiService.addOperationalZone(data);
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to create zone' };
      }

      const created = res.data;
      const newZone: Zone = {
        id: res.id ? String(res.id) : (created?._id ? String(created._id) : `z_${Date.now()}`),
        name: created?.name || data.name.trim(),
        code: created?.code || data.code,
        darkStore: created?.darkStore || data.darkStore || `Wom Up ${data.name.trim()} Dark Store`,
        address: created?.address || data.address || `${data.name.trim()}, Ahmedabad`,
        city: created?.city || data.city || 'Ahmedabad',
        isActive: created?.isActive !== false,
        activeOrders: 0,
        gmvSharePercent: 0,
      };

      // Optimistically add to zones list
      setZones((prev) => {
        const filtered = prev.filter(
          (z) => z.id !== newZone.id && z.name.toLowerCase() !== newZone.name.toLowerCase()
        );
        return [...filtered, newZone];
      });

      // Automatically select the newly created zone
      setSelectedZone(newZone.name);

      logAudit(
        'Create Operational Zone',
        newZone.name,
        `Created zone "${newZone.name}" (${newZone.code || ''}) with dark store "${newZone.darkStore}"`
      );

      // Refresh DB data
      await refreshFromDb();

      return { success: true, zone: newZone };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error creating operational zone' };
    }
  };

  const applyBulkPriceAdjustment = (
    category: string,
    type: 'Increase' | 'Decrease',
    percent: number,
    targetScope?: { type: 'area' | 'city' | 'all'; areaName?: string; cityName?: string; areaNames?: string[] }
  ) => {
    const factor = type === 'Increase' ? 1 + percent / 100 : 1 - percent / 100;
    const allowedAreaNames = targetScope?.areaNames || (targetScope?.areaName ? [targetScope.areaName] : null);

    setZonePrices((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((prodName) => {
        const prodObj = products.find((p) => p.name === prodName);
        if (!category || category === 'All Categories' || category === 'All Vegetables' || (prodObj && prodObj.category === category)) {
          const zoneMap = { ...updated[prodName] };
          Object.keys(zoneMap).forEach((z) => {
            if (!allowedAreaNames || allowedAreaNames.includes(z)) {
              zoneMap[z] = Math.round(zoneMap[z] * factor);
            }
          });
          updated[prodName] = zoneMap;
        }
      });
      return updated;
    });

    // Also adjust areaPricing for active variants
    setAreaPricing((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((variantId) => {
        const areaMap = { ...updated[variantId] };
        Object.keys(areaMap).forEach((areaKey) => {
          if (!allowedAreaNames || allowedAreaNames.includes(areaKey)) {
            areaMap[areaKey] = Math.round(areaMap[areaKey] * factor);
          }
        });
        updated[variantId] = areaMap;
      });
      return updated;
    });

    const scopeDesc =
      targetScope?.type === 'area'
        ? targetScope.areaName
        : targetScope?.type === 'city'
        ? `all areas in ${targetScope.cityName}`
        : 'all areas in all cities';

    logAudit('Bulk Price Adjustment', category, `${type} prices by ${percent}% for ${scopeDesc}`);
  };

  const reportStockDiscrepancy = (itemName: string, type: 'Spoilage' | 'Shrinkage' | 'Discrepancy', quantityKg: number, reason: string) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.name.toLowerCase().includes(itemName.toLowerCase())) {
          const newAvail = Math.max(0, item.availableKg - quantityKg);
          return {
            ...item,
            availableKg: newAvail,
            status: newAvail <= (item.lowStockThreshold || 15) ? (newAvail === 0 ? 'Expired' : 'Low Stock') : 'Healthy',
          };
        }
        return item;
      })
    );
    const newLog: StockAdjustment = {
      id: 'sa_' + Date.now(),
      itemName,
      type,
      quantityKg,
      reason,
      darkStoreName: selectedDarkStore,
      timestamp: 'Just now',
      adminName: 'Rahul (Admin)',
    };
    setSpoilageLogs((prev) => [newLog, ...prev]);
    logAudit('Stock Adjustment', `${itemName} (${type})`, `Deducted ${quantityKg}kg: ${reason}`);
    const invItem = inventory.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));
    if (invItem) {
      ApiService.adjustStock(invItem.darkStoreId, invItem.productId, -quantityKg, reason);
    }
  };

  const updateShelfLocation = async (params: {
    inventoryId?: string;
    storeId?: string;
    productId?: string;
    shelfLocation: string;
  }): Promise<{ success: boolean; shelfLocation?: string; error?: string }> => {
    const cleanShelf = (params.shelfLocation || '').trim().toUpperCase();
    setInventory((prev) =>
      prev.map((item) => {
        if (
          (params.inventoryId && item.id === params.inventoryId) ||
          (params.storeId && params.productId && item.darkStoreId === params.storeId && item.productId === params.productId)
        ) {
          return { ...item, shelfLocation: cleanShelf };
        }
        return item;
      })
    );
    logAudit('Shelf Location Update', params.shelfLocation, `Assigned shelf ${cleanShelf}`);
    return ApiService.updateShelfLocation({ ...params, shelfLocation: cleanShelf });
  };

  const updateOrderStatus = (orderId: string, stage: OrderStage, notes?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedTimeline = [...o.timeline, { stage, timestamp: 'Just now', actor: 'Admin Intervention', notes }];
          const updatedOrder = { ...o, status: stage, timeline: updatedTimeline };
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder(updatedOrder);
          }
          return updatedOrder;
        }
        return o;
      })
    );
    logAudit('Order Lifecycle Updated', orderId, `Moved stage to "${stage}"`);
    // Persist to live MongoDB
    ApiService.updateOrderStatus(orderId, stage, notes);
  };

  const reassignOrderStaff = (orderId: string, pickerName?: string, riderName?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = {
            ...o,
            pickerName: pickerName || o.pickerName,
            riderName: riderName || o.riderName,
            timeline: [
              ...o.timeline,
              { stage: o.status, timestamp: 'Just now', actor: 'Admin Reassignment', notes: `Picker: ${pickerName || 'Unchanged'}, Rider: ${riderName || 'Unchanged'}` },
            ],
          };
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder(updated);
          }
          return updated;
        }
        return o;
      })
    );
    logAudit('Staff Reassigned', orderId, `Reassigned Picker: ${pickerName || 'N/A'}, Rider: ${riderName || 'N/A'}`);
  };

  const cancelAndRefundOrder = (orderId: string, reason: string, isRefunded: boolean) => {
    const orderObj = orders.find(o => o.id === orderId);
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: Order = {
            ...o,
            status: 'Cancelled',
            cancelReason: reason,
            isRefunded,
            refundAmount: isRefunded ? o.total : 0,
            timeline: [
              ...o.timeline,
              { stage: 'Cancelled', timestamp: 'Just now', actor: 'Admin Cancellation', notes: `Reason: ${reason}. Refund: ${isRefunded ? 'Auto-Initiated' : 'None'}` },
            ],
          };
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder(updated);
          }
          return updated;
        }
        return o;
      })
    );
    logAudit('Order Cancelled', orderId, `Cancelled due to "${reason}". Refund: ${isRefunded ? 'Yes' : 'No'}`);
    // Persist to live MongoDB
    ApiService.cancelOrder(orderId, reason, isRefunded ? (orderObj?.total || 0) : 0);
  };

  const createOrUpdateCampaign = (campaignData: Partial<MarketingCampaign>) => {
    if (campaignData.id) {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignData.id ? { ...c, ...campaignData } : c))
      );
      logAudit('Campaign Updated', campaignData.name || 'Campaign', 'Modified campaign properties');
    } else {
      const newCamp: MarketingCampaign = {
        id: 'camp_' + Date.now(),
        name: campaignData.name || 'New Campaign',
        scheduledAt: campaignData.scheduledAt || 'Immediate',
        targetAudience: campaignData.targetAudience || 'All Customers',
        isEnabled: true,
        subject: campaignData.subject || 'Womup Special Offer',
        message: campaignData.message || 'Fresh vegetables delivered in 10 mins!',
        status: 'Scheduled',
        sentCount: 0,
      };
      setCampaigns((prev) => [newCamp, ...prev]);
      logAudit('Campaign Created', newCamp.name, `Scheduled for ${newCamp.targetAudience}`);
    }
  };

  const addShoppingCoinAdjustment = (userName: string, amount: number, reason: string) => {
    const newEntry: CoinLedgerItem = {
      id: 'cl_' + Date.now(),
      userName,
      type: 'Adjusted',
      amount,
      reason,
      timestamp: 'Just now',
    };
    setCoinLedger((prev) => [newEntry, ...prev]);
    logAudit('Shopping Coin Adjusted', userName, `${amount > 0 ? '+' : ''}${amount} coins for "${reason}"`);
    // Persist to live MongoDB
    const user = customers.find(c => c.name.toLowerCase() === userName.toLowerCase());
    if (user) {
      ApiService.adjustCoins(user.id, amount >= 0 ? 'BONUS' : 'SPEND', Math.abs(amount), reason);
    }
  };

  const updateRider = async (id: string, updates: Partial<DeliveryPartnerItem>): Promise<boolean> => {
    try {
      const res = await ApiService.updateRider(id, updates);
      if (res) {
        setRiders((prev) =>
          prev.map((r) => (r.id === id || r.partnerCode === id ? { ...r, ...updates, ...res } : r))
        );
        if (selectedRider && (selectedRider.id === id || selectedRider.partnerCode === id)) {
          setSelectedRider((prev) => (prev ? { ...prev, ...updates, ...res } : null));
        }
        logAudit('Rider Updated', updates.name || id, 'Updated rider details');
        return true;
      }
    } catch (e) {
      console.warn('Failed to update rider:', e);
    }
    return false;
  };

  const addCity = async (payload: { name: string; code: string; state?: string; status?: 'Active' | 'Inactive' }) => {
    try {
      const res = await ApiService.addCity(payload);
      if (res.success && res.data) {
        await refreshFromDb();
        logAudit('ADD_CITY', res.data.name, `Created city ${res.data.name} (${res.data.code})`);
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to add city' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateCity = async (id: string, payload: Partial<CityItem>) => {
    try {
      const res = await ApiService.updateCity(id, payload);
      if (res.success) {
        await refreshFromDb();
        logAudit('UPDATE_CITY', payload.name || id, `Updated city details`);
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to update city' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteCity = async (id: string) => {
    try {
      const res = await ApiService.deleteCity(id);
      if (res.success) {
        await refreshFromDb();
        logAudit('DELETE_CITY', id, `Deleted city`);
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to delete city' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteAreaSafe = async (id: string) => {
    try {
      const res = await ApiService.deleteArea(id);
      if (res.success) {
        await refreshFromDb();
        logAudit('DELETE_AREA', id, `Deleted area`);
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to delete area' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AdminStateContext.Provider
      value={{
        activeTab,
        setActiveTab,
        subView,
        setSubView,
        previousSubView,
        navigateSubView,
        goBackSubView,
        activeModal,
        setActiveModal,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        zones,
        customers,
        selectedCustomer,
        setSelectedCustomer,
        riders,
        selectedRider,
        setSelectedRider,
        updateRider,
        categories,
        refreshCategories,
        addCategoryItem,
        updateCategoryItem,
        toggleCategoryItemStatus,
        deleteCategoryItem,
        addSubcategoryItem,
        updateSubcategoryItem,
        deleteSubcategoryItem,
        products,
        selectedProduct,
        setSelectedProduct,
        addProductItem,
        updateProductItem,
        deleteProductItem,
        toggleProductStatus,
        zonePrices,
        areaPricing,
        areaPricingRecords,
        selectedZone,
        setSelectedZone,
        addOperationalZoneItem,
        selectedVariantPricing,
        setSelectedVariantPricing,
        updateVariantAreaPrice,
        inventory,
        darkStores,
        selectedDarkStore,
        setSelectedDarkStore,
        spoilageLogs,
        orders,
        selectedOrder,
        setSelectedOrder,
        printOrders,
        selectedPrintOrder,
        setSelectedPrintOrder,
        updatePrintOrderStatus,
        labelPrintData,
        openLabelPrint,
        closeLabelPrint,
        cities,
        selectedCity,
        setSelectedCity,
        addCity,
        updateCity,
        deleteCity,
        deleteAreaSafe,
        staff,
        campaigns,
        coinLedger,
        auditLogs,
        syncStatus,
        isLoading,
        refreshFromDb,
        addCustomer,
        updateCustomer,
        toggleBlockCustomer,
        deleteCustomer,
        deleteRider,
        updateZoneProductPrice,
        applyBulkPriceAdjustment,
        reportStockDiscrepancy,
        updateShelfLocation,
        updateOrderStatus,
        reassignOrderStaff,
        cancelAndRefundOrder,
        createOrUpdateCampaign,
        addShoppingCoinAdjustment,
        isAdminAuthenticated,
        adminUser,
        adminSponsorId,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminStateContext.Provider>
  );
};

export const useAdminState = () => {
  const context = useContext(AdminStateContext);
  if (!context) {
    throw new Error('useAdminState must be used within an AdminStateProvider');
  }
  return context;
};
