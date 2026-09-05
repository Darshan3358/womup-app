import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Order,
  UserProfile,
  Address,
  FilterSortState,
  ScreenId,
} from '../types';
import { PRODUCTS } from '../data/products';
import { MOCK_ORDERS } from '../data/mockOrders';
import { INITIAL_USER, INITIAL_ADDRESS } from '../services/authService';
import { CartService, CartSummary } from '../services/cartService';
import { StorageService } from '../services/storageService';

interface AppContextType {
  // Current screen for jumper & fallback navigation
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  goBack: () => void;
  canGoBack: boolean;

  // Auth & Profile
  user: UserProfile;
  setUser: (user: UserProfile) => void;
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
  placeOrder: (paymentMethod: string) => Order;

  // Product Selection for Details / Listing
  selectedProduct: Product;
  setSelectedProduct: (product: Product) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (categoryId: string) => void;
  selectedCategoryName: string;
  setSelectedCategoryName: (name: string) => void;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: FilterSortState;
  setFilters: (filters: FilterSortState) => void;
  resetFilters: () => void;

  // Dev screen jumper modal visibility
  isJumperVisible: boolean;
  setJumperVisible: (visible: boolean) => void;
}

const DEFAULT_FILTERS: FilterSortState = {
  sortBy: 'popularity',
  priceRange: [0, 500],
  inStockOnly: false,
};

const TAB_SCREENS: ScreenId[] = [
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
  const [activeScreen, setActiveScreenState] = useState<ScreenId>('C01_Splash');
  const [history, setHistory] = useState<ScreenId[]>([]);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [selectedAddress, setSelectedAddress] = useState<Address>(INITIAL_ADDRESS);

  const navigateTo = (screen: ScreenId) => {
    if (screen === 'C01_Splash') return; // NEVER navigate to splash once left

    setActiveScreenState(screen);
    setHistory((prev) => {
      // If switching to a main tab, reset stack with that tab as root
      if (TAB_SCREENS.includes(screen)) {
        return [screen];
      }
      // If navigating to the same screen, don't duplicate
      if (prev[prev.length - 1] === screen) {
        return prev;
      }
      return [...prev.filter((s) => s !== 'C01_Splash'), screen];
    });
  };

  const goBack = () => {
    // If currently on splash or home root tab with no stack
    if (activeScreen === 'C01_Splash' || activeScreen === 'C02_Onboarding1') {
      return; // Never go to splash
    }

    // Check fixed onboarding previous mapping
    if (ONBOARDING_PREVIOUS[activeScreen]) {
      const prev = ONBOARDING_PREVIOUS[activeScreen];
      setActiveScreenState(prev);
      setHistory((h) => h.slice(0, -1));
      return;
    }

    // Stack-based goBack
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current screen
      const prevScreen = newHistory[newHistory.length - 1];

      // Never go back to Splash
      const safeTarget = prevScreen === 'C01_Splash' ? 'C12_Home' : prevScreen;
      setActiveScreenState(safeTarget);
      setHistory(newHistory.filter((s) => s !== 'C01_Splash'));
    } else {
      // Fallback to Home screen
      setActiveScreenState('C12_Home');
      setHistory(['C12_Home']);
    }
  };

  const canGoBack =
    activeScreen !== 'C01_Splash' &&
    activeScreen !== 'C02_Onboarding1' &&
    activeScreen !== 'C12_Home';

  // Initial cart with 3 items matching wireframe Screen 19 (Rice, Sunflower Oil, Amul Milk)
  const [cart, setCart] = useState<CartItem[]>([
    { product: PRODUCTS[0], quantity: 1 }, // Fortune Basmati Rice
    { product: PRODUCTS[3], quantity: 1 }, // Sunflower Oil
    { product: PRODUCTS[4], quantity: 2 }, // Amul Milk
  ]);

  const [appliedCoins, setAppliedCoins] = useState<number>(20);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(MOCK_ORDERS[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cooking');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('Rice & Rice Products');
  const [searchQuery, setSearchQuery] = useState<string>('Rice');
  const [filters, setFilters] = useState<FilterSortState>(DEFAULT_FILTERS);
  const [isJumperVisible, setJumperVisible] = useState<boolean>(false);

  // Restore stored state on mount
  useEffect(() => {
    (async () => {
      const savedUser = await StorageService.getItem<UserProfile | null>(
        StorageService.KEYS.USER,
        null
      );
      if (savedUser) setUser(savedUser);

      const savedCart = await StorageService.getItem<CartItem[] | null>(
        StorageService.KEYS.CART,
        null
      );
      if (savedCart && savedCart.length > 0) setCart(savedCart);
    })();
  }, []);

  // Save cart changes
  useEffect(() => {
    StorageService.saveItem(StorageService.KEYS.CART, cart);
  }, [cart]);

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

  const placeOrder = (paymentMethod: string): Order => {
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: `#W${Math.floor(10000000 + Math.random() * 90000000)}`,
      date: 'Just now',
      status: 'PLACED',
      itemCount: cartCount,
      items: cart.map((i) => ({
        productId: i.product.id,
        name: `${i.product.name} ${i.product.quantityLabel}`,
        quantity: i.quantity,
        price: i.product.sellingPrice,
      })),
      subtotal: cartSummary.subtotalSelling,
      discount: cartSummary.productDiscount,
      shoppingCoinsUsed: cartSummary.shoppingCoinDiscount,
      deliveryFee: cartSummary.deliveryFee,
      totalAmount: cartSummary.totalPayable,
      deliveryAddress: selectedAddress,
      deliverySlot: 'Today, 10:00 AM – 12:00 PM',
      paymentMethod,
      estimatedArrival: '15 min',
      deliveryPartner: {
        name: 'Rohit Kumar',
        phone: '+91 98123 45678',
      },
    };

    // Deduct coins & reward earned coins
    setUser((prev) => ({
      ...prev,
      shoppingCoins:
        prev.shoppingCoins -
        cartSummary.shoppingCoinDiscount +
        cartSummary.totalCoinsEarnable,
    }));

    setOrders((prev) => [newOrder, ...prev]);
    setCurrentOrder(newOrder);
    clearCart();
    return newOrder;
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
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
        selectedCategoryName,
        setSelectedCategoryName,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        resetFilters,
        isJumperVisible,
        setJumperVisible,
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
