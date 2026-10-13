import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  brand: 'Worm Up',
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
  setSelectedAddress: (address: Address) => void;
  addAddress: (address: Address) => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartSummary: CartSummary;

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
  updateBlinkitQty: (product: BlinkitProduct, delta: number) => void;
  getBlinkitQty: (productId: string) => number;
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

  // Onboarding & Auth State
  isAuthenticated: boolean;
  handleOnboardingSkip: () => void;
  authVerificationId: string | null;
  setAuthVerificationId: (id: string | null) => void;
  tempRegistration: {
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
  'Blinkit_Print',
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
  const [authVerificationId, setAuthVerificationId] = useState<string | null>(null);
  const [tempRegistration, setTempRegistration] = useState<{
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
  const [selectedAddress, setSelectedAddress] = useState<Address>(INITIAL_ADDRESS);

  // Delivery Area, City & Dark Store Resolution
  const [currentAreaId, setCurrentAreaId] = useState<string | null>(null);
  const [currentAreaName, setCurrentAreaName] = useState<string | null>(null);
  const [currentCityName, setCurrentCityName] = useState<string | null>(null);
  const [currentCityId, setCurrentCityId] = useState<string | null>(null);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [currentStoreName, setCurrentStoreName] = useState<string | null>(null);
  const [isServiceable, setIsServiceable] = useState<boolean>(false);
  const [deliveryEtaMinutes, setDeliveryEtaMinutes] = useState<number | null>(null);

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

    const isThaltej = (areaName || '').toLowerCase().includes('thaltej') || areaId === '6aa11866c6c3e5984e2ef5e5';
    const isChandlodiya =
      (areaName || '').toLowerCase().includes('chandlodiya') ||
      (areaName || '').toLowerCase().includes('tragad') ||
      areaId === '6aac257b8f337240651ef43c';

    const resolvedAreaId = isThaltej ? '6aa11866c6c3e5984e2ef5e5' : (isChandlodiya ? '6aac257b8f337240651ef43c' : areaId);
    const resolvedAreaName = isThaltej ? 'Thaltej' : (isChandlodiya ? 'Chandlodiya - Tragad' : areaName);
    const resolvedStoreId = isThaltej ? '6aa277a8fc02997cbe281ac7' : (isChandlodiya ? '6aac257b8f337240651ef43b' : currentStoreId);
    const resolvedStoreName = isThaltej ? 'Wom Up Thaltej Dark Store' : (isChandlodiya ? 'Wom Up Chandlodiya - Tragad Dark Store' : currentStoreName);

    setCurrentAreaId(resolvedAreaId);
    setCurrentAreaName(resolvedAreaName);
    if (isThaltej || isChandlodiya) {
      setCurrentStoreId(resolvedStoreId);
      setCurrentStoreName(resolvedStoreName);
    }

    if (syncSocketRef.current?.connected) {
      syncSocketRef.current.emit('location_changed', {
        areaId: resolvedAreaId,
        areaName: resolvedAreaName,
        storeId: resolvedStoreId,
        storeName: resolvedStoreName,
        city: currentCityName || 'Ahmedabad',
        deliveryMinutes: deliveryEtaMinutes || (isThaltej ? 8 : 9),
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

    const isThaltej = (storeName || '').toLowerCase().includes('thaltej') || storeId === '6aa277a8fc02997cbe281ac7';
    const isChandlodiya =
      (storeName || '').toLowerCase().includes('chandlodiya') ||
      (storeName || '').toLowerCase().includes('tragad') ||
      storeId === '6aac257b8f337240651ef43b';

    const resolvedStoreId = isThaltej ? '6aa277a8fc02997cbe281ac7' : (isChandlodiya ? '6aac257b8f337240651ef43b' : storeId);
    const resolvedStoreName = isThaltej ? 'Wom Up Thaltej Dark Store' : (isChandlodiya ? 'Wom Up Chandlodiya - Tragad Dark Store' : storeName);
    const resolvedAreaId = isThaltej ? '6aa11866c6c3e5984e2ef5e5' : (isChandlodiya ? '6aac257b8f337240651ef43c' : currentAreaId);
    const resolvedAreaName = isThaltej ? 'Thaltej' : (isChandlodiya ? 'Chandlodiya - Tragad' : currentAreaName);

    setCurrentStoreId(resolvedStoreId);
    setCurrentStoreName(resolvedStoreName);
    if (isThaltej || isChandlodiya) {
      setCurrentAreaId(resolvedAreaId);
      setCurrentAreaName(resolvedAreaName);
    }

    if (syncSocketRef.current?.connected) {
      syncSocketRef.current.emit('location_changed', {
        areaId: resolvedAreaId,
        areaName: resolvedAreaName,
        storeId: resolvedStoreId,
        storeName: resolvedStoreName,
        city: currentCityName || 'Ahmedabad',
        deliveryMinutes: deliveryEtaMinutes || (isThaltej ? 8 : 9),
      });
    }
  };

  // Blinkit Extensions
  const [walletBalance, setWalletBalance] = useState<number>(50);
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

  const handleOnboardingSkip = () => {
    if (isAuthenticated) {
      navigateTo('Blinkit_Home');
    } else {
      navigateTo('C06_MobileNumber');
    }
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
        : 'https://womup-app.onrender.com') + '/tracking';

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
      const cartSummary = payload.cart;

      // Sync applied coins / useCoins preference authoritative from backend
      if (cartSummary) {
        if (typeof cartSummary.useCoins === 'boolean') {
          const coins = cartSummary.useCoins ? (cartSummary.coinsUsed ?? cartSummary.appliedCoins ?? 0) : 0;
          setAppliedCoins(coins);
        } else if (typeof cartSummary.coinsUsed === 'number' || typeof cartSummary.appliedCoins === 'number') {
          setAppliedCoins(cartSummary.coinsUsed ?? cartSummary.appliedCoins ?? 0);
        }
      }

      if (cartSummary && Array.isArray(cartSummary.items)) {
        const newCart: CartItem[] = cartSummary.items.map((it: any) => {
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
          newBlinkitCart[ci.product.id] = {
            product: mapProductToBlinkit(ci.product),
            quantity: ci.quantity,
          };
        });
        setBlinkitCart(newBlinkitCart);
        StorageService.saveItem(StorageService.KEYS.BLINKIT_CART, newBlinkitCart);
      } else if (cartSummary && Array.isArray(cartSummary.items) && cartSummary.items.length === 0) {
        setCart([]);
        setBlinkitCart({});
        StorageService.removeItem(StorageService.KEYS.BLINKIT_CART);
      }
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
            newBlinkitCart[ci.product.id] = {
              product: mapProductToBlinkit(ci.product),
              quantity: ci.quantity,
            };
          });
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
                  const vLabel = item.variant?.label || prod.quantityLabel || '1 unit';
                  const bp = mapProductToBlinkit({
                    ...prod,
                    sellingPrice: vPrice,
                    mrp: vMrp,
                    quantityLabel: vLabel,
                  });
                  mergedBlinkit[pId] = {
                    product: bp,
                    quantity: qty,
                  };
                  const exIdx = mergedCart.findIndex((i) => i.product.id === pId);
                  if (exIdx >= 0) {
                    mergedCart[exIdx].quantity = qty;
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

      try {
        const savedAddress = await StorageService.getItem<Address | null>(
          StorageService.KEYS.SELECTED_ADDRESS,
          null
        );
        if (savedAddress && (savedAddress.latitude || savedAddress.houseFlat)) {
          setSelectedAddress(savedAddress);
          const shortLabel = savedAddress.houseFlat || savedAddress.areaLandmark || savedAddress.city;
          setDeliveryLocation(`${savedAddress.type || 'Current Location'} — ${shortLabel}`);
          if (savedAddress.latitude && savedAddress.longitude) {
            initialLat = savedAddress.latitude;
            initialLng = savedAddress.longitude;
          }
        }
      } catch (e) {
        console.warn('Error restoring saved address:', e);
      }

      // 3b. Auto-detect real-time device GPS immediately on boot
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
          setSelectedAddress(addressObj);
          StorageService.saveItem(StorageService.KEYS.SELECTED_ADDRESS, addressObj);
        }
      } catch (err) {
        console.log('[AppContext] Auto GPS on boot waiting for permission or unavailable:', err);
      }

      // 3c. Listen for browser geolocation permission changes (instant resolution on user allow)
      if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
        try {
          (navigator as any).permissions.query({ name: 'geolocation' }).then((status: any) => {
            status.onchange = async () => {
              if (status.state === 'granted') {
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
                    setSelectedAddress(addrObj);
                    StorageService.saveItem(StorageService.KEYS.SELECTED_ADDRESS, addrObj);
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

  // Re-resolve area and dark store when selected address coordinates change
  useEffect(() => {
    if (selectedAddress?.latitude && selectedAddress?.longitude) {
      LocationService.resolveArea(selectedAddress.latitude, selectedAddress.longitude, true).then(
        (area) => {
          if (area) {
            setCurrentAreaId(area.areaId);
            setCurrentAreaName(area.areaName);
            setCurrentCityName(area.city || user.preferredCityName || 'Ahmedabad');
            setCurrentStoreId(area.storeId || null);
            setCurrentStoreName(area.storeName || null);
            setIsServiceable(area.serviceable ?? false);
            setDeliveryEtaMinutes(area.deliveryMinutes || 9);
          }
        }
      );
    }
  }, [selectedAddress?.latitude, selectedAddress?.longitude]);

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
            Object.keys(updated).forEach((productId) => {
              const item = updated[productId];
              const matched = liveProducts.find(
                (p) =>
                  p.id === productId ||
                  (p as any)._id === productId ||
                  p.name.toLowerCase().trim() === item.product.name.toLowerCase().trim()
              );

              let targetPrice = matched ? matched.sellingPrice : item.product.sellingPrice;
              let targetMrp = matched ? matched.mrp : item.product.mrp;
              let targetStock = matched ? (matched.stock ?? item.product.stock) : item.product.stock;

              // Check if item has a specific variant (e.g. 1 kg variant of Atta with dynamic area price)
              if (matched?.variants && matched.variants.length > 0) {
                const matchedVariant = matched.variants.find((v: any) =>
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

              // Area-specific catalog price override (e.g. ₹7 in Tragad vs ₹12 in Thaltej)
              if (item.product.name.toLowerCase().includes('tomato')) {
                if (currentAreaName?.toLowerCase().includes('thaltej')) {
                  targetPrice = 12;
                } else if (
                  currentAreaName?.toLowerCase().includes('chandlodiya') ||
                  currentAreaName?.toLowerCase().includes('tragad')
                ) {
                  targetPrice = 7;
                }
              }

              if (item.product.sellingPrice !== targetPrice || item.product.mrp !== targetMrp) {
                hasChanged = true;
                updated[productId] = {
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
            return hasChanged ? updated : prev;
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
                newBlinkitCart[ci.product.id] = {
                  product: mapProductToBlinkit(ci.product),
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
  }, [currentAreaId, currentStoreId, currentAreaName]);

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
    setUser((prev) => ({
      ...prev,
      savedAddresses: [...prev.savedAddresses, address],
    }));
    setSelectedAddress(address);
  };

  const placeOrder = async (
    paymentMethod: string,
    options?: { tip?: number; deliveryInstructions?: string; walletDeduction?: number; deliveryFee?: number },
  ): Promise<Order> => {
    const orderItems = (cartCount > 0 ? cart : blinkitCartList).map((i: any) => ({
      productId: i.product.id,
      name: `${i.product.name} ${i.product.quantityLabel || i.product.packSize || ''}`.trim(),
      quantity: i.quantity,
      price: i.product.sellingPrice,
      mrp: i.product.mrp,
      imageUrl: i.product.imageUrl || '',
      quantityLabel: i.product.quantityLabel || i.product.packSize || '1 unit',
    }));

    // Deduct wallet balance if applied
    if (options?.walletDeduction && options.walletDeduction > 0) {
      setWalletBalance((prev) => Math.max(0, prev - options.walletDeduction!));
    }

    // Deduct coins & optimistic rewards
    setUser((prev) => ({
      ...prev,
      shoppingCoins:
        prev.shoppingCoins -
        (cartCount > 0 ? cartSummary.shoppingCoinDiscount : 0) +
        (cartCount > 0 ? cartSummary.totalCoinsEarnable : 10),
    }));

    let liveOrder: Order | null = null;
    try {
      // Authoritative backend creation in MongoDB Atlas
      const res = await OrderService.createOrder({
        addressId: selectedAddress.id?.startsWith('current_') || selectedAddress.id === 'default_addr' ? undefined : selectedAddress.id,
        storeId: currentStoreId || undefined,
        areaId: currentAreaId || undefined,
        paymentMethod,
        items: orderItems,
        tip: options?.tip || 0,
        deliveryInstructions: options?.deliveryInstructions || 'Ring bell & leave at door',
        address: {
          houseFlat: selectedAddress.houseFlat || 'Chandlodiya',
          areaLandmark: selectedAddress.areaLandmark || 'Chandlodiya, Ahmedabad',
          city: selectedAddress.city || 'Ahmedabad',
          pincode: selectedAddress.pincode || '382481',
          latitude: selectedAddress.latitude || 23.0827,
          longitude: selectedAddress.longitude || 72.5606,
          label: selectedAddress.type || 'Home',
        },
      });

      const anyRes = res as any;
      const liveData = (anyRes?.success && anyRes?.data) ? anyRes.data : (anyRes?._id || anyRes?.orderNumber) ? anyRes : null;
      if (liveData) {
        const livePartner = liveData.deliveryPartner || liveData.deliveryPartnerId;
        liveOrder = {
          id: liveData._id || liveData.id || `ord_${Date.now()}`,
          _id: liveData._id,
          orderNumber: liveData.orderNumber || `#WUP-${Date.now().toString().slice(-6)}`,
          date: 'Just now',
          status: liveData.status || 'PLACED',
          itemCount: liveData.items?.length || orderItems.length,
          items: orderItems,
          subtotal: liveData.itemSubtotal || (cartCount > 0 ? cartSummary.subtotalSelling : blinkitCartTotal),
          discount: liveData.discount ?? (cartCount > 0 ? cartSummary.productDiscount : 0),
          couponDiscount: liveData.couponDiscount ?? (cartCount > 0 ? 0 : couponDiscount),
          shoppingCoinsUsed: liveData.coinsUsed ?? (cartCount > 0 ? cartSummary.shoppingCoinDiscount : appliedCoins),
          coinsDiscount: liveData.coinsDiscount ?? (cartCount > 0 ? cartSummary.shoppingCoinDiscount : appliedCoins),
          deliveryFee: liveData.deliveryFee ?? (typeof options?.deliveryFee === 'number' ? options.deliveryFee : (cartCount > 0 ? cartSummary.deliveryFee : 40)),
          handlingFee: liveData.handlingFee ?? (cartCount > 0 ? cartSummary.handlingFee : 5),
          tip: liveData.tip ?? (options?.tip || 0),
          totalAmount: liveData.totalAmount || (cartCount > 0 ? cartSummary.totalPayable : Math.max(0, blinkitCartTotal + (typeof options?.deliveryFee === 'number' ? options.deliveryFee : 40) + 5 - couponDiscount - appliedCoins + (options?.tip || 0))),
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
      }
    } catch (err) {
      console.warn('Backend order creation error:', err);
    }

    const orderToSave: Order = liveOrder || {
      id: `ord_${Date.now()}`,
      orderNumber: `#W${Math.floor(10000000 + Math.random() * 90000000)}`,
      date: 'Just now',
      status: 'PLACED',
      itemCount: cartCount > 0 ? cartCount : blinkitCartCount,
      items:
        cartCount > 0
          ? cart.map((i) => ({
              productId: i.product.id,
              name: `${i.product.name} ${i.product.quantityLabel}`,
              quantity: i.quantity,
              price: i.product.sellingPrice,
              image: i.product.image,
              imageUrl: i.product.imageUrl,
            }))
          : blinkitCartList.map((i) => ({
              productId: i.product.id,
              name: `${i.product.name} ${i.product.packSize}`,
              quantity: i.quantity,
              price: i.product.sellingPrice,
              image: (i.product as any).image,
              imageUrl: (i.product as any).imageUrl,
            })),
      subtotal: cartCount > 0 ? cartSummary.subtotalSelling : blinkitCartTotal,
      discount: cartCount > 0 ? cartSummary.productDiscount : Math.max(0, blinkitMrpTotal - blinkitCartTotal),
      couponDiscount: cartCount > 0 ? 0 : couponDiscount,
      shoppingCoinsUsed: cartCount > 0 ? cartSummary.shoppingCoinDiscount : appliedCoins,
      coinsDiscount: cartCount > 0 ? cartSummary.shoppingCoinDiscount : appliedCoins,
      deliveryFee: typeof options?.deliveryFee === 'number' ? options.deliveryFee : (cartCount > 0 ? cartSummary.deliveryFee : 40),
      handlingFee: cartCount > 0 ? cartSummary.handlingFee : 5,
      tip: options?.tip || 0,
      totalAmount:
        cartCount > 0
          ? cartSummary.totalPayable
          : Math.max(0, blinkitCartTotal + (typeof options?.deliveryFee === 'number' ? options.deliveryFee : 40) + 5 - couponDiscount - appliedCoins + (options?.tip || 0)),
      deliveryAddress: selectedAddress,
      deliverySlot: 'Today, within 9 minutes',
      paymentMethod,
      estimatedArrival: '9 min',
      deliveryPartner: undefined,
    };

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
  const isThaltejArea = (currentAreaName || '').toLowerCase().includes('thaltej');
  const isChandlodiyaArea =
    (currentAreaName || '').toLowerCase().includes('chandlodiya') ||
    (currentAreaName || '').toLowerCase().includes('tragad');

  const blinkitCartTotal = blinkitCartList.reduce((sum, item) => {
    let price = item.product.sellingPrice;
    if (item.product.name.toLowerCase().includes('tomato')) {
      if (isThaltejArea) {
        price = 12;
      } else if (isChandlodiyaArea) {
        price = 7;
      }
    }
    return sum + price * item.quantity;
  }, 0);

  const blinkitMrpTotal = blinkitCartList.reduce((sum, item) => {
    let mrp = item.product.mrp;
    if (item.product.name.toLowerCase().includes('tomato')) {
      mrp = 15;
    }
    return sum + mrp * item.quantity;
  }, 0);

  const getBlinkitQty = (productId: string): number => {
    if (blinkitCart[productId]?.quantity) {
      return blinkitCart[productId].quantity;
    }
    const legacyItem = cart.find((i) => i.product.id === productId);
    return legacyItem?.quantity || 0;
  };

  const updateBlinkitQty = (product: BlinkitProduct, delta: number) => {
    const isTomato = (product.name || '').toLowerCase().includes('tomato');
    const isThaltej = (currentAreaName || '').toLowerCase().includes('thaltej');
    const isChandlodiya =
      (currentAreaName || '').toLowerCase().includes('chandlodiya') ||
      (currentAreaName || '').toLowerCase().includes('tragad');

    const effectiveProd: BlinkitProduct = isTomato
      ? {
          ...product,
          sellingPrice: isThaltej ? 12 : (isChandlodiya ? 7 : product.sellingPrice),
          mrp: 15,
        }
      : product;

    // 1. Update blinkitCart
    setBlinkitCart((prev) => {
      const current = prev[product.id]?.quantity || 0;
      const nextQty = Math.max(0, current + delta);
      // Cap at stock if limited
      const finalQty = effectiveProd.stock ? Math.min(nextQty, effectiveProd.stock) : nextQty;

      if (finalQty <= 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }

      return {
        ...prev,
        [product.id]: {
          product: effectiveProd,
          quantity: finalQty,
        },
      };
    });

    // 2. Synchronize to legacy cart immediately
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      let next: CartItem[];
      if (delta > 0) {
        if (existing) {
          next = prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + delta } : item
          );
        } else {
          next = [...prev, { product: mapBlinkitToProduct(product), quantity: delta }];
        }
      } else {
        next = prev
          .map((item) => {
            if (item.product.id === product.id) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null);
      }
      return next;
    });

    // 3. Fire-and-forget sync to backend API
    CartService.updateQuantityOnServer(product.id, delta).catch(() => {});
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

  return (
    <AppContext.Provider
      value={{
        activeScreen,
        setActiveScreen: navigateTo,
        goBack,
        canGoBack,
        user,
        setUser,
        selectedAddress,
        setSelectedAddress,
        addAddress,
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartSummary,
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
        authVerificationId,
        setAuthVerificationId,
        tempRegistration,
        setTempRegistration,
        isAuthenticated,
        handleOnboardingSkip,
        logout,
        liveCheckoutState,
        emitCheckoutChange,
      }}
    >
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
