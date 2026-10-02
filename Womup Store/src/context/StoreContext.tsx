import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthStep,
  CurrentTab,
  SubScreen,
  StoreStaffProfile,
  StoreHub,
  StoreOrder,
  PickList,
  InventoryItem,
  StorePerformance,
} from '../types/store.types';
import { StoreApiService, TOKEN_STORAGE_KEY, STAFF_STORAGE_KEY } from '../services/storeApi';
import { storeSocket } from '../services/socket';

interface RiderArrivalAlert {
  orderId?: string;
  orderNumber: string;
  riderName: string;
  vehicleNumber?: string;
  phoneNumber?: string;
}

interface StoreContextType {
  authStep: AuthStep;
  setAuthStep: (step: AuthStep) => void;
  currentTab: CurrentTab;
  setCurrentTab: (tab: CurrentTab) => void;
  subScreen: SubScreen;
  setSubScreen: (screen: SubScreen) => void;

  staff: StoreStaffProfile | null;
  store: StoreHub | null;
  performance: StorePerformance | null;

  incomingOrders: StoreOrder[];
  pickingOrders: StoreOrder[];
  readyOrders: StoreOrder[];
  completedOrders: any[];
  activeOrder: StoreOrder | null;
  activePickList: PickList | null;

  inventory: InventoryItem[];
  inventoryFilter: string;
  setInventoryFilter: (f: string) => void;
  inventorySearch: string;
  setInventorySearch: (s: string) => void;

  riderArrivalAlert: RiderArrivalAlert | null;
  dismissRiderAlert: () => void;

  isLoading: boolean;
  shiftLoading: boolean;
  error: string | null;

  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;

  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Actions
  loginWithStoreCredentials: (loginId: string, password: string) => Promise<boolean>;
  sendOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  toggleShift: (isOnShift: boolean) => Promise<void>;
  logout: () => Promise<void>;

  selectOrderForDetail: (orderId: string) => Promise<void>;
  acceptOrderAndStartPick: (orderId: string) => Promise<void>;
  scanPickItem: (orderId: string, itemId: string, barcode: string) => Promise<{ isCompleted: boolean; nextItem: any }>;
  markOutOfStock: (orderId: string, itemId: string, reason: string, substituteId?: string) => Promise<void>;
  completePacking: (orderId: string, bagBarcode?: string, weight?: number) => Promise<string>;
  placeOnReadyShelf: (orderId: string, shelfSlot: string) => Promise<void>;
  completeHandover: (orderId: string, bagBarcode: string) => Promise<void>;

  refreshIncoming: () => Promise<void>;
  refreshPicking: () => Promise<void>;
  refreshReady: () => Promise<void>;
  refreshCompletedOrders: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  adjustStock: (productId: string, delta: number, reason: string, changeType?: string) => Promise<void>;
  updateShelfLocation: (productId: string, shelfLocation: string) => Promise<void>;
  addNewProduct: (productData: any) => Promise<boolean>;
  setActiveOrder: React.Dispatch<React.SetStateAction<StoreOrder | null>>;
  setActivePickList: React.Dispatch<React.SetStateAction<PickList | null>>;
  clearActivePicking: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStep, setAuthStep] = useState<AuthStep>('SPLASH');
  const [currentTab, setCurrentTab] = useState<CurrentTab>('Dashboard');
  const [subScreen, setSubScreen] = useState<SubScreen>(null);

  const [staff, setStaff] = useState<StoreStaffProfile | null>(null);
  const [store, setStore] = useState<StoreHub | null>(null);
  const [performance, setPerformance] = useState<StorePerformance | null>(null);

  const [incomingOrders, setIncomingOrders] = useState<StoreOrder[]>([]);
  const [pickingOrders, setPickingOrders] = useState<StoreOrder[]>([]);
  const [readyOrders, setReadyOrders] = useState<StoreOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<StoreOrder | null>(null);
  const [activePickList, setActivePickList] = useState<PickList | null>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryFilter, setInventoryFilter] = useState<string>('all');
  const [inventorySearch, setInventorySearch] = useState<string>('');

  const [riderArrivalAlert, setRiderArrivalAlert] = useState<RiderArrivalAlert | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shiftLoading, setShiftLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

const enrichStore = (rawStore: any): StoreHub | null => {
  if (!rawStore) return null;
  return {
    ...rawStore,
    cityName: rawStore.cityName || rawStore.city || 'Ahmedabad',
    areaName:
      rawStore.areaName ||
      (rawStore.name?.includes(' - ')
        ? rawStore.name.split(' - ')[0].replace(/^Wom\s*Up\s*/i, '').trim()
        : 'Chandlodiya'),
  };
};

// Initialize Session
  useEffect(() => {
    const initSession = async () => {
      // Always reset navigation state to default Dashboard on app boot/reload
      setCurrentTab('Dashboard');
      setSubScreen(null);
      setSidebarOpen(false);
      setActiveOrder(null);
      setActivePickList(null);
      setRiderArrivalAlert(null);

      if (typeof window !== 'undefined' && window.history) {
        try {
          window.history.replaceState(null, '', '/');
        } catch (e) {}
      }

      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) {
          setAuthStep('LOGIN');
          return;
        }

        const me = await StoreApiService.getMe();
        if (me && me.staff) {
          setStaff(me.staff);
          setStore(enrichStore(me.store));
          setPerformance({
            todayPicked: me.performance?.todayPicked ?? me.staff?.totalOrdersPicked ?? 0,
            avgPickTime: me.performance?.avgPickTime || null,
            avgPickTimeSeconds: me.performance?.avgPickTimeSeconds ?? 0,
            accuracy: me.performance?.accuracy ?? 100,
            currentStreak: me.performance?.currentStreak ?? 0,
            totalOrdersPicked: me.performance?.totalOrdersPicked ?? me.performance?.todayPicked ?? 0,
          });
          setAuthStep('AUTHENTICATED');

          if (me.store?.id) {
            storeSocket.connect(me.store.id);
          }
        } else {
          setAuthStep('LOGIN');
        }
      } catch (err) {
        console.log('[StoreContext] Init session error, routing to login:', err);
        setAuthStep('LOGIN');
      }
    };

    initSession();
  }, []);

  // WebSocket Live Listeners
  useEffect(() => {
    if (authStep !== 'AUTHENTICATED' || !store?.id) return;

    storeSocket.connect(store.id);

    // 1. New Order incoming
    storeSocket.on('new_order', (payload: any) => {
      console.log('[StoreContext] 🔔 WS new_order received:', payload);
      refreshIncoming();
    });

    // 2. Rider arrived at counter
    storeSocket.on('rider_at_store', (payload: any) => {
      console.log('[StoreContext] 🛵 WS rider_at_store alert:', payload);
      setRiderArrivalAlert({
        orderId: payload.orderId,
        orderNumber: payload.orderNumber || '#WORM-ORDER',
        riderName: payload.riderName || 'Delivery Partner',
        vehicleNumber: payload.vehicleNumber,
        phoneNumber: payload.phoneNumber,
      });
    });

    // 3. Inventory update
    storeSocket.on('inventory_update', (payload: any) => {
      console.log('[StoreContext] 📦 WS inventory_update:', payload);
      refreshInventory();
    });

    // 4. Shift status update
    storeSocket.on('store_shift_update', (payload: any) => {
      console.log('[StoreContext] 🔄 WS store_shift_update:', payload);
      if (typeof payload?.isOnShift === 'boolean') {
        setStaff((prev) => (prev ? { ...prev, isOnShift: payload.isOnShift } : prev));
      }
    });

    // 5. Order status updates (PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
    storeSocket.on('order_status', (payload: any) => {
      console.log('[StoreContext] 📦 WS order_status update:', payload);
      const updatedOrderId = (payload?.orderId || '').toString();
      const updatedOrderNum = payload?.orderNumber?.toString();
      const updatedStatus = payload?.status;

      // If active picking order is completed, packed, handed over, or delivered, clear picking state!
      if (
        ['PACKED', 'HANDED_OVER', 'GOING_TO_STORE', 'ARRIVED_AT_STORE', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(
          updatedStatus
        )
      ) {
        setActiveOrder((prev) => {
          if (!prev) return null;
          const currentId = (prev.id || prev._id || (prev as any).orderId || '').toString();
          const currentNum = prev.orderNumber?.toString();
          if (
            (updatedOrderId && currentId === updatedOrderId) ||
            (updatedOrderNum && currentNum === updatedOrderNum)
          ) {
            console.log(`[StoreContext] Clearing activeOrder ${currentNum || currentId} (new status: ${updatedStatus})`);
            setActivePickList(null);
            setSubScreen(null);
            return null;
          }
          return prev;
        });
      }

      // Refresh queues to guarantee real-time parity
      refreshIncoming();
      refreshPicking();
      refreshReady();
      refreshCompletedOrders();
    });

    return () => {
      storeSocket.off('new_order');
      storeSocket.off('rider_at_store');
      storeSocket.off('inventory_update');
      storeSocket.off('store_shift_update');
      storeSocket.off('order_status');
    };
  }, [authStep, store?.id]);

  // Load orders periodically when on shift
  const refreshIncoming = useCallback(async () => {
    try {
      const orders = await StoreApiService.getIncomingOrders();
      setIncomingOrders(orders || []);
    } catch (e) {
      console.log('[StoreContext] Failed fetching incoming orders:', e);
    }
  }, []);

  const refreshPicking = useCallback(async () => {
    try {
      const orders = await StoreApiService.getPickingOrders();
      setPickingOrders(orders || []);
    } catch (e) {
      console.log('[StoreContext] Failed fetching picking orders:', e);
    }
  }, []);

  const refreshReady = useCallback(async () => {
    try {
      const orders = await StoreApiService.getReadyOrders();
      setReadyOrders(orders || []);
    } catch (e) {
      console.log('[StoreContext] Failed fetching ready orders:', e);
    }
  }, []);

  const refreshCompletedOrders = useCallback(async () => {
    try {
      const orders = await StoreApiService.getCompletedOrders();
      setCompletedOrders(orders || []);
    } catch (e) {
      console.log('[StoreContext] Failed fetching completed orders:', e);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    try {
      const items = await StoreApiService.getInventory(inventorySearch, inventoryFilter);
      setInventory(items || []);
    } catch (e) {
      console.log('[StoreContext] Failed fetching inventory:', e);
    }
  }, [inventorySearch, inventoryFilter]);

  // Sync queues when tab changes
  useEffect(() => {
    if (authStep !== 'AUTHENTICATED') return;
    refreshIncoming();
    refreshPicking();
    refreshReady();
    refreshInventory();
  }, [authStep, currentTab]);

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const loginWithStoreCredentials = async (loginId: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await StoreApiService.loginWithStoreCredentials(loginId, password);
      if (data?.store) {
        setStore(enrichStore(data.store));
      }

      // Fetch fresh session profile with real performance numbers
      const me = await StoreApiService.getMe().catch(() => null);
      if (me && me.staff) {
        setStaff(me.staff);
        if (me.store) setStore(enrichStore(me.store));
        setPerformance({
          todayPicked: me.performance?.todayPicked ?? me.staff?.totalOrdersPicked ?? 0,
          avgPickTime: me.performance?.avgPickTime || null,
          avgPickTimeSeconds: me.performance?.avgPickTimeSeconds ?? 0,
          accuracy: me.performance?.accuracy ?? 100,
          currentStreak: me.performance?.currentStreak ?? 0,
          totalOrdersPicked: me.performance?.totalOrdersPicked ?? me.performance?.todayPicked ?? 0,
        });
      } else if (data?.store) {
        setStaff({
          id: `staff_${data.store.code}`,
          userId: data.store.id,
          storeId: data.store.id,
          employeeCode: `STF-${data.store.code}`,
          fullName: `${data.store.name} Staff`,
          email: `${data.store.loginId}@wormup.com`,
          phoneNumber: '+91 98765 43220',
          role: 'PICKER',
          shift: 'MORNING',
          isOnShift: true,
          activeOrderId: null,
          totalOrdersPicked: 0,
          avgPickTimeSeconds: 0,
          accuracy: 100,
          status: 'ACTIVE',
        });
        setPerformance({
          todayPicked: 0,
          avgPickTime: null,
          avgPickTimeSeconds: 0,
          accuracy: 100,
          currentStreak: 0,
          totalOrdersPicked: 0,
        });
      }

      setAuthStep('AUTHENTICATED');
      if (data.store?.id) {
        storeSocket.connect(data.store.id);
        console.log(`[StoreContext] Connected to dark store: ${data.store.name}`);
      }
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Login failed. Invalid Store ID or Password.');
      return false;
    }
  };

  const sendOtp = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await StoreApiService.sendOtp(email);
      setPendingEmail(email);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to send OTP');
      return false;
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await StoreApiService.verifyOtp(email, otp);
      setStaff(data.staff);
      setStore(enrichStore(data.store));
      setAuthStep('AUTHENTICATED');
      if (data.store?.id) {
        storeSocket.connect(data.store.id);
      }
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Invalid verification code');
      return false;
    }
  };

  const toggleShift = async (isOnShift: boolean) => {
    setShiftLoading(true);
    // Optimistic update
    setStaff((prev) => (prev ? { ...prev, isOnShift } : prev));
    try {
      const res = await StoreApiService.updateShift(isOnShift);
      if (typeof res?.isOnShift === 'boolean') {
        setStaff((prev) => (prev ? { ...prev, isOnShift: res.isOnShift } : prev));
      }
      setShiftLoading(false);
    } catch (err: any) {
      console.log('[StoreContext] toggleShift error:', err);
      // Revert on error
      setStaff((prev) => (prev ? { ...prev, isOnShift: !isOnShift } : prev));
      setShiftLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    await StoreApiService.logout();
    storeSocket.disconnect();
    setStaff(null);
    setStore(null);
    setAuthStep('LOGIN');
    setCurrentTab('Dashboard');
    setSubScreen(null);
  };

  const selectOrderForDetail = async (orderId: string) => {
    setIsLoading(true);
    try {
      const detail = await StoreApiService.getOrderDetail(orderId);
      setActiveOrder(detail);
      setActivePickList(detail.pickList);
      setSubScreen('OrderDetail');
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed loading order detail');
    }
  };

  const acceptOrderAndStartPick = async (orderId: string) => {
    setIsLoading(true);
    try {
      const res = await StoreApiService.acceptOrder(orderId);
      setActivePickList(res.pickList);
      const detail = await StoreApiService.getOrderDetail(orderId);
      setActiveOrder(detail);
      setSubScreen('PickingCore');
      refreshIncoming();
      refreshPicking();
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed accepting order');
    }
  };

  const scanPickItem = async (orderId: string, itemId: string, barcode: string) => {
    const res = await StoreApiService.pickItem(orderId, itemId, barcode);
    if (activePickList) {
      const updatedItems = activePickList.items.map((i) =>
        i.productId?.toString() === itemId || i.barcode === barcode
          ? { ...i, status: 'PICKED' as const }
          : i
      );
      setActivePickList({ ...activePickList, items: updatedItems });
    }
    return res;
  };

  const markOutOfStock = async (orderId: string, itemId: string, reason: string, substituteId?: string) => {
    await StoreApiService.outOfStock(orderId, itemId, reason, substituteId);
    if (activePickList) {
      const updatedItems = activePickList.items.map((i) =>
        i.productId?.toString() === itemId ? { ...i, status: 'OUT_OF_STOCK' as const, notes: reason } : i
      );
      setActivePickList({ ...activePickList, items: updatedItems });
    }
  };

  const completePacking = async (orderId: string, bagBarcode?: string, weight?: number) => {
    const res = await StoreApiService.packComplete(orderId, bagBarcode, weight);
    refreshPicking();
    refreshReady();
    return res.bagBarcode;
  };

  const placeOnReadyShelf = async (orderId: string, shelfSlot: string) => {
    await StoreApiService.readyForPickup(orderId, shelfSlot);
    refreshReady();
    setSubScreen(null);
    setActiveOrder((prev) => {
      const curId = (prev?.id || prev?._id || (prev as any)?.orderId || '').toString();
      return curId === orderId.toString() ? null : prev;
    });
    setActivePickList(null);
  };

  const completeHandover = async (orderId: string, bagBarcode: string) => {
    await StoreApiService.handover(orderId, bagBarcode);
    refreshReady();
    refreshCompletedOrders();
    setSubScreen(null);
    setActiveOrder((prev) => {
      const curId = (prev?.id || prev?._id || (prev as any)?.orderId || '').toString();
      return curId === orderId.toString() ? null : prev;
    });
    setActivePickList(null);
    dismissRiderAlert();
  };

  const clearActivePicking = () => {
    setActiveOrder(null);
    setActivePickList(null);
    setSubScreen(null);
  };

  const adjustStock = async (productId: string, delta: number, reason: string, changeType?: string) => {
    await StoreApiService.adjustStock(productId, delta, reason, changeType);
    refreshInventory();
  };

  const updateShelfLocation = async (productId: string, shelfLocation: string) => {
    const clean = shelfLocation.trim().toUpperCase();
    await StoreApiService.updateShelfLocation(productId, clean);
    // Optimistic update in inventory
    setInventory((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, shelfLocation: clean } : item
      )
    );
    // Optimistic update in activePickList if currently picking this product
    setActivePickList((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((it) =>
          it.productId?.toString() === productId ? { ...it, shelfLocation: clean } : it
        ),
      };
    });
    await refreshInventory();
  };

  const addNewProduct = async (productData: any): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await StoreApiService.addProduct(productData);
      await refreshInventory();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to add product');
      throw err;
    }
  };

  const dismissRiderAlert = () => setRiderArrivalAlert(null);

  return (
    <StoreContext.Provider
      value={{
        authStep,
        setAuthStep,
        currentTab,
        setCurrentTab,
        subScreen,
        setSubScreen,
        staff,
        store,
        performance,
        incomingOrders,
        pickingOrders,
        readyOrders,
        completedOrders,
        activeOrder,
        activePickList,
        inventory,
        inventoryFilter,
        setInventoryFilter,
        inventorySearch,
        setInventorySearch,
        riderArrivalAlert,
        dismissRiderAlert,
        isLoading,
        shiftLoading,
        error,
        pendingEmail,
        setPendingEmail,
        isSidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        loginWithStoreCredentials,
        sendOtp,
        verifyOtp,
        toggleShift,
        logout,
        selectOrderForDetail,
        acceptOrderAndStartPick,
        scanPickItem,
        markOutOfStock,
        completePacking,
        placeOnReadyShelf,
        completeHandover,
        refreshIncoming,
        refreshPicking,
        refreshReady,
        refreshCompletedOrders,
        refreshInventory,
        adjustStock,
        updateShelfLocation,
        addNewProduct,
        setActiveOrder,
        setActivePickList,
        clearActivePicking,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
