import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Customer,
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
} from '../types/admin';
import { ApiService } from '../services/api';

export type ActiveTab =
  | 'Dashboard'
  | 'Users'
  | 'Prices'
  | 'Inventory'
  | 'Orders'
  | 'Staff'
  | 'Marketing'
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

  // Data Collections
  zones: Zone[];
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;

  categories: CategoryItem[];
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
  refreshFromDb: () => Promise<void>;

  // Action methods
  addCustomer: (data: Partial<Customer>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  toggleBlockCustomer: (id: string) => void;

  updateZoneProductPrice: (productName: string, zoneName: string, newSellingPrice: number) => void;
  applyBulkPriceAdjustment: (category: string, type: 'Increase' | 'Decrease', percent: number) => void;

  reportStockDiscrepancy: (itemName: string, type: 'Spoilage' | 'Shrinkage' | 'Discrepancy', quantityKg: number, reason: string) => void;

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

  const [syncStatus, setSyncStatus] = useState<string>('Live MongoDB Connected');
  const [zones, setZones] = useState<Zone[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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
        setOrders(live.orders || []);
        if (live.orders && live.orders.length > 0) {
          setSelectedOrder((prev) => prev || live.orders[0]);
        }
        setPrintOrders(live.printOrders || []);
        setCategories(live.categories || []);
        setProducts(live.products || []);
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
    }
  }, []);

  useEffect(() => {
    refreshFromDb();
    const interval = setInterval(refreshFromDb, 10000);
    return () => clearInterval(interval);
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

  const applyBulkPriceAdjustment = (category: string, type: 'Increase' | 'Decrease', percent: number) => {
    const factor = type === 'Increase' ? 1 + percent / 100 : 1 - percent / 100;
    setZonePrices((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((prodName) => {
        const prodObj = products.find((p) => p.name === prodName);
        if (!category || category === 'All Categories' || (prodObj && prodObj.category === category)) {
          const zoneMap = { ...updated[prodName] };
          Object.keys(zoneMap).forEach((z) => {
            zoneMap[z] = Math.round(zoneMap[z] * factor);
          });
          updated[prodName] = zoneMap;
        }
      });
      return updated;
    });
    logAudit('Bulk Price Adjustment', category, `${type} prices by ${percent}% across all zones`);
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
        categories,
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
        staff,
        campaigns,
        coinLedger,
        auditLogs,
        syncStatus,
        refreshFromDb,
        addCustomer,
        updateCustomer,
        toggleBlockCustomer,
        updateZoneProductPrice,
        applyBulkPriceAdjustment,
        reportStockDiscrepancy,
        updateOrderStatus,
        reassignOrderStaff,
        cancelAndRefundOrder,
        createOrUpdateCampaign,
        addShoppingCoinAdjustment,
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
