import React, { createContext, useContext, useState, useEffect } from 'react';
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
  placeOrder: (paymentMethod: string, options?: { tip?: number; deliveryInstructions?: string }) => Promise<Order>;

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
  };
  setTempRegistration: (data: {
    fullName: string;
    email: string;
    phone?: string;
    referralCode?: string;
    preferredCityId?: string;
    preferredCityName?: string;
  }) => void;
  logout: () => Promise<void>;

  // Delivery City
  currentCityName: string | null;
  setCurrentCityName: (name: string | null) => void;
  currentCityId: string | null;
  setCurrentCityId: (id: string | null) => void;
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
  }>({
    fullName: '',
    email: '',
    phone: '',
    referralCode: '',
    preferredCityId: undefined,
    preferredCityName: 'Ahmedabad',
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

  const setCurrentArea = (areaId: string, areaName: string) => {
    setCurrentAreaId(areaId);
    setCurrentAreaName(areaName);
  };

  const setCurrentStore = (storeId: string | null, storeName: string | null) => {
    setCurrentStoreId(storeId);
    setCurrentStoreName(storeName);
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

  // Live real cart (starts clean and empty)
  const [blinkitCart, setBlinkitCart] = useState<Record<string, BlinkitCartEntry>>({});
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
    StorageService.saveItem(StorageService.KEYS.ACTIVE_SCREEN, targetScreen);
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

  // Live cart state (starts empty)
  const [cart, setCart] = useState<CartItem[]>([]);
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
  };

  const clearWishlist = () => {
    setWishlist([]);
    StorageService.removeItem(StorageService.KEYS.WISHLIST);
  };

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
          }
        }

        // Restore Active Screen on refresh
        const savedScreen = await StorageService.getItem<ScreenId | null>(
          StorageService.KEYS.ACTIVE_SCREEN,
          null
        );
        const validTarget =
          savedScreen &&
          savedScreen !== 'C01_Splash' &&
          savedScreen !== 'C02_Onboarding1' &&
          savedScreen !== 'C06_MobileNumber' &&
          savedScreen !== 'C07_OtpVerification'
            ? savedScreen
            : 'Blinkit_Home';
        setActiveScreenState(validTarget);
      } catch (e) {
        console.warn('Session restoration error:', e);
      }

      // 2. Saved Cart & Blinkit Cart
      try {
        const savedCart = await StorageService.getItem<CartItem[] | null>(
          StorageService.KEYS.CART,
          null
        );
        if (savedCart && savedCart.length > 0) setCart(savedCart);
      } catch (e) {}

      try {
        const savedBlinkitCart = await StorageService.getItem<Record<string, BlinkitCartEntry> | null>(
          StorageService.KEYS.BLINKIT_CART,
          null
        );
        if (savedBlinkitCart && Object.keys(savedBlinkitCart).length > 0) {
          setBlinkitCart(savedBlinkitCart);
        }
      } catch (e) {}

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

  // When currentAreaId or currentStoreId updates, re-fetch products with store-specific stock and area prices
  useEffect(() => {
    if (currentAreaId || currentStoreId) {
      ProductService.fetchProducts({
        areaId: currentAreaId || undefined,
        storeId: currentStoreId || undefined,
      }).then((liveProducts) => {
        if (liveProducts && liveProducts.length > 0) {
          setSelectedProduct(liveProducts[0]);
          setSelectedBlinkitProduct(mapProductToBlinkit(liveProducts[0]));
        }
      });
    }
  }, [currentAreaId, currentStoreId]);

  // Save cart changes
  useEffect(() => {
    StorageService.saveItem(StorageService.KEYS.CART, cart);
  }, [cart]);

  // Save Blinkit cart changes
  useEffect(() => {
    StorageService.saveItem(StorageService.KEYS.BLINKIT_CART, blinkitCart);
  }, [blinkitCart]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSummary = CartService.calculateSummary(cart, appliedCoins, 40);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
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
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
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
    options?: { tip?: number; deliveryInstructions?: string },
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

      if (res.success && res.data) {
        const liveData = res.data;
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
          shoppingCoinsUsed: liveData.coinsUsed ?? (cartCount > 0 ? cartSummary.shoppingCoinDiscount : appliedCoins),
          deliveryFee: liveData.deliveryFee ?? (cartCount > 0 ? cartSummary.deliveryFee : 0),
          totalAmount: liveData.totalAmount || (cartCount > 0 ? cartSummary.totalPayable : blinkitCartTotal),
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
      shoppingCoinsUsed: cartCount > 0 ? cartSummary.shoppingCoinDiscount : appliedCoins,
      deliveryFee: cartCount > 0 ? cartSummary.deliveryFee : (blinkitCartTotal > 199 ? 0 : 15),
      totalAmount:
        cartCount > 0
          ? cartSummary.totalPayable
          : Math.max(0, blinkitCartTotal + (blinkitCartTotal > 199 ? 0 : 15) + 5 - couponDiscount),
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
  const blinkitCartTotal = blinkitCartList.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );
  const blinkitMrpTotal = blinkitCartList.reduce(
    (sum, item) => sum + item.product.mrp * item.quantity,
    0
  );

  const getBlinkitQty = (productId: string): number => {
    return blinkitCart[productId]?.quantity || 0;
  };

  const updateBlinkitQty = (product: BlinkitProduct, delta: number) => {
    setBlinkitCart((prev) => {
      const current = prev[product.id]?.quantity || 0;
      const nextQty = Math.max(0, current + delta);
      // Cap at stock if limited
      const finalQty = product.stock ? Math.min(nextQty, product.stock) : nextQty;

      if (finalQty <= 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }

      return {
        ...prev,
        [product.id]: {
          product,
          quantity: finalQty,
        },
      };
    });
  };

  const clearBlinkitCart = () => {
    setBlinkitCart({});
  };

  const addWalletBalance = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    api.post<any>('/wallet/topup', { amount, paymentMethod: 'UPI' }).then((res) => {
      if (res.success && res.data?.balance !== undefined) {
        setWalletBalance(res.data.balance);
      }
    }).catch(() => {});
  };

  const couponDiscount = appliedCoupon === 'AUCC30' ? 16 : appliedCoupon === 'BLINKIT50' ? 50 : 0;

  const applyCoupon = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'AUCC30' || clean === 'BLINKIT50') {
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
