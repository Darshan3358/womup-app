import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Customer,
  DeliveryPartnerItem,
  Order,
  ProductItem,
  ProductVariantItem,
  AreaPricingRecord,
  CategoryItem,
  DarkStoreItem,
  AreaItem,
  CityItem,
  PayoutRateItem,
  AuditLogItem,
  MarketingCampaign,
} from '../types/admin';
import { AdminApiService, LiveDbData } from '../services/api';

export type AdminTab =
  | 'Dashboard'
  | 'Orders'
  | 'Stores'
  | 'Inventory'
  | 'Categories'
  | 'Customers'
  | 'Staff'
  | 'Locations'
  | 'Prices'
  | 'PayoutRates'
  | 'Wallets'
  | 'Marketing'
  | 'AuditLogs';

interface AdminContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  selectedStoreFilter: string;
  setSelectedStoreFilter: (storeId: string) => void;
  selectedCityFilter: string;
  setSelectedCityFilter: (cityId: string) => void;
  selectedAreaFilter: string;
  setSelectedAreaFilter: (areaId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Live Data collections
  stores: DarkStoreItem[];
  orders: Order[];
  products: ProductItem[];
  productVariants: ProductVariantItem[];
  areaPricing: AreaPricingRecord[];
  categories: CategoryItem[];
  customers: Customer[];
  riders: DeliveryPartnerItem[];
  areas: AreaItem[];
  cities: CityItem[];
  payoutRates: PayoutRateItem[];
  campaigns: MarketingCampaign[];
  auditLogs: AuditLogItem[];

  // Sync state
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  refreshData: () => Promise<void>;

  // Core Actions
  createStore: (payload: any) => Promise<{ success: boolean; id?: any; data?: any; error?: string }>;
  toggleStoreShift: (storeId: string, isOnShift: boolean) => Promise<boolean>;
  resetStorePassword: (storeId: string, password?: string) => Promise<{ success: boolean; password?: string; error?: string }>;
  deleteStore: (storeId: string) => Promise<{ success: boolean; error?: string }>;
  updateOrderStatus: (orderNumber: string, status: string) => Promise<boolean>;
  updateProductPrice: (productName: string, price: number) => Promise<boolean>;
  saveVariantAreaPrice: (payload: { productId: string; variantId: string; areaId: string; price: number; mrp?: number; stock?: number }) => Promise<boolean>;
  updateVariant: (variantId: string, data: { sellingPrice?: number; mrp?: number; stock?: number }) => Promise<boolean>;
  updateProduct: (id: string, payload: any) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  adjustCoins: (payload: { userId: string; amount: number; type: 'Credit' | 'Debit'; reason: string }) => Promise<boolean>;

  // Category Actions
  createCategory: (payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateCategory: (id: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Additional Admin App Parity Actions
  createCity: (payload: { name: string; code: string; state?: string; status?: string }) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateCity: (id: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteCity: (id: string) => Promise<{ success: boolean; error?: string }>;
  createArea: (payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateArea: (id: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteArea: (id: string) => Promise<{ success: boolean; error?: string }>;
  savePayoutRate: (payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deletePayoutRate: (id: string) => Promise<{ success: boolean; error?: string }>;
  simulatePayout: (params: { cityId?: string; areaId?: string; cityName?: string; areaName?: string; distanceKm: number }) => Promise<any>;
  settleStoreWallet: (storeId: string, amount: number, notes?: string) => Promise<any>;
  payoutRiderWallet: (riderId: string, amount: number, notes?: string) => Promise<any>;
  updateRider: (riderId: string, payload: any) => Promise<any>;
  toggleCustomerBlock: (userId: string, isBlocked: boolean) => Promise<any>;
  createCustomer: (payload: { name: string; phone: string; email?: string; address?: string; type?: string; zoneName?: string }) => Promise<any>;
  updateCustomer: (userId: string, payload: any) => Promise<any>;
  cancelOrder: (orderIdOrNumber: string, payload: { reason: string; refundAmount?: number }) => Promise<any>;
  createCampaign: (payload: any) => Promise<any>;
  toggleCampaign: (campaignId: string, isEnabled: boolean) => Promise<any>;

  // Modals
  showAddStoreModal: boolean;
  setShowAddStoreModal: (show: boolean) => void;
  showAddProductModal: boolean;
  setShowAddProductModal: (show: boolean) => void;
  editingProductForModal: ProductItem | null;
  setEditingProductForModal: (prod: ProductItem | null) => void;
  showAddCategoryModal: boolean;
  setShowAddCategoryModal: (show: boolean) => void;
  showAdjustCoinsModal: boolean;
  setShowAdjustCoinsModal: (show: boolean) => void;
  selectedOrderForModal: Order | null;
  setSelectedOrderForModal: (order: Order | null) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('ALL');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('Ahmedabad');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live collections
  const [stores, setStores] = useState<DarkStoreItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariantItem[]>([]);
  const [areaPricing, setAreaPricing] = useState<AreaPricingRecord[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [riders, setRiders] = useState<DeliveryPartnerItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [payoutRates, setPayoutRates] = useState<PayoutRateItem[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Sync state
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Modals
  const [showAddStoreModal, setShowAddStoreModal] = useState<boolean>(false);
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [editingProductForModal, setEditingProductForModal] = useState<ProductItem | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [showAdjustCoinsModal, setShowAdjustCoinsModal] = useState<boolean>(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  const isSyncingRef = useRef(false);

  // Apply snapshot payload cleanly
  const applySnapshot = useCallback((data: LiveDbData) => {
    if (data.stores && data.stores.length > 0) setStores(data.stores);
    if (data.orders) setOrders(data.orders);
    if (data.products && data.products.length > 0) setProducts(data.products);
    if (data.productVariants && data.productVariants.length > 0) setProductVariants(data.productVariants);
    if (data.areaPricing) setAreaPricing(data.areaPricing);
    if (data.categories && data.categories.length > 0) setCategories(data.categories);
    if (data.customers) setCustomers(data.customers);
    if (data.riders) setRiders(data.riders);
    if (data.areas && data.areas.length > 0) setAreas(data.areas);
    if (data.cities && data.cities.length > 0) setCities(data.cities);
    if (data.payoutRates) setPayoutRates(data.payoutRates);
    if (data.campaigns) setCampaigns(data.campaigns);
    if (data.auditLogs) setAuditLogs(data.auditLogs);
    setIsConnected(true);
    setLastSyncTime(new Date());
  }, []);

  // Fetch live snapshot from backend
  const refreshData = useCallback(async () => {
    if (isSyncingRef.current) return;
    try {
      isSyncingRef.current = true;
      setIsSyncing(true);
      const snapshot = await AdminApiService.fetchLiveSnapshot();
      if (snapshot) {
        applySnapshot(snapshot);
      } else {
        setIsConnected(false);
      }
    } catch (e) {
      console.warn('[AdminContext] Sync warning:', e);
      setIsConnected(false);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [applySnapshot]);

  // Initial load + Real-time background sync polling every 3.5 seconds
  useEffect(() => {
    refreshData();

    const interval = setInterval(() => {
      refreshData();
    }, 3500);

    return () => clearInterval(interval);
  }, [refreshData]);

  // Instant Store Creation
  const createStore = async (payload: any) => {
    const res = await AdminApiService.createStore(payload);
    if (res.success && res.data) {
      // Optimistically add to stores list immediately
      const newStoreItem: DarkStoreItem = {
        id: res.id?.toString() || `store_${Date.now()}`,
        _id: res.id?.toString() || `store_${Date.now()}`,
        name: res.data.name,
        code: res.data.code,
        address: res.data.address,
        city: res.data.city || res.data.cityName || 'Ahmedabad',
        cityName: res.data.cityName || res.data.city || 'Ahmedabad',
        pincode: res.data.pincode || '380015',
        areaName: res.data.areaName || 'Ahmedabad',
        isActive: true,
        isOnShift: true,
        isOnline: true,
        staffOnShift: 2,
        staffTotal: 4,
        orderCount: 0,
        pendingOrders: 0,
        serviceRadiusKm: res.data.serviceRadiusKm || 4.5,
        estimatedDeliveryMinutes: res.data.estimatedDeliveryMinutes || 9,
        loginId: res.data.loginId,
        plainPassword: res.data.plainPassword,
        createdAt: new Date().toISOString(),
      };

      setStores((prev) => [newStoreItem, ...prev]);

      // Add to audit logs
      setAuditLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          adminName: 'Chief SuperAdmin',
          action: 'CREATE_DARK_STORE',
          target: newStoreItem.name,
          details: `Store ${newStoreItem.code} created with instant MongoDB persistence.`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      // Immediate refresh from backend to ensure 100% sync
      setTimeout(() => refreshData(), 500);
    }
    return res;
  };

  // Toggle Shift / Online status
  const toggleStoreShift = async (storeId: string, isOnShift: boolean): Promise<boolean> => {
    // Optimistic update
    setStores((prev) =>
      prev.map((s) =>
        s.id === storeId || s._id === storeId
          ? { ...s, isOnShift, isOnline: isOnShift, staffOnShift: isOnShift ? Math.max(1, s.staffOnShift || 1) : 0 }
          : s
      )
    );

    const res = await AdminApiService.toggleStoreShift(storeId, isOnShift);
    setTimeout(() => refreshData(), 500);
    return res.success;
  };

  // Reset store password
  const resetStorePassword = async (storeId: string, password?: string) => {
    const res = await AdminApiService.resetStorePassword(storeId, password);
    setTimeout(() => refreshData(), 500);
    return res;
  };

  // Delete store
  const deleteStore = async (storeId: string) => {
    setStores((prev) => prev.filter((s) => s.id !== storeId && s._id !== storeId));
    const res = await AdminApiService.deleteStore(storeId);
    await refreshData();
    return res;
  };

  // Update order status
  const updateOrderStatus = async (orderNumber: string, status: string): Promise<boolean> => {
    setOrders((prev) =>
      prev.map((o) => (o.orderNumber === orderNumber ? { ...o, status: status as any } : o))
    );
    const res = await AdminApiService.updateOrderStatus(orderNumber, status);
    setTimeout(() => refreshData(), 500);
    return res.success;
  };

  // Update product price
  const updateProductPrice = async (productName: string, price: number): Promise<boolean> => {
    setProducts((prev) =>
      prev.map((p) => (p.name === productName ? { ...p, sellingPrice: price } : p))
    );
    const res = await AdminApiService.updateProductPrice(productName, price);
    setTimeout(() => refreshData(), 500);
    return res.success;
  };

  // Adjust Shopping Coins
  const adjustCoins = async (payload: { userId: string; amount: number; type: 'Credit' | 'Debit'; reason: string }): Promise<boolean> => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === payload.userId || c._id === payload.userId) {
          const current = c.shoppingCoinBalance || 0;
          const next = payload.type === 'Credit' ? current + payload.amount : Math.max(0, current - payload.amount);
          return { ...c, shoppingCoinBalance: next };
        }
        return c;
      })
    );
    const res = await AdminApiService.adjustCoins(payload);
    setTimeout(() => refreshData(), 500);
    return res.success;
  };

  // Save Variant Area Price
  const saveVariantAreaPrice = async (payload: {
    productId: string;
    variantId: string;
    areaId: string;
    price: number;
    mrp?: number;
    stock?: number;
  }): Promise<boolean> => {
    setAreaPricing((prev) => {
      const idx = prev.findIndex(
        (ap) =>
          (ap.variantId === payload.variantId || String(ap.variantId) === String(payload.variantId)) &&
          (ap.areaId === payload.areaId || String(ap.areaId) === String(payload.areaId))
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          price: payload.price,
          mrp: payload.mrp !== undefined ? payload.mrp : next[idx].mrp,
          stock: payload.stock !== undefined ? payload.stock : next[idx].stock,
        };
        return next;
      } else {
        return [
          ...prev,
          {
            id: `ap_${Date.now()}`,
            _id: `ap_${Date.now()}`,
            productId: payload.productId,
            variantId: payload.variantId,
            areaId: payload.areaId,
            price: payload.price,
            mrp: payload.mrp,
            stock: payload.stock,
            isAvailable: true,
          },
        ];
      }
    });

    const res = await AdminApiService.saveVariantAreaPrice(payload);
    setTimeout(() => refreshData(), 400);
    return res.success;
  };

  // Update Variant
  const updateVariant = async (variantId: string, data: { sellingPrice?: number; mrp?: number; stock?: number }): Promise<boolean> => {
    setProductVariants((prev) =>
      prev.map((v) =>
        (v.id === variantId || v._id === variantId)
          ? {
              ...v,
              sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : v.sellingPrice,
              mrp: data.mrp !== undefined ? data.mrp : v.mrp,
              stock: data.stock !== undefined ? data.stock : v.stock,
            }
          : v
      )
    );
    const res = await AdminApiService.updateVariant(variantId, data);
    setTimeout(() => refreshData(), 400);
    return res.success;
  };

  // Update Product (Full multi-variant and metadata update)
  const updateProduct = async (id: string, payload: any): Promise<boolean> => {
    const res = await AdminApiService.updateProduct(id, payload);
    setTimeout(() => refreshData(), 300);
    return res.success;
  };

  // Delete Product
  const deleteProduct = async (productId: string): Promise<boolean> => {
    setProducts((prev) => prev.filter((p) => p.id !== productId && p._id !== productId));
    const res = await AdminApiService.deleteProduct(productId);
    setTimeout(() => refreshData(), 400);
    return res.success;
  };

  // City Actions
  const createCity = async (payload: { name: string; code: string; state?: string; status?: string }) => {
    const res = await AdminApiService.createCity(payload);
    refreshData();
    return res;
  };

  const updateCity = async (id: string, payload: any) => {
    const res = await AdminApiService.updateCity(id, payload);
    refreshData();
    return res;
  };

  const deleteCity = async (id: string) => {
    const res = await AdminApiService.deleteCity(id);
    refreshData();
    return res;
  };

  // Area Actions
  const createArea = async (payload: any) => {
    const res = await AdminApiService.createArea(payload);
    refreshData();
    return res;
  };

  const updateArea = async (id: string, payload: any) => {
    const res = await AdminApiService.updateArea(id, payload);
    refreshData();
    return res;
  };

  const deleteArea = async (id: string) => {
    const res = await AdminApiService.deleteArea(id);
    refreshData();
    return res;
  };

  // Categories
  const createCategory = async (payload: any) => {
    const res = await AdminApiService.createCategory(payload);
    refreshData();
    return res;
  };

  const updateCategory = async (id: string, payload: any) => {
    const res = await AdminApiService.updateCategory(id, payload);
    refreshData();
    return res;
  };

  const deleteCategory = async (id: string) => {
    const res = await AdminApiService.deleteCategory(id);
    refreshData();
    return res;
  };

  // Payout Rates
  const savePayoutRate = async (payload: any) => {
    const res = await AdminApiService.savePayoutRate(payload);
    refreshData();
    return res;
  };

  const deletePayoutRate = async (id: string) => {
    const res = await AdminApiService.deletePayoutRate(id);
    refreshData();
    return res;
  };

  const simulatePayout = async (params: { cityId?: string; areaId?: string; cityName?: string; areaName?: string; distanceKm: number }) => {
    return await AdminApiService.simulatePayout(params);
  };

  // Wallets
  const settleStoreWallet = async (storeId: string, amount: number, notes?: string) => {
    const res = await AdminApiService.settleStoreWallet(storeId, amount, notes);
    refreshData();
    return res;
  };

  const payoutRiderWallet = async (riderId: string, amount: number, notes?: string) => {
    const res = await AdminApiService.payoutRiderWallet(riderId, amount, notes);
    refreshData();
    return res;
  };

  // Rider & Customer actions
  const updateRider = async (riderId: string, payload: any) => {
    const res = await AdminApiService.updateRider(riderId, payload);
    refreshData();
    return res;
  };

  const toggleCustomerBlock = async (userId: string, isBlocked: boolean) => {
    const res = await AdminApiService.toggleCustomerBlock(userId, isBlocked);
    refreshData();
    return res;
  };

  const createCustomer = async (payload: { name: string; phone: string; email?: string; address?: string; type?: string; zoneName?: string }) => {
    const res = await AdminApiService.createCustomer(payload);
    refreshData();
    return res;
  };

  const updateCustomer = async (userId: string, payload: any) => {
    const res = await AdminApiService.updateCustomer(userId, payload);
    refreshData();
    return res;
  };

  const cancelOrder = async (orderIdOrNumber: string, payload: { reason: string; refundAmount?: number }) => {
    const res = await AdminApiService.cancelOrder(orderIdOrNumber, payload);
    refreshData();
    return res;
  };

  // Marketing
  const createCampaign = async (payload: any) => {
    const res = await AdminApiService.createCampaign(payload);
    refreshData();
    return res;
  };

  const toggleCampaign = async (campaignId: string, isEnabled: boolean) => {
    const res = await AdminApiService.toggleCampaign(campaignId, isEnabled);
    refreshData();
    return res;
  };

  return (
    <AdminContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedStoreFilter,
        setSelectedStoreFilter,
        selectedCityFilter,
        setSelectedCityFilter,
        selectedAreaFilter,
        setSelectedAreaFilter,
        searchQuery,
        setSearchQuery,
        stores,
        orders,
        products,
        productVariants,
        areaPricing,
        categories,
        customers,
        riders,
        areas,
        cities,
        payoutRates,
        campaigns,
        auditLogs,
        isConnected,
        isSyncing,
        lastSyncTime,
        refreshData,
        createStore,
        toggleStoreShift,
        resetStorePassword,
        deleteStore,
        updateOrderStatus,
        updateProductPrice,
        saveVariantAreaPrice,
        updateVariant,
        updateProduct,
        deleteProduct,
        adjustCoins,
        createCategory,
        updateCategory,
        deleteCategory,
        createCity,
        updateCity,
        deleteCity,
        createArea,
        updateArea,
        deleteArea,
        savePayoutRate,
        deletePayoutRate,
        simulatePayout,
        settleStoreWallet,
        payoutRiderWallet,
        updateRider,
        toggleCustomerBlock,
        createCustomer,
        updateCustomer,
        cancelOrder,
        createCampaign,
        toggleCampaign,
        showAddStoreModal,
        setShowAddStoreModal,
        showAddProductModal,
        setShowAddProductModal,
        editingProductForModal,
        setEditingProductForModal,
        showAddCategoryModal,
        setShowAddCategoryModal,
        showAdjustCoinsModal,
        setShowAdjustCoinsModal,
        selectedOrderForModal,
        setSelectedOrderForModal,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
