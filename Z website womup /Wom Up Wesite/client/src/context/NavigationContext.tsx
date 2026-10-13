import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Product, Category, HeroBanner, HomeSection, ResolvedLocation } from '../types';
import { fetchHomeSections, fetchProducts, fetchCategories, resolveLocation, fetchProductById, TRACKING_WS_URL } from '../services/api';
import { io, Socket } from 'socket.io-client';

export type PageRoute =
  | 'home'
  | 'shop'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'printing'
  | 'account'
  | 'features'
  | 'wishlist';

export interface AreaOption {
  name: string;
  city: string;
  lat: number;
  lng: number;
  storeName: string;
}

export const AHMEDABAD_AREAS: AreaOption[] = [
  { name: 'Chandlodiya - Tragad', city: 'Ahmedabad', lat: 23.1288, lng: 72.5507, storeName: 'Wom Up Chandlodiya - Tragad Dark Store' },
  { name: 'Thaltej', city: 'Ahmedabad', lat: 23.0500, lng: 72.5160, storeName: 'Wom Up Thaltej Dark Store' },
  { name: 'Navrangpura', city: 'Ahmedabad', lat: 23.0365, lng: 72.5611, storeName: 'Wom Up Navrangpura Dark Store' },
  { name: 'Satellite', city: 'Ahmedabad', lat: 23.0304, lng: 72.5178, storeName: 'Wom Up Satellite Dark Store' },
  { name: 'Prahlad Nagar', city: 'Ahmedabad', lat: 23.0125, lng: 72.5082, storeName: 'Wom Up Prahlad Nagar Dark Store' },
  { name: 'Vastrapur', city: 'Ahmedabad', lat: 23.035, lng: 72.5293, storeName: 'Wom Up Vastrapur Dark Store' },
  { name: 'Bopal', city: 'Ahmedabad', lat: 23.0336, lng: 72.4646, storeName: 'Wom Up Bopal Dark Store' },
  { name: 'Ghatlodia', city: 'Ahmedabad', lat: 23.0750, lng: 72.5350, storeName: 'Wom Up Ghatlodia Dark Store' },
  { name: 'SG Highway', city: 'Ahmedabad', lat: 23.0300, lng: 72.5050, storeName: 'Wom Up SG Highway Dark Store' },
];

export const isValidMongoId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return /^[a-f\d]{24}$/i.test(id);
};

interface NavigationContextType {
  currentPage: PageRoute;
  selectedCategorySlug: string;
  selectedProduct: Product | null;
  accountActiveTab: 'profile' | 'orders' | 'wallet' | 'addresses' | 'coins' | 'notifications' | 'settings';
  setAccountActiveTab: (tab: 'profile' | 'orders' | 'wallet' | 'addresses' | 'coins' | 'notifications' | 'settings') => void;
  navigateTo: (
    page: PageRoute,
    params?: {
      categorySlug?: string;
      product?: Product;
      accountTab?: 'profile' | 'orders' | 'wallet' | 'addresses' | 'coins' | 'notifications' | 'settings';
    }
  ) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAreaName: string;
  setSelectedAreaName: (areaName: string) => void;
  selectedCity: string;
  resolvedLocation: ResolvedLocation;
  setResolvedLocation: (loc: ResolvedLocation) => void;
  availableAreas: AreaOption[];
  detectUserLocation: () => Promise<void>;
  isDetectingLocation: boolean;
  locationError: string | null;

  // Live Data directly from MongoDB Atlas
  homeSections: { hero: HeroBanner[]; categories: Category[]; sections: HomeSection[] };
  liveCategories: Category[];
  dbProducts: Product[];
  isLoadingHome: boolean;
  isLoadingProducts: boolean;
  refreshHomeData: () => Promise<void>;

  // Cross-device Live Checkout Synchronization
  checkoutLiveState: {
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

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [accountActiveTab, setAccountActiveTab] = useState<
    'profile' | 'orders' | 'wallet' | 'addresses' | 'coins' | 'notifications' | 'settings'
  >('orders');
  const [searchQuery, setSearchQuery] = useState('');

  // Hyperlocal live location state — default to Chandlodiya - Tragad (matching live GPS)
  const getInitialLocation = (): ResolvedLocation => {
    try {
      const saved = localStorage.getItem('wormup_saved_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.areaName && parsed.areaId) return parsed;
      }
    } catch {}
    return {
      serviceable: true,
      areaId: '6aac257b8f337240651ef43c',
      areaName: 'Chandlodiya - Tragad',
      storeId: '6aac257b8f337240651ef43b',
      storeName: 'Wom Up Chandlodiya - Tragad Dark Store',
      storeCode: 'STORE-CHANDLODIYA_TRAGAD',
      city: 'Ahmedabad',
      deliveryMinutes: 9,
      distanceKm: 1.64,
    };
  };

  const initialLoc = getInitialLocation();
  const [selectedAreaName, setSelectedAreaNameState] = useState<string>(initialLoc.areaName);
  const [selectedCity, setSelectedCity] = useState<string>(`${initialLoc.city} (${initialLoc.areaName})`);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [resolvedLocation, setResolvedLocationState] = useState<ResolvedLocation>(initialLoc);
  const navSocketRef = useRef<Socket | null>(null);

  // Cross-device location synchronization via WebSocket (Website <-> Mobile App)
  useEffect(() => {
    const socket = io(TRACKING_WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    navSocketRef.current = socket;

    socket.on('location_updated', (loc: any) => {
      if (!loc) return;
      if (loc.areaName && loc.storeName) {
        setResolvedLocationState((prev) => {
          const areaId = (loc.areaId && isValidMongoId(loc.areaId)) ? loc.areaId : prev.areaId;
          const storeId = (loc.storeId && isValidMongoId(loc.storeId)) ? loc.storeId : prev.storeId;
          if (prev.storeId === storeId && prev.areaName === loc.areaName) return prev;
          return {
            ...prev,
            ...loc,
            areaId,
            storeId,
            serviceable: loc.serviceable ?? true,
          };
        });
        if (loc.areaName) {
          setSelectedAreaNameState(loc.areaName);
          setSelectedCity(`${loc.city || 'Ahmedabad'} (${loc.areaName})`);
        }
        try {
          localStorage.setItem('wormup_saved_location', JSON.stringify(loc));
        } catch {}
      }
    });

    socket.on('checkout_updated', (data: any) => {
      if (!data) return;
      setCheckoutLiveState((prev) => ({
        ...prev,
        ...data,
      }));
    });

    return () => {
      socket.disconnect();
      navSocketRef.current = null;
    };
  }, []);

  const setResolvedLocation = (loc: ResolvedLocation) => {
    setResolvedLocationState(loc);
    setSelectedAreaNameState(loc.areaName);
    setSelectedCity(`${loc.city} (${loc.areaName})`);
    try {
      localStorage.setItem('wormup_saved_location', JSON.stringify(loc));
    } catch {}

    // Instantly notify mobile app and backend
    if (navSocketRef.current) {
      navSocketRef.current.emit('location_changed', loc);
    }
  };

  const [checkoutLiveState, setCheckoutLiveState] = useState<{
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

  const emitCheckoutChange = (payload: any) => {
    if (navSocketRef.current) {
      navSocketRef.current.emit('checkout_changed', payload);
    }
  };

  // Real data state
  const [homeSections, setHomeSections] = useState<{
    hero: HeroBanner[];
    categories: Category[];
    sections: HomeSection[];
  }>({ hero: [], categories: [], sections: [] });

  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [isLoadingHome, setIsLoadingHome] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // 1. Initial live location resolution & live home data fetching
  const refreshHomeData = async () => {
    setIsLoadingHome(true);
    try {
      const data = await fetchHomeSections({
        areaId: resolvedLocation?.areaId,
        storeId: resolvedLocation?.storeId,
      });
      setHomeSections(data);
      if (data.categories && data.categories.length > 0) {
        setLiveCategories(data.categories);
      }
    } catch (err) {
      console.error('[NavigationContext] Error loading live home sections:', err);
    } finally {
      setIsLoadingHome(false);
    }
  };

  useEffect(() => {
    // 1. AUTO-DETECT GPS location immediately while website opens (only if user hasn't explicitly set/saved location)
    const autoDetectOnLaunch = async () => {
      try {
        const saved = localStorage.getItem('wormup_saved_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.storeId && parsed.areaId) {
            // Respect user's saved location choice, do not let background GPS auto-override it
            setIsDetectingLocation(false);
            return;
          }
        }
      } catch {}

      if (typeof window !== 'undefined' && navigator.geolocation) {
        setIsDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            // Guard: If user picked or saved an address while waiting for GPS, do not overwrite
            if (localStorage.getItem('wormup_saved_location')) {
              setIsDetectingLocation(false);
              return;
            }
            try {
              const loc = await resolveLocation(pos.coords.latitude, pos.coords.longitude);
              setResolvedLocation(loc);
            } catch (err) {
              console.warn('[Location] GPS auto-detect resolve error:', err);
            } finally {
              setIsDetectingLocation(false);
            }
          },
          async (err) => {
            console.warn('[Location] Geolocation permission or timeout:', err.message);
            setIsDetectingLocation(false);
            // Default to Chandlodiya - Tragad coordinates (23.1288, 72.5507)
            if (!localStorage.getItem('wormup_saved_location')) {
              try {
                const loc = await resolveLocation(23.1288, 72.5507);
                setResolvedLocation(loc);
              } catch {}
            }
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      } else {
        // Fallback: resolve using Chandlodiya coordinates
        if (!localStorage.getItem('wormup_saved_location')) {
          resolveLocation(23.1288, 72.5507)
            .then((loc) => setResolvedLocation(loc))
            .catch(() => {});
        }
      }
    };

    autoDetectOnLaunch();

    // Fetch live categories
    fetchCategories()
      .then((cats) => {
        if (cats && cats.length > 0) setLiveCategories(cats);
      })
      .catch((e) => console.warn('[Categories] Fetch error:', e));
  }, []);

  // 2. Dynamic Area-Specific Product & Home Refresh on location change
  useEffect(() => {
    if (!resolvedLocation?.areaId) return;

    setIsLoadingProducts(true);
    fetchProducts({
      areaId: resolvedLocation.areaId,
      storeId: resolvedLocation.storeId,
      limit: 100,
    })
      .then((prods) => {
        setDbProducts(prods);
        // Sync selectedProduct if user currently viewing product page
        setSelectedProduct((prev) => {
          if (!prev) return null;
          const updated = prods.find((p) => String(p.id || p._id) === String(prev.id || prev._id));
          if (updated) return updated;
          // Fallback fetch single product by id with current area
          fetchProductById(String(prev.id || prev._id), {
            areaId: resolvedLocation.areaId,
            storeId: resolvedLocation.storeId,
          }).then((p) => {
            if (p) setSelectedProduct(p);
          });
          return prev;
        });
      })
      .catch((e) => console.error('[Products] Dynamic Area Fetch error:', e))
      .finally(() => setIsLoadingProducts(false));

    fetchHomeSections({
      areaId: resolvedLocation.areaId,
      storeId: resolvedLocation.storeId,
    })
      .then((data) => {
        setHomeSections(data);
        if (data.categories && data.categories.length > 0) {
          setLiveCategories(data.categories);
        }
      })
      .catch((e) => console.warn('[HomeSections] Dynamic Area Fetch error:', e))
      .finally(() => setIsLoadingHome(false));
  }, [resolvedLocation?.areaId, resolvedLocation?.storeId]);

  // Browser Geolocation Detection
  const detectUserLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    setIsDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await resolveLocation(pos.coords.latitude, pos.coords.longitude);
          setResolvedLocation(loc);
        } catch (err: any) {
          setLocationError(err.message || 'Failed to resolve location');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        setLocationError(`Permission denied or unavailable: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const setSelectedAreaName = async (areaName: string) => {
    setSelectedAreaNameState(areaName);
    const target = AHMEDABAD_AREAS.find((a) => a.name.toLowerCase() === areaName.toLowerCase());
    if (target) {
      try {
        const loc = await resolveLocation(target.lat, target.lng);
        setResolvedLocation(loc);
      } catch {
        setSelectedCity(`Ahmedabad (${areaName})`);
      }
    } else {
      try {
        const loc = await resolveLocation(23.1288, 72.5507);
        setResolvedLocation(loc);
      } catch {
        setSelectedCity(`Ahmedabad (${areaName})`);
      }
    }
  };

  // Sync with browser URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash.startsWith('shop')) {
        setCurrentPage('shop');
      } else if (hash.startsWith('product')) {
        setCurrentPage('product');
      } else if (hash.startsWith('printing')) {
        setCurrentPage('printing');
      } else if (hash.startsWith('account')) {
        setCurrentPage('account');
      } else if (hash.startsWith('cart') || hash.startsWith('checkout')) {
        setCurrentPage('cart');
      } else if (hash.startsWith('features')) {
        setCurrentPage('features');
      } else if (hash.startsWith('wishlist')) {
        setCurrentPage('wishlist');
      } else if (hash === '' || hash === 'home') {
        setCurrentPage('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (
    page: PageRoute,
    params?: {
      categorySlug?: string;
      product?: Product;
      accountTab?: 'profile' | 'orders' | 'wallet' | 'addresses' | 'coins' | 'notifications' | 'settings';
    }
  ) => {
    setCurrentPage(page);
    if (params?.categorySlug !== undefined) {
      setSelectedCategorySlug(params.categorySlug);
    }
    if (params?.product) {
      setSelectedProduct(params.product);
      try {
        localStorage.setItem('wormup_selected_product_id', String(params.product.id || params.product._id));
      } catch {}
    }
    if (params?.accountTab) {
      setAccountActiveTab(params.accountTab);
    }

    window.location.hash = page === 'home' ? '' : `#/${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        selectedCategorySlug,
        selectedProduct,
        accountActiveTab,
        setAccountActiveTab,
        navigateTo,
        searchQuery,
        setSearchQuery,
        selectedAreaName,
        setSelectedAreaName,
        selectedCity,
        resolvedLocation,
        setResolvedLocation,
        availableAreas: AHMEDABAD_AREAS,
        detectUserLocation,
        isDetectingLocation,
        locationError,
        homeSections,
        liveCategories,
        dbProducts,
        isLoadingHome,
        isLoadingProducts,
        refreshHomeData,
        checkoutLiveState,
        emitCheckoutChange,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
};
