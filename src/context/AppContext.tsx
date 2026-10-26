import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import {
  Product,
  CartItem,
  Order,
  UserProfile,
  Address,
  FilterSortState,
  ScreenId,
  BlinkitProduct,
} from '../types';
import { INITIAL_USER, INITIAL_ADDRESS, AuthService } from '../services/authService';
import { CartService, CartSummary } from '../services/cartService';
import { StorageService } from '../services/storageService';
import { ProductService } from '../services/productService';
import { OrderService } from '../services/orderService';
import { AddressService } from '../services/addressService';
import { LocationService } from '../services/locationService';
import { api } from '../services/api';
import io, { Socket } from 'socket.io-client';
import { matchAreaByName } from '../data/areas';

export interface BlinkitCartEntry {
  product: BlinkitProduct;
  quantity: number;
}

export const mapProductToBlinkit = (p: Product): BlinkitProduct => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.categoryId,
  packSize: p.quantityLabel || '1 unit',
  sellingPrice: p.sellingPrice,
  mrp: p.mrp,
  discountBadge: p.discountPercent > 0 ? `${p.discountPercent}% OFF` : undefined,
  deliveryMinutes: p.deliveryMinutes || 9,
  rating: p.rating || 4.8,
  reviewCount: p.reviewCount || 120,
  stockUrgency: p.stock < 10 ? `Only ${p.stock} left` : undefined,
  stock: p.stock || 100,
  imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
  galleryImages: [p.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'],
  specifications: p.specifications || {},
  variants: p.variants || [],
});

export const mapBlinkitToProduct = (bp: BlinkitProduct): Product => ({
  id: bp.id,
  name: bp.name,
  brand: bp.brand,
  categoryId: bp.category,
  quantityLabel: bp.packSize || '1 unit',
  sellingPrice: bp.sellingPrice,
  mrp: bp.mrp,
  discountPercent:
    bp.mrp > bp.sellingPrice
      ? Math.round(((bp.mrp - bp.sellingPrice) / bp.mrp) * 100)
      : 0,
  shoppingCoins: 10,
  rating: bp.rating || 4.8,
  reviewCount: bp.reviewCount || 100,
  stock: bp.stock || 100,
  deliveryMinutes: bp.deliveryMinutes || 9,
  description: bp.description || `${bp.name} - Fresh everyday essential`,
  imageUrl: bp.imageUrl || (bp.galleryImages && bp.galleryImages[0]) || '',
  variants: bp.variants || [],
  specifications: bp.specifications || {},
});

const DEFAULT_FALLBACK_PRODUCT: Product = {
  id: 'prod_default',
  name: 'Loading Products...',
  brand: 'Womup',
  categoryId: 'cooking',
  quantityLabel: '1 unit',
  mrp: 100,
  sellingPrice: 90,
  discountPercent: 10,
  shoppingCoins: 10,
  rating: 4.8,
  reviewCount: 50,
  stock: 100,
  deliveryMinutes: 9,
  description: 'Fresh quality products delivered in 9 minutes.',
  imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
};

interface AppContextType {
  // Current screen for jumper & fallback navigation
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  goBack: () => void;
  canGoBack: boolean;

  // Auth & Profile
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  selectedAddress: Address;
  selectedAddressId: string | null;
  selectedAddressSource: 'SAVED' | 'GPS';
  setSelectedAddress: (address: Address) => void;
  setActiveDeliveryAddress: (address: Address) => Promise<void>;
  setActiveGpsLocation: (loc: any) => Promise<void>;
  addAddress: (address: Address) => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartSummary: CartSummary;
  syncCartFromSummary: (cartSummary: any) => void;

  // Shopping Coins
  appliedCoins: number;
  setAppliedCoins: (coins: number) => void;

  // Orders
  orders: Order[];
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  placeOrder: (paymentMethod: string, options?: { tip?: number; deliveryInstructions?: string; walletDeduction?: number; deliveryFee?: number }) => Promise<Order>;

  // Product Selection for Details / Listing
  selectedProduct: Product;
  setSelectedProduct: (product: Product) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (categoryId: string) => void;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (categoryIds: string[]) => void;
  selectedCategoryName: string;
  setSelectedCategoryName: (name: string) => void;
  navigateToProductListing: (title: string, categoryIds: string[]) => void;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isVoiceSearchActive: boolean;
  setIsVoiceSearchActive: (active: boolean) => void;
  filters: FilterSortState;
  setFilters: (filters: FilterSortState) => void;
  resetFilters: () => void;

  // Dev screen jumper modal visibility
  isJumperVisible: boolean;
  setJumperVisible: (visible: boolean) => void;

  // --- Blinkit Specific Extensions ---
  walletBalance: number;
  addWalletBalance: (amount: number) => void;
  hideSensitiveItems: boolean;
  setHideSensitiveItems: (value: boolean) => void;
  appearance: 'LIGHT' | 'DARK' | 'SYSTEM';
  setAppearance: (value: 'LIGHT' | 'DARK' | 'SYSTEM') => void;
  deliveryLocation: string;
  setDeliveryLocation: (location: string) => void;
  isLocationModalVisible: boolean;
  setLocationModalVisible: (visible: boolean) => void;
  isDistrictModalVisible: boolean;
  setDistrictModalVisible: (visible: boolean) => void;

  // Blinkit Cart
  blinkitCart: Record<string, BlinkitCartEntry>;
  blinkitCartList: BlinkitCartEntry[];
  blinkitCartCount: number;
  blinkitCartTotal: number;
  blinkitMrpTotal: number;
  updateBlinkitQty: (product: BlinkitProduct, delta: number, variantId?: string) => void;
  getBlinkitQty: (productId: string, variantId?: string) => number;
  clearBlinkitCart: () => void;
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;

  // Blinkit PDP product
  selectedBlinkitProduct: BlinkitProduct;
  setSelectedBlinkitProduct: (product: BlinkitProduct) => void;

  // Wishlist
  wishlist: BlinkitProduct[];
  toggleWishlist: (product: BlinkitProduct) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;

  // Delivery Area & Dark Store Resolution
  currentAreaId: string | null;
  currentAreaName: string | null;
  currentStoreId: string | null;
  currentStoreName: string | null;
  isServiceable: boolean;
  setIsServiceable: (serviceable: boolean) => void;
  deliveryEtaMinutes: number | null;
  setDeliveryEtaMinutes: (minutes: number | null) => void;
  setCurrentArea: (areaId: string, areaName: string) => void;
  setCurrentStore: (storeId: string | null, storeName: string | null) => void;
  catalogVersion: number;

  // Onboarding & Auth State
  isAuthenticated: boolean;
  handleOnboardingSkip: () => void;
  authVerificationId: string | null;
  setAuthVerificationId: (id: string | null) => void;
  tempRegistration: {
    firstName?: string;
    surname?: string;
    fullName: string;
    email: string;
    phone?: string;
    referralCode?: string;
    preferredCityId?: string;
    preferredCityName?: string;
    pincode?: string;
    city?: string;
    fullNameAsPerAadhaar?: string;
    sponsorCode?: string;
  };
  setTempRegistration: (data: {
    firstName?: string;
    surname?: string;
    fullName: string;
    email: string;
    phone?: string;
    referralCode?: string;
    preferredCityId?: string;
    preferredCityName?: string;
    pincode?: string;
    city?: string;
    fullNameAsPerAadhaar?: string;
    sponsorCode?: string;
  }) => void;
  logout: () => Promise<void>;

  // Delivery City
  currentCityName: string | null;
  setCurrentCityName: (name: string | null) => void;
  currentCityId: string | null;
  setCurrentCityId: (id: string | null) => void;

  // Real-time Cross-device Checkout Synchronization
  liveCheckoutState: {
    paymentMethod?: 'UPI' | 'COD' | 'CARD';
    tip?: number;
    deliveryInstruction?: string;
    useCoins?: boolean;
    selectedAddressType?: 'CURRENT_GPS' | 'SAVED';
    addressId?: string;
    recipientName?: string;
    phoneNumber?: string;
    houseFlat?: string;
    street?: string;
    areaLandmark?: string;
    pincode?: string;
    couponCode?: string;
  };
  emitCheckoutChange: (payload: any) => void;

  // Guest Activity Auth Guard Modal
  isAuthPromptVisible: boolean;
  authPromptMessage: string;
  authPromptActionName: string;
  openAuthPrompt: (message?: string, actionName?: string) => void;
  closeAuthPrompt: () => void;
  requestLocationPermissionAndDetect: () => Promise<void>;
}

const DEFAULT_FILTERS: FilterSortState = {
  sortBy: 'popularity',
  priceRange: [0, 2000],
  inStockOnly: false,
};

const TAB_SCREENS: ScreenId[] = [
  'Blinkit_Home',
  'Blinkit_OrderAgain',
  'Blinkit_Categories',
  'C12_Home',
  'C13_Category',
  'C19_Cart',
  'C25_OrderHistory',
  'C26_Account',
];

const ONBOARDING_PREVIOUS: Record<string, ScreenId> = {
  C03_Onboarding2: 'C02_Onboarding1',
  C04_Onboarding3: 'C03_Onboarding2',
  C05_Onboarding4: 'C04_Onboarding3',
  C06_MobileNumber: 'C05_Onboarding4',
  C07_OtpVerification: 'C06_MobileNumber',
  C08_CreateAccount: 'C07_OtpVerification',
  C09_ReferralCode: 'C08_CreateAccount',
  C10_LocationPermission: 'C09_ReferralCode',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [activeScreen, setActiveScreenState] = useState<ScreenId>('C01_Splash');
  const [history, setHistory] = useState<ScreenId[]>(['C01_Splash']);

  // Onboarding & Auth State
  const [authVerificationId, setAuthVerificationIdState] = useState<string | null>(null);
  const setAuthVerificationId = useCallback((id: string | null) => {
    setAuthVerificationIdState(id);
    if (id) {
      StorageService.saveItem(StorageService.KEYS.AUTH_VERIFICATION_ID, id);
    } else {
      StorageService.removeItem(StorageService.KEYS.AUTH_VERIFICATION_ID);
    }
  }, []);
  const [tempRegistration, setTempRegistration] = useState<{
    firstName?: string;
    surname?: string;
    fullName: string;
    email: string;
    phone?: string;
    referralCode?: string;
    preferredCityId?: string;
    preferredCityName?: string;
    pincode?: string;
    city?: string;
    fullNameAsPerAadhaar?: string;
    sponsorCode?: string;
  }>({
    firstName: '',
    surname: '',
    fullName: '',
    email: '',
    phone: '',
    referralCode: '',
    preferredCityId: undefined,
    preferredCityName: 'Ahmedabad',
    pincode: '',
    city: 'Ahmedabad',
    fullNameAsPerAadhaar: '',
    sponsorCode: '',
  });

  // User Profile
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [selectedAddress, setSelectedAddressState] = useState<Address>(INITIAL_ADDRESS);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddressSource, setSelectedAddressSource] = useState<'SAVED' | 'GPS'>('SAVED');
  const selectedAddressSourceRef = useRef<'SAVED' | 'GPS'>('SAVED');
  const selectedAddressRef = useRef<Address>(INITIAL_ADDRESS);
  selectedAddressSourceRef.current = selectedAddressSource;
  selectedAddressRef.current = selectedAddress;
  const activeSelectionEpochRef = useRef<number>(0);

  const setSelectedAddress = useCallback((addr: Address) => {
    setSelectedAddressState(addr);
    const id = addr?.id || (addr as any)?._id || null;
    setSelectedAddressId(id);
    if (addr?.type === 'Current' && (!id || id.startsWith('current_'))) {
      setSelectedAddressSource('GPS');
    } else {
      setSelectedAddressSource('SAVED');
    }
    if (addr) {
      StorageService.saveItem(StorageService.KEYS.SELECTED_ADDRESS, addr);
    }
  }, []);

  const setActiveDeliveryAddress = useCallback(async (address: Address) => {
    const epoch = ++activeSelectionEpochRef.current;
    const addrId = address.id || (address as any)._id || null;

    // Ensure valid coordinates
    let targetLat = typeof address.latitude === 'number' && !isNaN(address.latitude) ? address.latitude : undefined;
    let targetLng = typeof address.longitude === 'number' && !isNaN(address.longitude) ? address.longitude : undefined;

    // Check if the address specifies a known area (e.g. "Prahlad Nagar")
    const matchedArea = matchAreaByName(address.areaLandmark || address.street || address.houseFlat || address.city);
    if (matchedArea) {
      if (targetLat === undefined || targetLng === undefined) {
        targetLat = matchedArea.lat;
        targetLng = matchedArea.lng;
      } else {
        // If stored coordinates are geographically divergent from the selected area (e.g., GPS coords from Tragad while address is Prahlad Nagar),
        // re-anchor coordinates to the chosen area center so the correct local dark store is resolved.
        const dLat = (targetLat - matchedArea.lat) * 111;
        const dLng = (targetLng - matchedArea.lng) * 111 * Math.cos((matchedArea.lat * Math.PI) / 180);
        const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
        if (distKm > 6.0) {
          targetLat = matchedArea.lat;
          targetLng = matchedArea.lng;
        }
      }
    } else if (targetLat === undefined || targetLng === undefined) {
      const queryStr = `${address.houseFlat || ''} ${address.street || ''} ${address.areaLandmark || ''} ${address.city || ''}`;
      const matched = matchAreaByName(queryStr);
      if (matched) {
        targetLat = matched.lat;
        targetLng = matched.lng;
      }
    }

    CartService.clearCache();

    const normalized: Address = {
      ...address,
      id: addrId || `addr_${Date.now()}`,
      latitude: targetLat,
      longitude: targetLng,
    };

    const shortLabel = normalized.houseFlat || normalized.street || normalized.areaLandmark || normalized.city;
    const displayLabel = `${normalized.type || 'Home'} — ${shortLabel}`;

    // 1. Authoritative state transition
    setSelectedAddressState(normalized);
    setSelectedAddressId(addrId);
    setSelectedAddressSource('SAVED');
    setDeliveryLocation(displayLabel);

    await StorageService.saveItem(StorageService.KEYS.SELECTED_ADDRESS, {
      ...normalized,
      _selectedAddressId: addrId,
      _selectedSource: 'SAVED',
    });

    // 2. Resolve delivery area and eligible dark store
    if (targetLat !== undefined && targetLng !== undefined) {
      LocationService.clearCache();
      try {
        const area = await LocationService.resolveArea(targetLat, targetLng, true);
        if (epoch !== activeSelectionEpochRef.current) {
          console.warn(`[AppContext] Stale resolveArea dropped for epoch ${epoch} (current is ${activeSelectionEpochRef.current})`);
          return;
        }

        if (area) {
          setCurrentAreaId(area.areaId);
          setCurrentAreaName(area.areaName);
          setCurrentCityName(area.city || user.preferredCityName || 'Ahmedabad');
          setCurrentStoreId(area.storeId || null);
          setCurrentStoreName(area.storeName || null);
          setIsServiceable(area.serviceable === true);
          setDeliveryEtaMinutes(area.deliveryMinutes || 9);

          // Refresh products catalog for this new area and store
          try {
            const liveProducts = await ProductService.fetchProducts({
              areaId: area.areaId,
              storeId: area.storeId,
            });
            if (epoch === activeSelectionEpochRef.current && liveProducts && liveProducts.length > 0) {
              setSelectedProduct(liveProducts[0]);
              setSelectedBlinkitProduct(mapProductToBlinkit(liveProducts[0]));
            }
          } catch (pErr) {
            console.warn('[AppContext] Failed to refresh products for resolved area:', pErr);
          }
        }
      } catch (err) {
        console.error('[AppContext] Error resolving area for saved address:', err);
      }
    }
  }, [user.preferredCityName]);

  const setActiveGpsLocation = useCallback(async (loc: any) => {
    if (!loc) return;
    const epoch = ++activeSelectionEpochRef.current;

    const shortLabel = loc.shortAddress || loc.readableAddress;
    const displayLabel = `Current Location — ${shortLabel}`;

    const addressObj: Address = {
      id: `current_${Date.now()}`,
      type: 'Current' as const,
      fullName: user.fullName || 'Customer',
      phoneNumber: user.phoneNumber || '',
      houseFlat: loc.street || 'Current GPS Location',
      areaLandmark: loc.areaLandmark || loc.shortAddress,
      city: loc.city || 'Ahmedabad',
      pincode: loc.pincode || '380015',
      latitude: loc.latitude,
      longitude: loc.longitude,
      isDefault: true,
    };

    setSelectedAddressState(addressObj);
    setSelectedAddressId(addressObj.id);
    setSelectedAddressSource('GPS');
    setDeliveryLocation(displayLabel);

    await StorageService.saveItem(StorageService.KEYS.SELECTED_ADDRESS, {
      ...addressObj,
      _selectedAddressId: addressObj.id,
      _selectedSource: 'GPS',
    });

    LocationService.clearCache();

    try {
      const area = await LocationService.resolveArea(loc.latitude, loc.longitude, true);
      if (epoch !== activeSelectionEpochRef.current) {
        console.warn(`[AppContext] Stale GPS resolveArea dropped for epoch ${epoch}`);
        return;
      }

      if (area) {
        setCurrentAreaId(area.areaId);
        setCurrentAreaName(area.areaName);
        setCurrentCityName(area.city || user.preferredCityName || 'Ahmedabad');
        setCurrentStoreId(area.storeId || null);
        setCurrentStoreName(area.storeName || null);
        setIsServiceable(area.serviceable === true);
        setDeliveryEtaMinutes(area.deliveryMinutes || 9);

        try {
          const liveProducts = await ProductService.fetchProducts({
            areaId: area.areaId,
            storeId: area.storeId,
          });
          if (epoch === activeSelectionEpochRef.current && liveProducts && liveProducts.length > 0) {
            setSelectedProduct(liveProducts[0]);
            setSelectedBlinkitProduct(mapProductToBlinkit(liveProducts[0]));
          }
        } catch (pErr) {
          console.warn('[AppContext] Failed to refresh products for GPS area:', pErr);
        }
      }
    } catch (err) {
      console.error('[AppContext] Error resolving area for GPS:', err);
    }
  }, [user.fullName, user.phoneNumber, user.preferredCityName]);

  // Delivery Area, City & Dark Store Resolution
  const [currentAreaId, setCurrentAreaId] = useState<string | null>(null);
  const [currentAreaName, setCurrentAreaName] = useState<string | null>(null);
  const [currentCityName, setCurrentCityName] = useState<string | null>(null);
  const [currentCityId, setCurrentCityId] = useState<string | null>(null);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [currentStoreName, setCurrentStoreName] = useState<string | null>(null);
  const [isServiceable, setIsServiceable] = useState<boolean>(false);
  const [deliveryEtaMinutes, setDeliveryEtaMinutes] = useState<number | null>(null);
  const [catalogVersion, setCatalogVersion] = useState<number>(0);

  // Cross-device live checkout synchronization
  const [liveCheckoutState, setLiveCheckoutState] = useState<{
    paymentMethod?: 'UPI' | 'COD' | 'CARD';
    tip?: number;
    deliveryInstruction?: string;
    useCoins?: boolean;
    selectedAddressType?: 'CURRENT_GPS' | 'SAVED';
    addressId?: string;
    recipientName?: string;
    phoneNumber?: string;
    houseFlat?: string;
    street?: string;
    areaLandmark?: string;
    pincode?: string;
    couponCode?: string;
  }>({});

  const emitCheckoutChange = useCallback((payload: any) => {
    if (syncSocketRef.current) {
      syncSocketRef.current.emit('checkout_changed', payload);
    }
  }, []);

  const isValidMongoId = (id: string | null | undefined): boolean => {
    if (!id) return false;
    return /^[a-f\d]{24}$/i.test(id);
  };

  const setCurrentArea = (areaId: string, areaName: string) => {
    if (areaId && !isValidMongoId(areaId)) {
      console.warn(`[AppContext Guard] Invalid non-MongoDB areaId "${areaId}". Resolving live authoritative area...`);
      LocationService.resolveArea().then((loc) => {
        if (loc?.areaId && isValidMongoId(loc.areaId)) {
          setCurrentArea(loc.areaId, loc.areaName);
        }
      });
      return;
    }

    setCurrentAreaId(areaId);
    setCurrentAreaName(areaName);

    if (syncSocketRef.current?.connected) {
      syncSocketRef.current.emit('location_changed', {
        areaId,
        areaName,
        storeId: currentStoreId,
        storeName: currentStoreName,
        city: currentCityName || 'Ahmedabad',
        deliveryMinutes: deliveryEtaMinutes || 9,
      });
    }
  };

  const setCurrentStore = (storeId: string | null, storeName: string | null) => {
    if (storeId && !isValidMongoId(storeId)) {
      console.warn(`[AppContext Guard] Invalid non-MongoDB storeId "${storeId}". Resolving live authoritative store...`);
      LocationService.resolveArea().then((loc) => {
        if (loc?.storeId && isValidMongoId(loc.storeId)) {
          setCurrentStore(loc.storeId, loc.storeName || storeName);
        }
      });
      return;
    }

    setCurrentStoreId(storeId);
    setCurrentStoreName(storeName);

    if (syncSocketRef.current?.connected) {
      syncSocketRef.current.emit('location_changed', {
        areaId: currentAreaId,
        areaName: currentAreaName,
        storeId,
        storeName,
        city: currentCityName || 'Ahmedabad',
        deliveryMinutes: deliveryEtaMinutes || 9,
      });
    }
  };

  // Blinkit Extensions
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [hideSensitiveItems, setHideSensitiveItems] = useState<boolean>(false);
  const [appearance, setAppearance] = useState<'LIGHT' | 'DARK' | 'SYSTEM'>('LIGHT');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('Set Delivery Location');
  const [isLocationModalVisible, setLocationModalVisible] = useState<boolean>(false);
  const [isDistrictModalVisible, setDistrictModalVisible] = useState<boolean>(false);
  const [selectedBlinkitProduct, setSelectedBlinkitProduct] = useState<BlinkitProduct>(
    mapProductToBlinkit(DEFAULT_FALLBACK_PRODUCT)
  );

  // Live real cart with instant local persistence hydration
  const [blinkitCart, setBlinkitCart] = useState<Record<string, BlinkitCartEntry>>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(StorageService.KEYS.BLINKIT_CART);
        if (raw) return JSON.parse(raw);
        const legacy = window.localStorage.getItem(StorageService.KEYS.CART);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const res: Record<string, BlinkitCartEntry> = {};
            parsed.forEach((item: any) => {
              if (item?.product?.id) {
                res[item.product.id] = {
                  product: mapProductToBlinkit(item.product),
                  quantity: item.quantity,
                };
              }
            });
            return res;
          }
        }
      } catch {}
    }
    return {};
  });
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const isAuthenticated = !!(
    api.getToken() &&
    user &&
    (user.email || user.phoneNumber) &&
    (user.email.length > 0 || user.phoneNumber.length > 0)
  );

  // Guest Activity Auth Guard Modal State
  const [isAuthPromptVisible, setIsAuthPromptVisible] = useState<boolean>(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string>('');
  const [authPromptActionName, setAuthPromptActionName] = useState<string>('');

  const openAuthPrompt = useCallback((message?: string, actionName?: string) => {
    setAuthPromptMessage(message || 'Please sign in or register to continue.');
    setAuthPromptActionName(actionName || 'Login or Register');
    setIsAuthPromptVisible(true);
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setIsAuthPromptVisible(false);
  }, []);

  const isDetectingGpsRef = useRef(false);
  const hasDetectedGpsOnceRef = useRef(false);

  const requestLocationPermissionAndDetect = useCallback(async (force = false) => {
    if (isDetectingGpsRef.current) return;
    if (!force && hasDetectedGpsOnceRef.current) return;

    // If user has already selected a saved address, DO NOT override with device GPS!
    if (
      selectedAddressSourceRef.current === 'SAVED' &&
      selectedAddressRef.current &&
      selectedAddressRef.current.type !== 'Current' &&
      !selectedAddressRef.current.id?.startsWith('current_')
    ) {
      return;
    }

    isDetectingGpsRef.current = true;
    try {
      const loc = await LocationService.getCurrentLocation();
      if (loc) {
        hasDetectedGpsOnceRef.current = true;
        if (
          selectedAddressSourceRef.current === 'SAVED' &&
          selectedAddressRef.current &&
          selectedAddressRef.current.type !== 'Current' &&
          !selectedAddressRef.current.id?.startsWith('current_')
        ) {
          return;
        }
        await setActiveGpsLocation(loc);
      }
    } catch (err) {
      // non-fatal: location permission denied or GPS unavailable
    } finally {
      isDetectingGpsRef.current = false;
    }
  }, [setActiveGpsLocation]);

  const handleOnboardingSkip = () => {
    StorageService.saveItem(StorageService.KEYS.ONBOARDING_DONE, true);
    navigateTo('Blinkit_Home');
  };

  // Auto-sync User Profile changes to storage
  useEffect(() => {
    if (user && (user.email || user.phoneNumber)) {
      StorageService.saveItem(StorageService.KEYS.USER, user);
    }
  }, [user]);

  const navigateTo = (screen: ScreenId) => {
    // Automatically redirect legacy C12_Home to modern Blinkit_Home
    const targetScreen = screen === 'C12_Home' ? 'Blinkit_Home' : screen;
    setActiveScreenState(targetScreen);
    // Never persist navigation route to storage so reloads always reset to Home
    setHistory((prev) => {
      if (TAB_SCREENS.includes(targetScreen)) {
        return [targetScreen];
      }
      if (prev[prev.length - 1] === targetScreen) {
        return prev;
      }
      return [...prev, targetScreen];
    });
  };

  const goBack = () => {
    if (activeScreen === 'Blinkit_Home' || activeScreen === 'C12_Home') {
      return;
    }

    if (ONBOARDING_PREVIOUS[activeScreen]) {
      const prev = ONBOARDING_PREVIOUS[activeScreen];
      setActiveScreenState(prev);
      setHistory((h) => h.slice(0, -1));
      return;
    }

    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const prevScreen = newHistory[newHistory.length - 1];
      const safeTarget =
        prevScreen === 'C01_Splash' ? 'Blinkit_Home' : prevScreen || 'Blinkit_Home';
      setActiveScreenState(safeTarget);
      setHistory(newHistory.filter((s) => s !== 'C01_Splash'));
    } else {
      setActiveScreenState('Blinkit_Home');
      setHistory(['Blinkit_Home']);
    }
  };

  const canGoBack =
    activeScreen !== 'Blinkit_Home' &&
    activeScreen !== 'C01_Splash' &&
    activeScreen !== 'C02_Onboarding1' &&
    activeScreen !== 'C12_Home';

  // Live cart state with instant local persistence hydration
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(StorageService.KEYS.CART);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  });
  const isCartHydratedRef = useRef(false);
  const [appliedCoins, setAppliedCoins] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product>(DEFAULT_FALLBACK_PRODUCT);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cooking');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('Cooking Essentials');

  const navigateToProductListing = (title: string, categoryIds: string[]) => {
    setSelectedCategoryName(title);
    setSelectedCategoryIds(categoryIds);
    setSelectedCategoryId(categoryIds[0] || '');
    navigateTo('C15_ProductListing');
  };
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterSortState>(DEFAULT_FILTERS);
  const [isJumperVisible, setJumperVisible] = useState<boolean>(false);

  // Wishlist state (user-specific, persisted)
  const [wishlist, setWishlist] = useState<BlinkitProduct[]>([]);

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some((item) => item.id === productId);
  };

  const toggleWishlist = (product: BlinkitProduct) => {
    if (!isAuthenticated) {
      openAuthPrompt(
        'Please login or register to save items to your wishlist.',
        'Wishlist'
      );
      return;
    }
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      const updated = exists ? prev.filter((item) => item.id !== product.id) : [product, ...prev];
      StorageService.saveItem(StorageService.KEYS.WISHLIST, updated);
      return updated;
    });

    // Cross-platform sync to MongoDB backend
    api.post('/wishlist/toggle', { productId: product.id }).catch((e) => {
      console.warn('[AppContext] toggleWishlist backend warning:', e);
    });
  };

  const clearWishlist = () => {
    setWishlist([]);
    StorageService.removeItem(StorageService.KEYS.WISHLIST);
    api.delete('/wishlist').catch(() => {});
  };

  // Synchronize local cart state directly from server cart summary (re-prices items per area)
  const syncCartFromSummary = useCallback((cartSummary: any) => {
    if (!cartSummary) return;

    // Sync applied coins / useCoins preference authoritative from backend
    if (typeof cartSummary.useCoins === 'boolean') {
      const coins = cartSummary.useCoins ? (cartSummary.coinsUsed ?? cartSummary.appliedCoins ?? 0) : 0;
      setAppliedCoins(coins);
    } else if (typeof cartSummary.coinsUsed === 'number' || typeof cartSummary.appliedCoins === 'number') {
      setAppliedCoins(cartSummary.coinsUsed ?? cartSummary.appliedCoins ?? 0);
    }

    if (Array.isArray(cartSummary.items)) {
      if (cartSummary.items.length === 0) {
        setCart([]);
        setBlinkitCart({});
        StorageService.removeItem(StorageService.KEYS.BLINKIT_CART);
        return;
      }

      const newCart: CartItem[] = cartSummary.items.map((it: any) => {
        const vPrice = it.variant?.price !== undefined
          ? Number(it.variant.price)
          : Number(it.product.sellingPrice ?? (it.subtotal && it.quantity ? it.subtotal / it.quantity : 0));
        const vMrp = it.variant?.mrp !== undefined
          ? Number(it.variant.mrp)
          : Number(it.product.mrp ?? (it.totalMrp && it.quantity ? it.totalMrp / it.quantity : vPrice));
        const vLabel = it.variant?.label || it.product.quantityLabel || '1 unit';
        const resolvedVId = it.variantId || it.variant?.id || it.variant?._id;
        return {
          product: {
            id: it.product.id || it.product._id,
            name: it.product.name,
            brand: it.product.brand || '',
            categoryId: it.product.categoryId || '',
            sellingPrice: vPrice,
            mrp: vMrp,
            discountPercent: vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : (it.product.discountPercent || 0),
            stock: it.variant?.stock ?? it.product.stock ?? 100,
            imageUrl: it.product.imageUrl,
            quantityLabel: vLabel,
            shoppingCoins: 0,
            rating: 4.8,
            reviewCount: 50,
            deliveryMinutes: 9,
            selectedVariantId: resolvedVId,
          } as any,
          quantity: it.quantity,
        };
      });

      setCart(newCart);
      const newBlinkitCart: Record<string, { product: BlinkitProduct; quantity: number }> = {};
      newCart.forEach((ci) => {
        const bp = mapProductToBlinkit(ci.product);
        bp.packSize = ci.product.quantityLabel || '1 unit';
        (bp as any).selectedVariantId = (ci.product as any).selectedVariantId;
        const k = (ci.product as any).selectedVariantId ? `${ci.product.id}_${(ci.product as any).selectedVariantId}` : ci.product.id;
        newBlinkitCart[k] = {
          product: bp,
          quantity: ci.quantity,
        };
      });
      setBlinkitCart(newBlinkitCart);
      StorageService.saveItem(StorageService.KEYS.BLINKIT_CART, newBlinkitCart);
    }
  }, []);

  // Real-time WebSockets synchronization across Web & Mobile App
  const syncSocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const currentUserId = user?.id || (user as any)?._id || 'guest_user';

    const isLocalWeb =
      typeof window !== 'undefined' &&
      (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');

    const wsUrl =
      (process.env.EXPO_PUBLIC_API_URL
        ? process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')
        : isLocalWeb
        ? 'http://localhost:5050'
        : 'https://womup-app-uquz.onrender.com') + '/tracking';

    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    syncSocketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_user', { userId: currentUserId });
    });

    // Real-time Active Location & Store synchronization (Web <-> Mobile App)
    socket.on('location_updated', (payload: any) => {
      if (!payload) return;
      if (payload.areaId && isValidMongoId(payload.areaId) && payload.areaName) {
        setCurrentAreaId(payload.areaId);
        setCurrentAreaName(payload.areaName);
      }
      if (payload.storeId && isValidMongoId(payload.storeId)) {
        setCurrentStoreId(payload.storeId);
        setCurrentStoreName(payload.storeName || null);
      }
      if (payload.city) {
        setCurrentCityName(payload.city);
      }
      if (payload.deliveryMinutes) {
        setDeliveryEtaMinutes(payload.deliveryMinutes);
      }
      if (payload.serviceable !== undefined) {
        setIsServiceable(payload.serviceable);
      }
      if (payload.deliveryLocation || payload.addressString) {
        setDeliveryLocation(payload.deliveryLocation || payload.addressString);
      }
      if (payload.selectedAddress) {
        setSelectedAddress(payload.selectedAddress);
      }
    });

    // Real-time Checkout configuration synchronization (Web <-> Mobile App)
    socket.on('checkout_updated', (payload: any) => {
      if (!payload) return;
      setLiveCheckoutState((prev) => ({
        ...prev,
        ...payload,
      }));
    });

    // Real-time Catalog & Price synchronization from Admin
    socket.on('catalog:updated', (payload: any) => {
      console.log('[AppContext] Real-time catalog update received from Admin:', payload);
      ProductService.clearHomeCache();
      setCatalogVersion((v) => v + 1);
    });

    socket.on('catalog:price-updated', (payload: any) => {
      console.log('[AppContext] Real-time price update received from Admin:', payload);
      ProductService.clearHomeCache();
      setCatalogVersion((v) => v + 1);
    });

    socket.on('inventory_update', (payload: any) => {
      console.log('[AppContext] Real-time inventory update received:', payload);
      ProductService.clearHomeCache();
      setCatalogVersion((v) => v + 1);
    });

    // Real-time Wishlist synchronization
    socket.on('wishlist_updated', (payload: any) => {
      if (!payload) return;
      if (payload.userId && payload.userId !== currentUserId) return;
      const serverItems = payload.wishlist || payload.data || [];
      if (Array.isArray(serverItems)) {
        const mapped: BlinkitProduct[] = serverItems.map((p: any) =>
          mapProductToBlinkit({
            id: p._id ? p._id.toString() : (p.id || ''),
            name: p.name,
            brand: p.brand || 'Farm Fresh',
            categoryId: p.categoryId || 'Groceries',
            sellingPrice: p.sellingPrice || p.price || 0,
            mrp: p.mrp || p.sellingPrice || p.price || 0,
            discountPercent: p.discountPercent || 0,
            shoppingCoins: p.shoppingCoins || 0,
            rating: p.rating || 4.8,
            reviewCount: p.reviewCount || 40,
            stock: p.stock || 100,
            deliveryMinutes: 9,
            imageUrl: p.imageUrl || p.image || '',
            quantityLabel: p.quantityLabel || '1 unit',
          } as any)
        );
        setWishlist(mapped);
        StorageService.saveItem(StorageService.KEYS.WISHLIST, mapped);
      }
    });

    // Real-time Cart synchronization
    socket.on('cart_updated', (payload: any) => {
      if (!payload) return;
      if (payload.userId && payload.userId !== currentUserId) return;
      syncCartFromSummary(payload.cart);
    });

    // Real-time Orders synchronization (When order placed from Website or Mobile)
    const handleOrderCreated = (payload: any) => {
      if (!payload) return;
      if (payload.userId && payload.userId !== currentUserId) return;
      const raw = payload.order || payload;
      if (raw && (raw._id || raw.id || raw.orderNumber)) {
        const livePartner = raw.deliveryPartner || raw.deliveryPartnerId;
        const mappedOrder: Order = {
          id: raw._id || raw.id || `ord_${Date.now()}`,
          _id: raw._id,
          orderNumber: raw.orderNumber || `#WUP-${Date.now().toString().slice(-6)}`,
          date: 'Just now',
          status: raw.status || 'PLACED',
          itemCount: raw.items?.length || 0,
          items: (raw.items || []).map((it: any) => ({
            productId: it.productId?._id || it.productId || '',
            name: it.name || it.title || 'Item',
            quantity: it.quantity || 1,
            price: it.price || 0,
            image: it.image || it.imageUrl,
            imageUrl: it.imageUrl || it.image,
          })),
          subtotal: raw.itemSubtotal || raw.pricing?.subtotal || raw.subtotal || 0,
          discount: raw.discount || raw.pricing?.discount || 0,
          couponDiscount: raw.couponDiscount || 0,
          shoppingCoinsUsed: raw.coinsUsed || raw.pricing?.coinsUsed || raw.shoppingCoinsUsed || 0,
          coinsDiscount: raw.coinsDiscount || raw.pricing?.coinsUsed || 0,
          deliveryFee: raw.deliveryFee || raw.pricing?.deliveryFee || 0,
          handlingFee: raw.handlingFee || 5,
          tip: raw.tip || 0,
          totalAmount: raw.totalAmount || raw.pricing?.total || 0,
          deliveryAddress: raw.deliveryAddress || selectedAddress,
          deliverySlot: raw.deliverySlot || 'Today, within 9 minutes',
          paymentMethod: raw.paymentMethod || 'COD',
          estimatedArrival: raw.estimatedArrival || '9 min',
          deliveryOtp: raw.deliveryOtp || '4821',
          deliveryPartner: livePartner && livePartner.fullName ? {
            name: livePartner.fullName || livePartner.name,
            phone: livePartner.phoneNumber || livePartner.phone,
            vehicleNumber: livePartner.vehicleNumber,
          } : undefined,
        };
        setOrders((prev) => [mappedOrder, ...(prev || []).filter((o) => o.id !== mappedOrder.id && o.orderNumber !== mappedOrder.orderNumber)]);
        setCurrentOrder(mappedOrder);
        StorageService.saveItem(StorageService.KEYS.ORDERS, [mappedOrder, ...(orders || []).filter((o) => o.id !== mappedOrder.id)]);
        // Instantly clear local cart when order is placed anywhere
        setCart([]);
        setBlinkitCart({});
        StorageService.removeItem(StorageService.KEYS.BLINKIT_CART);
      }
      OrderService.fetchOrders().then((latest) => {
        if (latest && latest.length > 0) setOrders(latest);
      });
    };

    socket.on('order_created', handleOrderCreated);
    socket.on('order_placed', handleOrderCreated);

    // Real-time Order Status updates (Store accept, Rider out for delivery, Delivered, Cancelled)
    const handleOrderStatus = (payload: any) => {
      if (!payload) return;
      const targetId = payload.orderId?.toString();
      const targetNum = payload.orderNumber?.toString();
      const newStatus = payload.status;
      if (!newStatus) return;

      setOrders((prev) => {
        const updated = (prev || []).map((o) => {
          if ((targetId && (o.id === targetId || o._id === targetId)) || (targetNum && o.orderNumber === targetNum)) {
            return { ...o, status: newStatus as any };
          }
          return o;
        });
        StorageService.saveItem(StorageService.KEYS.ORDERS, updated);
        return updated;
      });

      setCurrentOrder((prev) => {
        if (!prev) return null;
        if ((targetId && (prev.id === targetId || prev._id === targetId)) || (targetNum && prev.orderNumber === targetNum)) {
          return { ...prev, status: newStatus as any };
        }
        return prev;
      });
    };

    socket.on('order_status_updated', handleOrderStatus);
    socket.on('order_status', handleOrderStatus);

    // Real-time Shopping Coins & Wallet updates
    const handleWalletUpdated = (payload: any) => {
      if (!payload) return;
      if (payload.userId && payload.userId !== currentUserId) return;
      if (typeof payload.shoppingCoins === 'number') {
        setUser((prev) => {
          const upd = { ...prev, shoppingCoins: payload.shoppingCoins };
          StorageService.saveItem(StorageService.KEYS.USER, upd);
          return upd;
        });
      }
      if (typeof payload.walletBalance === 'number') {
        setWalletBalance(payload.walletBalance);
      }
    };

    socket.on('wallet_updated', handleWalletUpdated);
    socket.on('coins_updated', handleWalletUpdated);

    // Reconnection State Sync
    socket.on('reconnect', () => {
      socket.emit('join_user', { userId: currentUserId });
      OrderService.fetchOrders().then((latest) => {
        if (latest && latest.length > 0) setOrders(latest);
      });
      CartService.getServerCart(currentAreaId || undefined, currentStoreId || undefined).then((serverCart) => {
        if (serverCart) {
          if (typeof serverCart.useCoins === 'boolean') {
            const coins = serverCart.useCoins ? (serverCart.coinsUsed ?? serverCart.appliedCoins ?? 0) : 0;
            setAppliedCoins(coins);
          } else if (typeof serverCart.coinsUsed === 'number' || typeof serverCart.appliedCoins === 'number') {
            setAppliedCoins(serverCart.coinsUsed ?? serverCart.appliedCoins ?? 0);
          }
        }
        if (serverCart && Array.isArray(serverCart.items)) {
          const newCart: CartItem[] = serverCart.items.map((it: any) => {
            const vPrice = it.variant?.price !== undefined
              ? Number(it.variant.price)
              : Number(it.product.sellingPrice ?? (it.subtotal && it.quantity ? it.subtotal / it.quantity : 0));
            const vMrp = it.variant?.mrp !== undefined
              ? Number(it.variant.mrp)
              : Number(it.product.mrp ?? (it.totalMrp && it.quantity ? it.totalMrp / it.quantity : vPrice));
            const vLabel = it.variant?.label || it.product.quantityLabel || '1 unit';
            return {
              product: {
                id: it.product.id || it.product._id,
                name: it.product.name,
                brand: it.product.brand || '',
                categoryId: it.product.categoryId || '',
                sellingPrice: vPrice,
                mrp: vMrp,
                discountPercent: vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : (it.product.discountPercent || 0),
                stock: it.variant?.stock ?? it.product.stock ?? 100,
                imageUrl: it.product.imageUrl,
                quantityLabel: vLabel,
                shoppingCoins: 0,
                rating: 4.8,
                reviewCount: 50,
                deliveryMinutes: 9,
              } as any,
              quantity: it.quantity,
            };
          });
          setCart(newCart);
          const newBlinkitCart: Record<string, { product: BlinkitProduct; quantity: number }> = {};
          newCart.forEach((ci) => {
            const bp = mapProductToBlinkit(ci.product);
            bp.packSize = ci.product.quantityLabel || '1 unit';
            (bp as any).selectedVariantId = (ci.product as any).selectedVariantId;
            const k = (ci.product as any).selectedVariantId ? `${ci.product.id}_${(ci.product as any).selectedVariantId}` : ci.product.id;
            newBlinkitCart[k] = {
              product: bp,
              quantity: ci.quantity,
            };
          });
          setBlinkitCart(newBlinkitCart);
          StorageService.saveItem(StorageService.KEYS.BLINKIT_CART, newBlinkitCart);
        }
      });
    });

    // Real-time Settings synchronization (Privacy, Notifications, Sensitive items)
    socket.on('settings_updated', (payload: any) => {
      if (!payload) return;
      const s = payload.settings || payload;
      if (s.hideSensitiveItems !== undefined) {
        setHideSensitiveItems(!!s.hideSensitiveItems);
      }
    });

    // Real-time Wallet balance synchronization
    socket.on('wallet_updated', (payload: any) => {
      if (!payload) return;
      if (typeof payload.walletBalance === 'number') {
        setWalletBalance(payload.walletBalance);
      }
      if (typeof payload.shoppingCoins === 'number') {
        setUser((prev) => ({ ...prev, shoppingCoins: payload.shoppingCoins }));
      }
    });

    // Real-time Gift Card redeemed
    socket.on('gift_card_redeemed', (payload: any) => {
      if (!payload) return;
      if (typeof payload.newWalletBalance === 'number') {
        setWalletBalance(payload.newWalletBalance);
      }
    });

    // Real-time Lucky Scratch Result
    socket.on('scratch_result', (payload: any) => {
      if (!payload) return;
      if (typeof payload.newTotal === 'number') {
        setUser((prev) => ({ ...prev, shoppingCoins: payload.newTotal }));
      }
    });

    // Real-time Profile updated
    socket.on('profile_updated', (payload: any) => {
      if (!payload) return;
      setUser((prev) => ({
        ...prev,
        ...(payload.birthday ? { birthday: payload.birthday } : {}),
        ...(typeof payload.shoppingCoins === 'number' ? { shoppingCoins: payload.shoppingCoins } : {}),
      }));
    });

    return () => {
      socket.emit('leave_user', { userId: currentUserId });
      socket.disconnect();
      syncSocketRef.current = null;
    };
  }, [user?.id, (user as any)?._id]);

  const logout = async () => {
    await AuthService.logout();
    await StorageService.removeItem(StorageService.KEYS.ACTIVE_SCREEN);
    await StorageService.removeItem(StorageService.KEYS.USER);
    await StorageService.removeItem(StorageService.KEYS.ORDERS);
    await StorageService.removeItem(StorageService.KEYS.BLINKIT_CART);
    await StorageService.removeItem(StorageService.KEYS.WISHLIST);
    setUser(INITIAL_USER);
    setSelectedAddress(INITIAL_ADDRESS);
    setBlinkitCart({});
    setCart([]);
    setOrders([]);
    setCurrentOrder(null);
    setWalletBalance(0);
    setWishlist([]);
    setAuthVerificationId(null);
    setActiveScreenState('C06_MobileNumber');
  };

  // Restore stored state on mount & fetch live API resources
  useEffect(() => {
    (async () => {
      // 1. Saved Token & User Profile
      try {
        const token = await StorageService.getItem<string | null>(
          StorageService.KEYS.AUTH_TOKEN,
          null
        );
        const savedUser = await StorageService.getItem<UserProfile | null>(
          StorageService.KEYS.USER,
          null
        );
        if (savedUser) setUser(savedUser);

        const savedVerificationId = await StorageService.getItem<string | null>(
          StorageService.KEYS.AUTH_VERIFICATION_ID,
          null
        );
        if (savedVerificationId) setAuthVerificationId(savedVerificationId);

        if (token) {
          api.setToken(token);
          let isTokenValid = false;
          try {
            const profile = await AuthService.getProfile();
            if (profile && (profile.email || profile.phoneNumber || profile.fullName)) {
              // Live database user profile
              setUser(profile);
              StorageService.saveItem(StorageService.KEYS.USER, profile);
              isTokenValid = true;
            } else {
              // Token was invalid or expired (401)
              api.setToken(null);
              await StorageService.removeItem(StorageService.KEYS.AUTH_TOKEN);
              await StorageService.removeItem(StorageService.KEYS.REFRESH_TOKEN);
            }
          } catch (e) {
            console.warn('Profile fetch error on init:', e);
            api.setToken(null);
          }

          if (isTokenValid) {

            // Fetch Live Addresses for Authenticated User from MongoDB
            try {
              const liveAddresses = await AddressService.getAddresses();
              if (liveAddresses && liveAddresses.length > 0) {
                setUser((prev) => ({ ...prev, savedAddresses: liveAddresses }));
                const defaultAddr = liveAddresses.find((a) => a.isDefault) || liveAddresses[0];
                setSelectedAddress(defaultAddr);
                setDeliveryLocation(`${defaultAddr.type} — ${defaultAddr.houseFlat}, ${defaultAddr.city}`);
              }
            } catch (e) {
              console.warn('Error fetching live addresses:', e);
            }

            // Fetch Live Orders for Authenticated User from MongoDB
            try {
              const liveOrders = await OrderService.fetchOrders();
              if (liveOrders && liveOrders.length > 0) {
                setOrders(liveOrders);
                setCurrentOrder(liveOrders[0]);
                StorageService.saveItem(StorageService.KEYS.ORDERS, liveOrders);
              } else {
                const saved = await StorageService.getItem<Order[] | null>(StorageService.KEYS.ORDERS, null);
                if (saved && saved.length > 0) {
                  setOrders(saved);
                  setCurrentOrder(saved[0]);
                }
              }
            } catch (e) {
              console.warn('Error fetching live orders from backend:', e);
            }

            // Fetch Live Wallet Balance for Authenticated User from MongoDB
            try {
              const walletRes = await api.get<{ balance: number }>('/wallet');
              if (walletRes.success && walletRes.data) {
                setWalletBalance(walletRes.data.balance || 0);
              }
            } catch (e) {}

            // Fetch Live Wishlist for Authenticated User from MongoDB
            try {
              const wishlistRes = await api.get<any>('/wishlist');
              if (wishlistRes.success && Array.isArray(wishlistRes.data)) {
                const mapped: BlinkitProduct[] = wishlistRes.data.map((p: any) =>
                  mapProductToBlinkit({
                    id: p._id ? p._id.toString() : (p.id || ''),
                    name: p.name,
                    brand: p.brand || 'Farm Fresh',
                    categoryId: p.categoryId || 'Groceries',
                    sellingPrice: p.sellingPrice || p.price || 0,
                    mrp: p.mrp || p.sellingPrice || p.price || 0,
                    discountPercent: p.discountPercent || 0,
                    shoppingCoins: p.shoppingCoins || 0,
                    rating: p.rating || 4.8,
                    reviewCount: p.reviewCount || 40,
                    stock: p.stock || 100,
                    deliveryMinutes: 9,
                    imageUrl: p.imageUrl || p.image || '',
                    quantityLabel: p.quantityLabel || '1 unit',
                  } as any)
                );
                setWishlist(mapped);
                StorageService.saveItem(StorageService.KEYS.WISHLIST, mapped);
              }
            } catch (e) {
              console.warn('[AppContext] Live wishlist fetch notice:', e);
            }
          }
        }

        // Clear any persisted active screen to ensure reloads always open Home
        await StorageService.removeItem(StorageService.KEYS.ACTIVE_SCREEN);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          try {
            window.history.replaceState(null, '', '/');
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Session restoration error:', e);
      }

      // 2. Saved Cart & Blinkit Cart with Bidirectional Hydration & Server Sync
      try {
        const [savedCart, savedBlinkitCart] = await Promise.all([
          StorageService.getItem<CartItem[] | null>(StorageService.KEYS.CART, null),
          StorageService.getItem<Record<string, BlinkitCartEntry> | null>(
            StorageService.KEYS.BLINKIT_CART,
            null
          ),
        ]);

        const mergedBlinkit: Record<string, BlinkitCartEntry> = {};
        const mergedCart: CartItem[] = [];

        if (savedBlinkitCart && Object.keys(savedBlinkitCart).length > 0) {
          Object.entries(savedBlinkitCart).forEach(([pid, entry]) => {
            if (entry && entry.quantity > 0) {
              mergedBlinkit[pid] = entry;
              mergedCart.push({
                product: mapBlinkitToProduct(entry.product),
                quantity: entry.quantity,
              });
            }
          });
        }

        if (savedCart && savedCart.length > 0) {
          savedCart.forEach((item) => {
            if (item?.product?.id) {
              if (!mergedBlinkit[item.product.id]) {
                mergedBlinkit[item.product.id] = {
                  product: mapProductToBlinkit(item.product),
                  quantity: item.quantity,
                };
                mergedCart.push(item);
              }
            }
          });
        }

        // 3. If authenticated, sync authoritative Cart from backend MongoDB
        const token = await StorageService.getItem<string | null>(StorageService.KEYS.AUTH_TOKEN, null);
        if (token) {
          try {
            const serverCart = await CartService.getServerCart(currentAreaId || undefined, currentStoreId || undefined);
            if (serverCart && Array.isArray(serverCart.items) && serverCart.items.length > 0) {
              serverCart.items.forEach((item: any) => {
                const prod = item.product || {};
                const pId = (prod.id || prod._id || item.productId || '').toString();
                if (pId) {
                  const qty = Number(item.quantity || 1);
                  const vPrice = item.variant?.price !== undefined
                    ? Number(item.variant.price)
                    : Number(prod.sellingPrice ?? (item.subtotal && qty ? item.subtotal / qty : 0));
                  const vMrp = item.variant?.mrp !== undefined
                    ? Number(item.variant.mrp)
                    : Number(prod.mrp ?? (item.totalMrp && qty ? item.totalMrp / qty : vPrice));
                  const vLabel = item.variant?.label || item.variant?.weightOrVolume || prod.quantityLabel || '1 unit';
                  const resolvedVId = item.variantId || item.variant?.id || item.variant?._id;
                  const bp = mapProductToBlinkit({
                    ...prod,
                    sellingPrice: vPrice,
                    mrp: vMrp,
                    quantityLabel: vLabel,
                  });
                  bp.packSize = vLabel;
                  (bp as any).selectedVariantId = resolvedVId;
                  const cartKey = resolvedVId ? `${pId}_${resolvedVId}` : pId;
                  mergedBlinkit[cartKey] = {
                    product: bp,
                    quantity: qty,
                  };
                  if (resolvedVId && mergedBlinkit[pId]) {
                    delete mergedBlinkit[pId];
                  }
                  const exIdx = mergedCart.findIndex(
                    (i) => i.product.id === pId && ((i.product as any).selectedVariantId === resolvedVId || !resolvedVId)
                  );
                  if (exIdx >= 0) {
                    mergedCart[exIdx].quantity = qty;
                    mergedCart[exIdx].product.sellingPrice = vPrice;
                    mergedCart[exIdx].product.mrp = vMrp;
                  } else {
                    mergedCart.push({
                      product: mapBlinkitToProduct(bp),
                      quantity: qty,
                    });
                  }
                }
              });
            }
          } catch (e) {
            console.warn('[AppContext] Notice syncing server cart on bootstrap:', e);
          }
        }

        if (mergedCart.length > 0) {
          setCart(mergedCart);
          setBlinkitCart(mergedBlinkit);
        }
      } catch (e) {
        console.warn('Cart restoration error:', e);
      } finally {
        isCartHydratedRef.current = true;
      }

      // Saved Wishlist
      try {
        const savedWishlist = await StorageService.getItem<BlinkitProduct[] | null>(
          StorageService.KEYS.WISHLIST,
          null
        );
        if (savedWishlist && savedWishlist.length > 0) {
          setWishlist(savedWishlist);
        }
      } catch (e) {}

      // Saved Orders fallback
      try {
        const savedOrders = await StorageService.getItem<Order[] | null>(
          StorageService.KEYS.ORDERS,
          null
        );
        if (savedOrders && savedOrders.length > 0) {
          setOrders((prev) => (prev && prev.length > 0 ? prev : savedOrders));
          setCurrentOrder((prev) => prev || savedOrders[0]);
        }
      } catch (e) {}

      // 3. Resolve Real Delivery Area & Dark Store from GPS / Saved Address
      try {
        const cached = await StorageService.getItem<{ area: any; ts: number } | null>(
          '@wormup_resolved_area',
          null
        );
        if (cached?.ts && Date.now() - cached.ts > 5 * 60 * 1000) {
          LocationService.clearCache();
        }
      } catch (_) {}

      // 3a. Restore saved address from previous session
      let initialLat: number | undefined = undefined;
      let initialLng: number | undefined = undefined;
      let hasRestoredSavedAddress = false;

      try {
        const savedAddress = await StorageService.getItem<any>(
          StorageService.KEYS.SELECTED_ADDRESS,
          null
        );
        if (savedAddress && (savedAddress.latitude || savedAddress.houseFlat)) {
          const isGps = savedAddress._selectedSource === 'GPS' || savedAddress.type === 'Current';
          const addrId = savedAddress._selectedAddressId || savedAddress.id || savedAddress._id || null;
          setSelectedAddressState(savedAddress);
          setSelectedAddressId(addrId);
          setSelectedAddressSource(isGps ? 'GPS' : 'SAVED');

          const shortLabel = savedAddress.houseFlat || savedAddress.areaLandmark || savedAddress.city;
          setDeliveryLocation(isGps ? `Current Location — ${shortLabel}` : `${savedAddress.type || 'Home'} — ${shortLabel}`);
          if (savedAddress.latitude && savedAddress.longitude) {
            initialLat = Number(savedAddress.latitude);
            initialLng = Number(savedAddress.longitude);
          }
          hasRestoredSavedAddress = true;
        }
      } catch (e) {
        console.warn('Error restoring saved address:', e);
      }

      // 3b. Auto-detect real-time device GPS immediately on boot ONLY IF NO SAVED ADDRESS WAS RESTORED
      if (!hasRestoredSavedAddress) {
        try {
          const detected = await LocationService.getCurrentLocation();
          if (detected) {
            initialLat = detected.latitude;
            initialLng = detected.longitude;
            const shortLabel = detected.shortAddress || detected.readableAddress;
            setDeliveryLocation(`Current Location — ${shortLabel}`);
            const addressObj: Address = {
              id: `current_${Date.now()}`,
              type: 'Current' as const,
              fullName: user?.fullName || 'Customer',
              phoneNumber: user?.phoneNumber || '',
              houseFlat: detected.street || 'Current GPS Location',
              areaLandmark: detected.areaLandmark || detected.shortAddress,
              city: detected.city || 'Ahmedabad',
              pincode: detected.pincode || '380015',
              latitude: detected.latitude,
              longitude: detected.longitude,
              isDefault: true,
            };
            setSelectedAddressState(addressObj);
            setSelectedAddressId(addressObj.id);
            setSelectedAddressSource('GPS');
            StorageService.saveItem(StorageService.KEYS.SELECTED_ADDRESS, {
              ...addressObj,
              _selectedAddressId: addressObj.id,
              _selectedSource: 'GPS',
            });
            hasRestoredSavedAddress = true;
          }
        } catch (err) {
          // non-fatal: GPS permission not yet granted on boot
        }
      }

      // 3c. Listen for browser geolocation permission changes (only switch if no saved address was active)
      if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
        try {
          (navigator as any).permissions.query({ name: 'geolocation' }).then((status: any) => {
            status.onchange = async () => {
              if (status.state === 'granted' && !hasRestoredSavedAddress && selectedAddressSource !== 'SAVED') {
                try {
                  const loc = await LocationService.getCurrentLocation();
                  if (loc) {
                    const shortLabel = loc.shortAddress || loc.readableAddress;
                    setDeliveryLocation(`Current Location — ${shortLabel}`);
                    const addrObj: Address = {
                      id: `current_${Date.now()}`,
                      type: 'Current' as const,
                      fullName: 'Customer',
                      phoneNumber: '',
                      houseFlat: loc.street || 'Current GPS Location',
                      areaLandmark: loc.areaLandmark || loc.shortAddress,
                      city: loc.city || 'Ahmedabad',
                      pincode: loc.pincode || '380015',
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                      isDefault: true,
                    };
                    setSelectedAddressState(addrObj);
                    setSelectedAddressId(addrObj.id);
                    setSelectedAddressSource('GPS');
                    StorageService.saveItem(StorageService.KEYS.SELECTED_ADDRESS, {
                      ...addrObj,
                      _selectedAddressId: addrObj.id,
                      _selectedSource: 'GPS',
                    });
                    const area = await LocationService.resolveArea(loc.latitude, loc.longitude, true);
                    if (area) {
                      setCurrentAreaId(area.areaId);
                      setCurrentAreaName(area.areaName);
                      setCurrentCityName(area.city || user.preferredCityName || 'Ahmedabad');
                      setCurrentStoreId(area.storeId || null);
                      setCurrentStoreName(area.storeName || null);
                      setIsServiceable(area.serviceable === true);
                      setDeliveryEtaMinutes(area.deliveryMinutes || 9);
                    }
                  }
                } catch (_) {}
              }
            };
          }).catch(() => {});
        } catch (_) {}
      }

      let initialAreaId: string | undefined = undefined;
      let initialStoreId: string | undefined = undefined;

      if (initialLat && initialLng) {
        try {
          const areaRes = await LocationService.resolveArea(initialLat, initialLng, true);
          if (areaRes) {
            setCurrentAreaId(areaRes.areaId);
            setCurrentAreaName(areaRes.areaName);
            setCurrentCityName(areaRes.city || user.preferredCityName || 'Ahmedabad');
            setCurrentStoreId(areaRes.storeId || null);
            setCurrentStoreName(areaRes.storeName || null);
            setIsServiceable(areaRes.serviceable === true);
            setDeliveryEtaMinutes(areaRes.deliveryMinutes || 9);
            initialAreaId = areaRes.areaId;
            initialStoreId = areaRes.storeId;
          }
        } catch (e) {
          console.warn('Error resolving initial delivery area & dark store:', e);
        }
      }

      try {
        const liveProducts = await ProductService.fetchProducts({
          areaId: initialAreaId,
          storeId: initialStoreId,
        });
        if (liveProducts && liveProducts.length > 0) {
          setSelectedProduct(liveProducts[0]);
          setSelectedBlinkitProduct(mapProductToBlinkit(liveProducts[0]));
        }
      } catch (e) {
        console.warn('Error fetching live products from backend:', e);
      }

      // 4. Fetch Live Categories from MongoDB Atlas
      try {
        const liveCats = await ProductService.fetchCategories();
        if (liveCats && liveCats.length > 0) {
          setSelectedCategoryId(liveCats[0].id);
          setSelectedCategoryName(liveCats[0].name);
        }
      } catch (e) {
        console.warn('Error fetching live categories from backend:', e);
      }
    })();
  }, []);



  // When currentAreaId or currentStoreId or currentAreaName updates, re-fetch products with store-specific stock and area prices
  useEffect(() => {
    if (currentAreaId || currentStoreId || currentAreaName) {
      ProductService.fetchProducts({
        areaId: currentAreaId || undefined,
        storeId: currentStoreId || undefined,
      }).then((liveProducts) => {
        if (liveProducts && liveProducts.length > 0) {
          setSelectedProduct(liveProducts[0]);
          setSelectedBlinkitProduct(mapProductToBlinkit(liveProducts[0]));

          // Dynamically sync blinkitCart prices with newly resolved store catalog (e.g. ₹7 vs ₹12)
          setBlinkitCart((prev) => {
            const updated = { ...prev };
            let hasChanged = false;
            Object.keys(updated).forEach((cartKey) => {
              const item = updated[cartKey];
              const rawProdId = item.product.id;
              const matched = liveProducts.find(
                (p) =>
                  p.id === rawProdId ||
                  (p as any)._id === rawProdId ||
                  p.name.toLowerCase().trim() === item.product.name.toLowerCase().trim()
              );

              let targetPrice = matched ? matched.sellingPrice : item.product.sellingPrice;
              let targetMrp = matched ? matched.mrp : item.product.mrp;
              let targetStock = matched ? (matched.stock ?? item.product.stock) : item.product.stock;

              // Check if item has a specific variant (e.g. 250 g variant of Tomato with dynamic area price)
              if (matched?.variants && matched.variants.length > 0) {
                const matchedVariant = matched.variants.find((v: any) =>
                  (v.id && (item.product as any).selectedVariantId === v.id) ||
                  (v.label && item.product.packSize && v.label.toLowerCase().trim() === item.product.packSize.toLowerCase().trim()) ||
                  (v.weightOrVolume && item.product.packSize && v.weightOrVolume.toLowerCase().trim() === item.product.packSize.toLowerCase().trim()) ||
                  (v.label && (item.product as any).quantityLabel && v.label.toLowerCase().trim() === (item.product as any).quantityLabel.toLowerCase().trim())
                );
                if (matchedVariant) {
                  targetPrice = matchedVariant.price ?? targetPrice;
                  targetMrp = matchedVariant.mrp ?? targetMrp;
                  targetStock = matchedVariant.stock ?? targetStock;
                }
              }

              if (item.product.sellingPrice !== targetPrice || item.product.mrp !== targetMrp) {
                hasChanged = true;
                updated[cartKey] = {
                  ...item,
                  product: {
                    ...item.product,
                    sellingPrice: targetPrice,
                    mrp: targetMrp,
                    stock: targetStock,
                  },
                };
              }
            });
            if (hasChanged) {
              StorageService.saveItem(StorageService.KEYS.BLINKIT_CART, updated);
              return updated;
            }
            return prev;
          });

          // Also pull authoritative server cart with resolved area and store
          CartService.getServerCart(currentAreaId || undefined, currentStoreId || undefined).then((serverCart) => {
            if (serverCart && Array.isArray(serverCart.items) && serverCart.items.length > 0) {
              const newCart: CartItem[] = serverCart.items.map((it: any) => {
                const vPrice = it.variant?.price !== undefined
                  ? Number(it.variant.price)
                  : Number(it.product.sellingPrice ?? (it.subtotal && it.quantity ? it.subtotal / it.quantity : 0));
                const vMrp = it.variant?.mrp !== undefined
                  ? Number(it.variant.mrp)
                  : Number(it.product.mrp ?? (it.totalMrp && it.quantity ? it.totalMrp / it.quantity : vPrice));
                const vLabel = it.variant?.label || it.variant?.weightOrVolume || it.product.quantityLabel || '1 unit';
                const resolvedVId = it.variantId || it.variant?.id || it.variant?._id;
                return {
                  product: {
                    id: it.product.id || it.product._id,
                    name: it.product.name,
                    brand: it.product.brand || '',
                    categoryId: it.product.categoryId || '',
                    sellingPrice: vPrice,
                    mrp: vMrp,
                    discountPercent: vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : (it.product.discountPercent || 0),
                    stock: it.variant?.stock ?? it.product.stock ?? 100,
                    imageUrl: it.product.imageUrl,
                    quantityLabel: vLabel,
                    shoppingCoins: 0,
                    rating: 4.8,
                    reviewCount: 50,
                    deliveryMinutes: 9,
                    selectedVariantId: resolvedVId,
                  } as any,
                  quantity: it.quantity,
                };
              });
              setCart(newCart);
              const newBlinkitCart: Record<string, { product: BlinkitProduct; quantity: number }> = {};
              newCart.forEach((ci) => {
                const bp = mapProductToBlinkit(ci.product);
                bp.packSize = ci.product.quantityLabel || '1 unit';
                (bp as any).selectedVariantId = (ci.product as any).selectedVariantId;
                const k = (ci.product as any).selectedVariantId ? `${ci.product.id}_${(ci.product as any).selectedVariantId}` : ci.product.id;
                newBlinkitCart[k] = {
                  product: bp,
                  quantity: ci.quantity,
                };
              });
              setBlinkitCart(newBlinkitCart);
              StorageService.saveItem(StorageService.KEYS.BLINKIT_CART, newBlinkitCart);
            }
          }).catch(() => {});
        }
      });
    }
  }, [currentAreaId, currentStoreId, currentAreaName, catalogVersion]);

  // Re-reconcile cart whenever user navigates to Cart Screen
  useEffect(() => {
    if (activeScreen === 'Blinkit_Cart' && (currentAreaId || currentStoreId)) {
      CartService.getServerCart(currentAreaId || undefined, currentStoreId || undefined).then((serverCart) => {
        if (serverCart && Array.isArray(serverCart.items) && serverCart.items.length > 0) {
          const newCart: CartItem[] = serverCart.items.map((it: any) => {
            const vPrice = it.variant?.price !== undefined
              ? Number(it.variant.price)
              : Number(it.product.sellingPrice ?? (it.subtotal && it.quantity ? it.subtotal / it.quantity : 0));
            const vMrp = it.variant?.mrp !== undefined
              ? Number(it.variant.mrp)
              : Number(it.product.mrp ?? (it.totalMrp && it.quantity ? it.totalMrp / it.quantity : vPrice));
            const vLabel = it.variant?.label || it.variant?.weightOrVolume || it.product.quantityLabel || '1 unit';
            const resolvedVId = it.variantId || it.variant?.id || it.variant?._id;
            return {
              product: {
                id: it.product.id || it.product._id,
                name: it.product.name,
                brand: it.product.brand || '',
                categoryId: it.product.categoryId || '',
                sellingPrice: vPrice,
                mrp: vMrp,
                discountPercent: vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : (it.product.discountPercent || 0),
                stock: it.variant?.stock ?? it.product.stock ?? 100,
                imageUrl: it.product.imageUrl,
                quantityLabel: vLabel,
                shoppingCoins: 0,
                rating: 4.8,
                reviewCount: 50,
                deliveryMinutes: 9,
                selectedVariantId: resolvedVId,
              } as any,
              quantity: it.quantity,
            };
          });
          setCart(newCart);
          const newBlinkitCart: Record<string, { product: BlinkitProduct; quantity: number }> = {};
          newCart.forEach((ci) => {
            const bp = mapProductToBlinkit(ci.product);
            bp.packSize = ci.product.quantityLabel || '1 unit';
            (bp as any).selectedVariantId = (ci.product as any).selectedVariantId;
            const k = (ci.product as any).selectedVariantId ? `${ci.product.id}_${(ci.product as any).selectedVariantId}` : ci.product.id;
            newBlinkitCart[k] = {
              product: bp,
              quantity: ci.quantity,
            };
          });
          setBlinkitCart(newBlinkitCart);
          StorageService.saveItem(StorageService.KEYS.BLINKIT_CART, newBlinkitCart);
        }
      }).catch(() => {});
    }
  }, [activeScreen, currentAreaId, currentStoreId]);

  // Save cart changes (only after hydration is complete to prevent wiping on refresh)
  useEffect(() => {
    if (!isCartHydratedRef.current) return;
    StorageService.saveItem(StorageService.KEYS.CART, cart);
  }, [cart]);

  // Save Blinkit cart changes (only after hydration is complete to prevent wiping on refresh)
  useEffect(() => {
    if (!isCartHydratedRef.current) return;
    StorageService.saveItem(StorageService.KEYS.BLINKIT_CART, blinkitCart);
  }, [blinkitCart]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSummary = CartService.calculateSummary(cart, appliedCoins, 40);

  const addToCart = (product: Product) => {
    if (!isAuthenticated) {
      openAuthPrompt(
        'Please login or register with your email or mobile to add items to your cart.',
        'Add to Cart'
      );
      return;
    }
    // 1. Update legacy cart
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const next = existing
        ? prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...prev, { product, quantity: 1 }];
      return next;
    });

    // 2. Also synchronize to blinkitCart immediately
    const bp = mapProductToBlinkit(product);
    setBlinkitCart((prev) => {
      const current = prev[product.id]?.quantity || 0;
      return {
        ...prev,
        [product.id]: {
          product: bp,
          quantity: current + 1,
        },
      };
    });

    // 3. Fire-and-forget sync to backend API
    CartService.addItemToServer(product.id, 1).catch(() => {});
  };

  const updateQuantity = (productId: string, delta: number) => {
    let affectedProduct: Product | undefined;

    setCart((prev) => {
      const target = prev.find((item) => item.product.id === productId);
      if (target) affectedProduct = target.product;

      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });

    setBlinkitCart((prev) => {
      const currentEntry = prev[productId];
      const currentQty = currentEntry?.quantity || 0;
      const nextQty = Math.max(0, currentQty + delta);

      const copy = { ...prev };
      if (nextQty <= 0) {
        delete copy[productId];
      } else if (currentEntry) {
        copy[productId] = {
          ...currentEntry,
          quantity: nextQty,
        };
      } else if (affectedProduct) {
        copy[productId] = {
          product: mapProductToBlinkit(affectedProduct),
          quantity: nextQty,
        };
      }
      return copy;
    });

    CartService.updateQuantityOnServer(productId, delta).catch(() => {});
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    setBlinkitCart((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    CartService.removeItemFromServer(productId).catch(() => {});
  };

  const clearCart = () => {
    setCart([]);
    setBlinkitCart({});
    CartService.clearServerCart().catch(() => {});
  };

  const addAddress = (address: Address) => {
    setSelectedAddress(address);
    if (address.type === 'Current') {
      return;
    }
    setUser((prev) => {
      const existingList = prev.savedAddresses || [];
      const isDuplicate = existingList.some((addr) => {
        if (addr.id && address.id && addr.id === address.id) return true;
        if (addr._id && address._id && addr._id === address._id) return true;
        const sameCoords =
          typeof addr.latitude === 'number' &&
          typeof address.latitude === 'number' &&
          typeof addr.longitude === 'number' &&
          typeof address.longitude === 'number' &&
          Math.abs(addr.latitude - address.latitude) < 0.0001 &&
          Math.abs(addr.longitude - address.longitude) < 0.0001;
        const sameText =
          Boolean(addr.houseFlat && address.houseFlat) &&
          addr.houseFlat?.trim().toLowerCase() === address.houseFlat?.trim().toLowerCase() &&
          addr.areaLandmark?.trim().toLowerCase() === address.areaLandmark?.trim().toLowerCase();
        return Boolean(sameCoords || sameText);
      });

      if (isDuplicate) {
        return {
          ...prev,
          savedAddresses: existingList.map((addr) =>
            (addr.id && addr.id === address.id) || (addr._id && addr._id === address._id)
              ? { ...addr, ...address }
              : addr
          ),
        };
      }

      return {
        ...prev,
        savedAddresses: [...existingList, address],
      };
    });
  };

  const placeOrder = async (
    paymentMethod: string,
    options?: { tip?: number; deliveryInstructions?: string; walletDeduction?: number; deliveryFee?: number },
  ): Promise<Order> => {
    const isBlinkit = blinkitCartCount > 0;
    const activeList = isBlinkit ? blinkitCartList : cart;
    const activeCount = isBlinkit ? blinkitCartCount : cartCount;

    const orderItems = activeList.map((i: any) => ({
      productId: i.product.id,
      variantId: (i.product as any).selectedVariantId,
      name: `${i.product.name} ${i.product.quantityLabel || i.product.packSize || ''}`.trim(),
      quantity: i.quantity,
      price: i.product.sellingPrice,
      mrp: i.product.mrp,
      imageUrl: i.product.imageUrl || '',
      quantityLabel: i.product.quantityLabel || i.product.packSize || '1 unit',
    }));

    const initialCoins = user.shoppingCoins;
    const initialWallet = walletBalance;

    // Deduct wallet balance if applied
    if (options?.walletDeduction && options.walletDeduction > 0) {
      setWalletBalance((prev) => Math.max(0, prev - options.walletDeduction!));
    }

    // Deduct coins & optimistic rewards
    setUser((prev) => ({
      ...prev,
      shoppingCoins:
        prev.shoppingCoins -
        (!isBlinkit ? cartSummary.shoppingCoinDiscount : appliedCoins) +
        (!isBlinkit ? cartSummary.totalCoinsEarnable : 10),
    }));

    let liveOrder: Order | null = null;
    try {
      const matchedAddrArea = matchAreaByName(
        selectedAddress.areaLandmark || (selectedAddress as any).area || currentAreaName || deliveryLocation
      );
      const resolvedLat = Number(selectedAddress.latitude) || matchedAddrArea?.lat || 23.0125;
      const resolvedLng = Number(selectedAddress.longitude) || matchedAddrArea?.lng || 72.5082;
      const resolvedAreaName = matchedAddrArea?.name || selectedAddress.areaLandmark || currentAreaName || 'Prahlad Nagar';

      // Authoritative backend creation in MongoDB Atlas
      const res = await OrderService.createOrder({
        addressId: selectedAddress.id?.startsWith('current_') || selectedAddress.id === 'default_addr' ? undefined : selectedAddress.id,
        storeId: currentStoreId || undefined,
        areaId: currentAreaId || undefined,
        paymentMethod,
        items: orderItems,
        tip: options?.tip || 0,
        deliveryFee: typeof options?.deliveryFee === 'number' ? options.deliveryFee : (isBlinkit ? 25 : cartSummary.deliveryFee),
        handlingFee: isBlinkit ? 5 : cartSummary.handlingFee,
        deliveryInstructions: options?.deliveryInstructions || 'Ring bell & leave at door',
        address: {
          houseFlat: selectedAddress.houseFlat || resolvedAreaName,
          areaLandmark: selectedAddress.areaLandmark || resolvedAreaName,
          city: selectedAddress.city || currentCityName || 'Ahmedabad',
          pincode: selectedAddress.pincode || matchedAddrArea?.pincode || '380015',
          latitude: resolvedLat,
          longitude: resolvedLng,
          label: selectedAddress.type || 'Home',
        },
      });

      const anyRes = res as any;
      if (anyRes && anyRes.success === false) {
        throw new Error(anyRes.message || 'Delivery is currently not available in your area');
      }
      const liveData = (anyRes?.success && anyRes?.data) ? anyRes.data : (anyRes?._id || anyRes?.orderNumber) ? anyRes : null;
      if (!liveData) {
        throw new Error(anyRes?.message || 'Failed to create order on server');
      }

      const livePartner = liveData.deliveryPartner || liveData.deliveryPartnerId;
      liveOrder = {
        id: liveData._id || liveData.id || `ord_${Date.now()}`,
        _id: liveData._id,
        orderNumber: liveData.orderNumber || `#WUP-${Date.now().toString().slice(-6)}`,
        date: 'Just now',
        status: liveData.status || 'PLACED',
        itemCount: liveData.items?.length || orderItems.length,
        items: orderItems,
        subtotal: liveData.itemSubtotal || (isBlinkit ? blinkitCartTotal : cartSummary.subtotalSelling),
        discount: liveData.discount ?? (isBlinkit ? Math.max(0, blinkitMrpTotal - blinkitCartTotal) : cartSummary.productDiscount),
        couponDiscount: liveData.couponDiscount ?? (isBlinkit ? couponDiscount : 0),
        shoppingCoinsUsed: liveData.coinsUsed ?? (isBlinkit ? appliedCoins : cartSummary.shoppingCoinDiscount),
        coinsDiscount: liveData.coinsDiscount ?? (isBlinkit ? appliedCoins : cartSummary.shoppingCoinDiscount),
        deliveryFee: liveData.deliveryFee ?? (typeof options?.deliveryFee === 'number' ? options.deliveryFee : (isBlinkit ? 39 : cartSummary.deliveryFee)),
        handlingFee: liveData.handlingFee ?? (isBlinkit ? 5 : cartSummary.handlingFee),
        tip: liveData.tip ?? (options?.tip || 0),
        totalAmount: liveData.totalAmount || (isBlinkit ? Math.max(0, blinkitCartTotal + (typeof options?.deliveryFee === 'number' ? options.deliveryFee : 39) + 5 - couponDiscount - appliedCoins + (options?.tip || 0)) : cartSummary.totalPayable),
        deliveryAddress: selectedAddress,
        deliverySlot: 'Today, within 9 minutes',
        paymentMethod,
        estimatedArrival: '9 min',
        deliveryOtp: liveData.deliveryOtp || '4821',
        deliveryPartner: livePartner && livePartner.fullName ? {
          name: livePartner.fullName || livePartner.name,
          phone: livePartner.phoneNumber || livePartner.phone,
          vehicleNumber: livePartner.vehicleNumber,
        } : undefined,
      };
    } catch (err: any) {
      console.warn('Backend order creation error:', err);
      // Rollback optimistic balances
      if (options?.walletDeduction && options.walletDeduction > 0) {
        setWalletBalance(initialWallet);
      }
      setUser((prev) => ({
        ...prev,
        shoppingCoins: initialCoins,
      }));
      throw err;
    }

    if (!liveOrder) {
      throw new Error('Order could not be verified by backend');
    }

    const orderToSave: Order = liveOrder;

    setOrders((prev) => {
      const updated = [orderToSave, ...prev.filter((o) => o.id !== orderToSave.id && o.orderNumber !== orderToSave.orderNumber)];
      StorageService.saveItem(StorageService.KEYS.ORDERS, updated);
      return updated;
    });
    setCurrentOrder(orderToSave);
    clearCart();
    clearBlinkitCart();
    return orderToSave;
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // --- Blinkit Cart Operations ---
  const blinkitCartList = Object.values(blinkitCart).filter((e) => e.quantity > 0);
  const blinkitCartCount = blinkitCartList.reduce((sum, item) => sum + item.quantity, 0);
  const blinkitCartTotal = blinkitCartList.reduce((sum, item) => {
    const price = typeof item.product.sellingPrice === 'number' ? item.product.sellingPrice : 0;
    return sum + price * item.quantity;
  }, 0);

  const blinkitMrpTotal = blinkitCartList.reduce((sum, item) => {
    const mrp = typeof item.product.mrp === 'number' ? item.product.mrp : (typeof item.product.sellingPrice === 'number' ? item.product.sellingPrice : 0);
    return sum + mrp * item.quantity;
  }, 0);

  const getBlinkitQty = (productId: string, variantId?: string): number => {
    if (variantId) {
      const key = `${productId}_${variantId}`;
      if (blinkitCart[key]?.quantity) {
        return blinkitCart[key].quantity;
      }
      if (
        blinkitCart[productId]?.quantity &&
        (blinkitCart[productId]?.product as any)?.selectedVariantId === variantId
      ) {
        return blinkitCart[productId].quantity;
      }
      return 0;
    }
    let total = 0;
    for (const [k, v] of Object.entries(blinkitCart)) {
      if (k === productId || k.startsWith(`${productId}_`)) {
        total += v.quantity || 0;
      }
    }
    if (total > 0) return total;
    const legacyItem = cart.find((i) => i.product.id === productId);
    return legacyItem?.quantity || 0;
  };

  const updateBlinkitQty = (product: BlinkitProduct, delta: number, variantId?: string) => {
    if (delta > 0 && !isAuthenticated) {
      openAuthPrompt(
        'Please login or register with your email or mobile to add items to your cart.',
        'Add to Cart'
      );
      return;
    }
    const resolvedVariantId =
      variantId ||
      (product as any).selectedVariantId ||
      (product.variants && product.variants.find((v) => v.isDefault)?.id);
    const cartKey = resolvedVariantId ? `${product.id}_${resolvedVariantId}` : product.id;

    const effectiveProd: BlinkitProduct = {
      ...product,
      selectedVariantId: resolvedVariantId,
    };

    // 1. Update blinkitCart
    setBlinkitCart((prev) => {
      let current = 0;
      if (prev[cartKey]?.quantity) {
        current = prev[cartKey].quantity;
      } else if (!resolvedVariantId && prev[product.id]?.quantity) {
        current = prev[product.id].quantity;
      } else if (
        resolvedVariantId &&
        prev[product.id] &&
        (prev[product.id].product as any)?.selectedVariantId === resolvedVariantId
      ) {
        current = prev[product.id].quantity;
      }

      const nextQty = Math.max(0, current + delta);
      const finalQty = effectiveProd.stock ? Math.min(nextQty, effectiveProd.stock) : nextQty;

      const copy = { ...prev };
      if (finalQty <= 0) {
        delete copy[cartKey];
        if (
          resolvedVariantId &&
          copy[product.id] &&
          (copy[product.id]?.product as any)?.selectedVariantId === resolvedVariantId
        ) {
          delete copy[product.id];
        }
        return copy;
      }

      if (
        resolvedVariantId &&
        copy[product.id] &&
        (copy[product.id]?.product as any)?.selectedVariantId === resolvedVariantId
      ) {
        delete copy[product.id];
      }

      copy[cartKey] = {
        product: effectiveProd,
        quantity: finalQty,
      };
      return copy;
    });

    // 2. Synchronize to legacy cart immediately
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          ((item.product as any).selectedVariantId === resolvedVariantId || !resolvedVariantId)
      );
      let next: CartItem[];
      if (delta > 0) {
        if (existing) {
          next = prev.map((item) =>
            item === existing ? { ...item, quantity: item.quantity + delta } : item
          );
        } else {
          next = [...prev, { product: mapBlinkitToProduct(effectiveProd), quantity: delta }];
        }
      } else {
        next = prev
          .map((item) => {
            if (item === existing) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null);
      }
      return next;
    });

    // 3. Fire-and-forget sync to backend API with variantId and areaId
    CartService.updateQuantityOnServer(
      product.id,
      delta,
      resolvedVariantId,
      currentAreaId || undefined,
      currentStoreId || undefined
    ).catch(() => {});
  };

  const clearBlinkitCart = () => {
    setBlinkitCart({});
    setCart([]);
    CartService.clearServerCart().catch(() => {});
  };

  const addWalletBalance = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    api.post<any>('/wallet/topup', { amount, paymentMethod: 'UPI' }).then((res) => {
      if (res.success && res.data?.balance !== undefined) {
        setWalletBalance(res.data.balance);
      }
    }).catch(() => {});
  };

  const couponDiscount =
    appliedCoupon === 'AUCC30' ? 16 :
    appliedCoupon === 'BLINKIT50' || appliedCoupon === 'WORMUP50' || appliedCoupon === 'WELCOME50' ? 50 :
    appliedCoupon === 'WORM100' || appliedCoupon === 'FIRST100' ? 100 :
    appliedCoupon === 'SAVE20' || appliedCoupon === 'FESTIVE20' ? 20 : 0;

  const applyCoupon = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (
      clean === 'AUCC30' ||
      clean === 'BLINKIT50' ||
      clean === 'WORMUP50' ||
      clean === 'WELCOME50' ||
      clean === 'WORM100' ||
      clean === 'FIRST100' ||
      clean === 'SAVE20' ||
      clean === 'FESTIVE20'
    ) {
      setAppliedCoupon(clean);
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Memoised context value — prevents every useApp() consumer from re-rendering
  // when an unrelated piece of AppProvider state changes.
  const contextValue = useMemo(() => ({
    activeScreen,
    setActiveScreen: navigateTo,
    goBack,
    canGoBack,
    user,
    setUser,
    selectedAddress,
    selectedAddressId,
    selectedAddressSource,
    setSelectedAddress,
    setActiveDeliveryAddress,
    setActiveGpsLocation,
    addAddress,
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSummary,
    syncCartFromSummary,
    appliedCoins,
    setAppliedCoins,
    orders,
    currentOrder,
    setCurrentOrder,
    placeOrder,
    selectedProduct,
    setSelectedProduct,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategoryIds,
    setSelectedCategoryIds,
    selectedCategoryName,
    setSelectedCategoryName,
    navigateToProductListing,
    searchQuery,
    setSearchQuery,
    isVoiceSearchActive,
    setIsVoiceSearchActive,
    filters,
    setFilters,
    resetFilters,
    isJumperVisible,
    setJumperVisible,
    // Blinkit extensions
    walletBalance,
    addWalletBalance,
    hideSensitiveItems,
    setHideSensitiveItems,
    appearance,
    setAppearance,
    deliveryLocation,
    setDeliveryLocation,
    isLocationModalVisible,
    setLocationModalVisible,
    isDistrictModalVisible,
    setDistrictModalVisible,
    blinkitCart,
    blinkitCartList,
    blinkitCartCount,
    blinkitCartTotal,
    blinkitMrpTotal,
    updateBlinkitQty,
    getBlinkitQty,
    clearBlinkitCart,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    selectedBlinkitProduct,
    setSelectedBlinkitProduct,
    wishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    currentAreaId,
    currentAreaName,
    currentCityName,
    setCurrentCityName,
    currentCityId,
    setCurrentCityId,
    currentStoreId,
    currentStoreName,
    isServiceable,
    setIsServiceable,
    deliveryEtaMinutes,
    setDeliveryEtaMinutes,
    setCurrentArea,
    setCurrentStore,
    catalogVersion,
    authVerificationId,
    setAuthVerificationId,
    tempRegistration,
    setTempRegistration,
    isAuthenticated,
    handleOnboardingSkip,
    logout,
    liveCheckoutState,
    emitCheckoutChange,
    isAuthPromptVisible,
    authPromptMessage,
    authPromptActionName,
    openAuthPrompt,
    closeAuthPrompt,
    requestLocationPermissionAndDetect,
  }), [
    activeScreen, navigateTo, goBack, canGoBack,
    user, selectedAddress, selectedAddressId, selectedAddressSource,
    setSelectedAddress, setActiveDeliveryAddress, setActiveGpsLocation, addAddress,
    cart, cartCount, addToCart, removeFromCart, updateQuantity, clearCart, cartSummary, syncCartFromSummary,
    appliedCoins, orders, currentOrder, placeOrder,
    selectedProduct, selectedCategoryId, selectedCategoryIds, selectedCategoryName,
    navigateToProductListing, searchQuery, isVoiceSearchActive, filters, isJumperVisible,
    walletBalance, addWalletBalance, hideSensitiveItems, appearance,
    deliveryLocation, isLocationModalVisible, isDistrictModalVisible,
    blinkitCart, blinkitCartList, blinkitCartCount, blinkitCartTotal, blinkitMrpTotal,
    updateBlinkitQty, getBlinkitQty, clearBlinkitCart,
    appliedCoupon, couponDiscount, applyCoupon, removeCoupon,
    selectedBlinkitProduct, wishlist, toggleWishlist, isInWishlist, clearWishlist,
    currentAreaId, currentAreaName, currentCityName, currentCityId,
    currentStoreId, currentStoreName, isServiceable, deliveryEtaMinutes,
    setCurrentArea, setCurrentStore, catalogVersion,
    authVerificationId, tempRegistration, isAuthenticated,
    handleOnboardingSkip, logout,
    liveCheckoutState, emitCheckoutChange,
    isAuthPromptVisible, authPromptMessage, authPromptActionName,
    openAuthPrompt, closeAuthPrompt, requestLocationPermissionAndDetect,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
