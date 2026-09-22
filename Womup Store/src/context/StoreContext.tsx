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
  error: string | null;

  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;

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
  refreshInventory: () => Promise<void>;
  adjustStock: (productId: string, delta: number, reason: string, changeType?: string) => Promise<void>;
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
  const [activeOrder, setActiveOrder] = useState<StoreOrder | null>(null);
  const [activePickList, setActivePickList] = useState<PickList | null>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryFilter, setInventoryFilter] = useState<string>('all');
  const [inventorySearch, setInventorySearch] = useState<string>('');

  const [riderArrivalAlert, setRiderArrivalAlert] = useState<RiderArrivalAlert | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Session
  useEffect(() => {
    const initSession = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) {
          setAuthStep('LOGIN');
          return;
        }

        const me = await StoreApiService.getMe();
        if (me && me.staff) {
          setStaff(me.staff);
          setStore(me.store);
          setPerformance(me.performance);
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

    return () => {
      storeSocket.off('new_order');
      storeSocket.off('rider_at_store');
      storeSocket.off('inventory_update');
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
        setStore(data.store);
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
          avgPickTimeSeconds: 120,
          accuracy: 99.5,
          status: 'ACTIVE',
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
      setStore(data.store);
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
    try {
      const res = await StoreApiService.updateShift(isOnShift);
      if (staff) {
        setStaff({ ...staff, isOnShift: res.isOnShift });
      }
    } catch (err: any) {
      console.log('[StoreContext] toggleShift error:', err);
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
  };

  const completeHandover = async (orderId: string, bagBarcode: string) => {
    await StoreApiService.handover(orderId, bagBarcode);
    refreshReady();
    setSubScreen(null);
    dismissRiderAlert();
  };

  const adjustStock = async (productId: string, delta: number, reason: string, changeType?: string) => {
    await StoreApiService.adjustStock(productId, delta, reason, changeType);
    refreshInventory();
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
        error,
        pendingEmail,
        setPendingEmail,
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
        refreshInventory,
        adjustStock,
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
