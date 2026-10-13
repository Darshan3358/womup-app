import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Product, CartItem, Order, ProductVariant } from '../types';
import {
  api,
  placeLiveOrder as apiPlaceOrder,
  fetchLiveOrders,
  cancelLiveOrder,
  ServerCartApi,
  mapServerCartItemToClient,
  mapServerOrderToClient,
  TRACKING_WS_URL,
  fetchProducts,
} from '../services/api';
import { useAuth } from './AuthContext';
import { useNavigation } from './NavigationContext';
import { io } from 'socket.io-client';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getItemQuantity: (productId: string) => number;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  mrpTotal: number;
  productDiscount: number;
  distanceKm: number;
  ratePerKm: number;
  deliveryFee: number;
  platformFee: number;
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  useCoins: boolean;
  setUseCoins: (use: boolean) => void;
  maxCoinsUsable: number;
  coinDiscount: number;
  total: number;
  totalSavings: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  userCoins: number;
  earnCoins: (amount: number) => void;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  syncServerCart: () => Promise<void>;
  placeOrder: (payload: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    houseFlat?: string;
    street?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
    deliverySlot: string;
    paymentMethod: string;
    deliveryInstructions?: string;
    tip?: number;
    storeId?: string;
    areaId?: string;
    addressId?: string;
    coordinates?: [number, number];
  }) => Promise<Order>;
  activeTrackingOrder: Order | null;
  setActiveTrackingOrder: (order: Order | null) => void;
  cancelOrder: (orderId: string, reason?: string) => Promise<boolean>;
  isSubmittingOrder: boolean;
  cartNotification: string | null;
  clearCartNotification: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, pendingCartItem, clearPendingCartItem, openLoginModal } = useAuth();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedUser = localStorage.getItem('wormup_customer_user');
      const savedToken = localStorage.getItem('wormup_auth_token') || localStorage.getItem('@wormup_token');
      if (!savedUser && !savedToken) {
        return [];
      }
      const saved = localStorage.getItem('wormup_live_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [useCoins, setUseCoins] = useState(false);
  const [userCoins, setUserCoins] = useState(user?.shoppingCoins ?? 50);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [cartNotification, setCartNotification] = useState<string | null>(null);
  const isSyncingRef = useRef(false);

  // Global store tracker from NavigationContext
  const { resolvedLocation } = useNavigation();
  const prevStoreIdRef = useRef<string | null>(null);
  const resolvedLocationRef = useRef(resolvedLocation);
  resolvedLocationRef.current = resolvedLocation;

  const clearCartNotification = useCallback(() => {
    setCartNotification(null);
  }, []);

  // Auto-dismiss cart notification after 5 seconds
  useEffect(() => {
    if (cartNotification) {
      const timer = setTimeout(() => {
        setCartNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [cartNotification]);

  // Global listener: When serving dark store changes, automatically re-validate cart against new store's catalog
  useEffect(() => {
    if (!resolvedLocation?.storeId) return;

    // Proactively inform backend cart of customer selected store/area
    ServerCartApi.setLocation(resolvedLocation.areaId, resolvedLocation.storeId).catch(() => {});

    const storeChanged = prevStoreIdRef.current !== null && prevStoreIdRef.current !== resolvedLocation.storeId;
    const isFirstCheck = prevStoreIdRef.current === null;

    if ((storeChanged || isFirstCheck) && cart.length > 0) {
      const currentStoreId = resolvedLocation.storeId;
      const currentAreaId = resolvedLocation.areaId;
      const storeName = resolvedLocation.storeName || 'Serving Store';

      fetchProducts({ storeId: currentStoreId, areaId: currentAreaId })
        .then((freshProducts) => {
          let priceChanged = false;
          let outOfStockFound = false;

          setCart((prevCart) => {
            return prevCart.map((item) => {
              const freshProd = freshProducts.find(
                (p) => (p.id || (p as any)._id) === (item.product.id || (item.product as any)._id)
              );
              if (!freshProd) return item;

              let newPrice = freshProd.sellingPrice ?? freshProd.price;
              let newMrp = freshProd.mrp ?? freshProd.oldPrice ?? newPrice;
              let newStock = freshProd.stock;

              if (item.selectedVariant && freshProd.variants) {
                const vKey = item.selectedVariant.id || (item.selectedVariant as any)._id || item.selectedVariant.label;
                const matchedV = freshProd.variants.find((v: any) => (v.id || v._id || v.label) === vKey);
                if (matchedV) {
                  newPrice = matchedV.price ?? (matchedV as any).sellingPrice ?? newPrice;
                  newMrp = matchedV.mrp ?? newMrp;
                  newStock = matchedV.stock ?? newStock;
                }
              }

              const currentPrice = item.selectedVariant ? item.selectedVariant.price : (item.product.sellingPrice ?? item.product.price);
              if (Number(newPrice) !== Number(currentPrice)) {
                priceChanged = true;
              }
              if (newStock !== undefined && newStock <= 0) {
                outOfStockFound = true;
              }

              const updatedVariant = item.selectedVariant
                ? {
                    ...item.selectedVariant,
                    price: Number(newPrice ?? item.selectedVariant.price ?? 0),
                    mrp: Number(newMrp ?? item.selectedVariant.mrp ?? newPrice ?? 0),
                  }
                : undefined;

              return {
                ...item,
                selectedVariant: updatedVariant,
                product: {
                  ...item.product,
                  price: Number(newPrice), // ✅ CRITICAL FIX: Update .price as well as .sellingPrice!
                  sellingPrice: Number(newPrice), // ✅ Ensures UI and subtotal immediately reflect area price (₹7 vs ₹12)
                  mrp: Number(newMrp),
                  oldPrice: Number(newMrp),
                  stock: newStock,
                },
              };
            });
          });

          if (priceChanged || outOfStockFound) {
            setCartNotification(
              `Serving dark store changed to "${storeName}". Cart prices and availability have been automatically updated.`
            );
          }
        })
        .catch(() => {});
    }

    prevStoreIdRef.current = resolvedLocation.storeId;
  }, [resolvedLocation?.storeId, resolvedLocation?.areaId, resolvedLocation?.storeName, cart.length]);

  // Clear cart if user is unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setCart([]);
      try {
        localStorage.removeItem('wormup_live_cart');
      } catch (_) {}
    }
  }, [isAuthenticated]);

  // Sync user coins from AuthContext user object
  useEffect(() => {
    if (user?.shoppingCoins !== undefined) {
      setUserCoins(user.shoppingCoins);
    }
  }, [user]);

  // Sync cart to local storage cache for offline/instant resume
  useEffect(() => {
    try {
      localStorage.setItem('wormup_live_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('wormup_auth_token') || localStorage.getItem('@wormup_token');
  };

  // Fetch Authoritative Server Cart from MongoDB Atlas (matches App CartService.getServerCart)
  const syncServerCart = useCallback(async () => {
    if (isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      const token = await api.ensureToken();
      if (!token && !localStorage.getItem('wormup_customer_user')) return;

      const currentLoc = resolvedLocationRef.current;
      const serverData = await ServerCartApi.getCart(currentLoc?.areaId, currentLoc?.storeId);
      if (serverData && Array.isArray(serverData.items)) {
        if (serverData.items.length > 0) {
          const mapped = serverData.items.map(mapServerCartItemToClient);
          setCart(mapped);
        } else {
          setCart([]);
        }
        if (serverData.couponCode) {
          setAppliedCoupon(serverData.couponCode);
        }
        if (typeof serverData.useCoins === 'boolean') {
          setUseCoins(serverData.useCoins);
        } else if (serverData.coinsUsed > 0 || serverData.appliedCoins > 0) {
          setUseCoins(true);
        } else {
          setUseCoins(false);
        }
      }
    } catch (err) {
      console.warn('[CartContext] Notice syncing server cart:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Fetch Customer Order History from MongoDB Atlas with auth token
  const refreshOrders = useCallback(async () => {
    try {
      const liveOrders = await fetchLiveOrders(1, 30);
      if (Array.isArray(liveOrders)) {
        setOrders(liveOrders);
      }
    } catch (err) {
      console.warn('[CartContext] Notice fetching live orders:', err);
    }
  }, []);

  // On mount and whenever authentication status changes, sync cart and orders
  useEffect(() => {
    syncServerCart();
    refreshOrders();
  }, [user, isAuthenticated, syncServerCart, refreshOrders]);

  // Window focus sync (debounced to avoid request flooding, relies on WebSockets for live sync)
  useEffect(() => {
    let lastFocusSync = Date.now();
    const handleSync = () => {
      // Only re-sync on focus if user was away for at least 30 seconds
      if (Date.now() - lastFocusSync > 30000) {
        lastFocusSync = Date.now();
        syncServerCart();
      }
    };

    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('focus', handleSync);
    };
  }, [syncServerCart]);

  // Real-time WebSocket synchronization across Web and Mobile (Cart, Orders, Status, Wallet)
  useEffect(() => {
    const currentUserId = user?.id || (user as any)?._id;
    if (!currentUserId) return;

    const socket = io(TRACKING_WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      socket.emit('join_user', { userId: currentUserId });
    });

    // 1. Live Cart Synchronization (Web <-> Mobile)
    socket.on('cart_updated', (payload: any) => {
      if (!payload) return;
      if (payload.userId && payload.userId !== currentUserId) return;
      const cartSummary = payload.cart;

      if (cartSummary) {
        if (typeof cartSummary.useCoins === 'boolean') {
          setUseCoins(cartSummary.useCoins);
        } else if (cartSummary.coinsUsed > 0 || cartSummary.appliedCoins > 0) {
          setUseCoins(true);
        } else {
          setUseCoins(false);
        }
        if (cartSummary.couponCode !== undefined) {
          setAppliedCoupon(cartSummary.couponCode || null);
        }
      }

      if (cartSummary && Array.isArray(cartSummary.items)) {
        const mapped = cartSummary.items.map(mapServerCartItemToClient);
        setCart(mapped);
        try {
          localStorage.setItem('wormup_live_cart', JSON.stringify(mapped));
        } catch (_) {}
      } else if (cartSummary?.items?.length === 0) {
        setCart([]);
        try {
          localStorage.removeItem('wormup_live_cart');
        } catch (_) {}
      }
    });

    // 2. Live Order Placement Sync (When order is placed from Mobile App or Web)
    const handleOrderCreated = (payload: any) => {
      if (!payload) return;
      if (payload.userId && payload.userId !== currentUserId) return;
      const rawOrder = payload.order || payload;
      if (rawOrder && (rawOrder._id || rawOrder.id || rawOrder.orderNumber)) {
        const mappedOrder = mapServerOrderToClient(rawOrder);
        setOrders((prev) => [mappedOrder, ...prev.filter((o) => o.id !== mappedOrder.id && o.orderNumber !== mappedOrder.orderNumber)]);
        setActiveTrackingOrder(mappedOrder);
        // Instant clear cart on device when order placed anywhere
        setCart([]);
        try {
          localStorage.removeItem('wormup_live_cart');
        } catch (_) {}
      }
      refreshOrders();
    };

    socket.on('order_created', handleOrderCreated);
    socket.on('order_placed', handleOrderCreated);

    // 3. Live Order Status Updates (Store accept, Rider out for delivery, Delivered, Cancelled)
    const handleOrderStatus = (payload: any) => {
      if (!payload) return;
      const targetId = payload.orderId?.toString();
      const targetNum = payload.orderNumber?.toString();
      const newStatus = payload.status;
      if (!newStatus) return;

      setOrders((prev) =>
        prev.map((o) => {
          if ((targetId && (o.id === targetId || o._id === targetId)) || (targetNum && o.orderNumber === targetNum)) {
            return { ...o, status: newStatus };
          }
          return o;
        })
      );

      setActiveTrackingOrder((prev) => {
        if (!prev) return null;
        if ((targetId && (prev.id === targetId || prev._id === targetId)) || (targetNum && prev.orderNumber === targetNum)) {
          return { ...prev, status: newStatus };
        }
        return prev;
      });
    };

    socket.on('order_status_updated', handleOrderStatus);
    socket.on('order_status', handleOrderStatus);

    // 4. Live Shopping Coins / Wallet Balance Sync
    const handleWalletUpdated = (payload: any) => {
      if (!payload) return;
      if (payload.userId && payload.userId !== currentUserId) return;
      if (typeof payload.shoppingCoins === 'number') {
        setUserCoins(payload.shoppingCoins);
      }
    };

    socket.on('wallet_updated', handleWalletUpdated);
    socket.on('coins_updated', handleWalletUpdated);
    socket.on('scratch_result', (payload: any) => {
      if (!payload) return;
      if (typeof payload.newTotal === 'number') {
        setUserCoins(payload.newTotal);
      }
    });
    socket.on('gift_card_redeemed', (payload: any) => {
      if (!payload) return;
      if (payload.amount) {
        setCartNotification(`🎉 Gift Card ${payload.code || ''} redeemed! ₹${payload.amount} added to your wallet!`);
      }
    });

    // 5. Live Auto-Adjusted Price Notification (When prices change due to dark store switch)
    const handleOrderPriceAdjusted = (payload: any) => {
      if (!payload) return;
      if (payload.userId && payload.userId !== currentUserId) return;

      const storeName = payload.storeName || 'Serving Store';
      const oldTot = payload.oldTotal != null ? `₹${payload.oldTotal}` : '';
      const newTot = payload.newTotal != null ? `₹${payload.newTotal}` : '';
      const count = payload.priceAdjustments?.length || 1;

      setCartNotification(
        `Prices auto-adjusted for "${storeName}": ${count} item${count > 1 ? 's' : ''} updated${oldTot && newTot ? ` (${oldTot} → ${newTot})` : ''}`
      );

      const targetId = payload.orderId?.toString();
      const targetNum = payload.orderNumber?.toString();
      setActiveTrackingOrder((prev) => {
        if (!prev) return null;
        if (
          (targetId && (prev.id === targetId || prev._id === targetId)) ||
          (targetNum && prev.orderNumber === targetNum)
        ) {
          return {
            ...prev,
            total: payload.newTotal ?? prev.total,
            totalAmount: payload.newTotal ?? prev.totalAmount,
            priceAdjustments: payload.priceAdjustments || prev.priceAdjustments,
          };
        }
        return prev;
      });

      setOrders((prev) =>
        prev.map((o) => {
          if (
            (targetId && (o.id === targetId || o._id === targetId)) ||
            (targetNum && o.orderNumber === targetNum)
          ) {
            return {
              ...o,
              total: payload.newTotal ?? o.total,
              totalAmount: payload.newTotal ?? o.totalAmount,
              priceAdjustments: payload.priceAdjustments || o.priceAdjustments,
            };
          }
          return o;
        })
      );
    };

    socket.on('order_price_adjusted', handleOrderPriceAdjusted);

    // 5. Automatic Reconnection State Sync
    socket.on('reconnect', () => {
      socket.emit('join_user', { userId: currentUserId });
      syncServerCart();
      refreshOrders();
    });

    return () => {
      socket.emit('leave_user', { userId: currentUserId });
      socket.disconnect();
    };
  }, [user?.id, (user as any)?._id, syncServerCart, refreshOrders]);

  const addToCart = useCallback((product: Product, variant?: ProductVariant) => {
    const chosenVariant =
      variant ||
      (product.variants && product.variants.find((v) => v.isDefault)) ||
      (product.variants && product.variants[0]);

    // Action Guard / Auth Gate: Guest browsing is public, but cart & buying requires account
    if (!isAuthenticated) {
      openLoginModal({ product, variant: chosenVariant });
      return;
    }

    const prodId = (product.id || product._id) as string;
    const vKey = chosenVariant ? (chosenVariant.id || (chosenVariant as any)._id || chosenVariant.label) : 'default';

    // 1. Instant optimistic local state update for zero latency
    setCart((prev) => {
      const existing = prev.find((item) => {
        const itemPId = item.product.id || item.product._id;
        const itemVKey = item.selectedVariant ? (item.selectedVariant.id || (item.selectedVariant as any)._id || item.selectedVariant.label) : 'default';
        return itemPId === prodId && itemVKey === vKey;
      });

      if (existing) {
        return prev.map((item) => {
          const itemPId = item.product.id || item.product._id;
          const itemVKey = item.selectedVariant ? (item.selectedVariant.id || (item.selectedVariant as any)._id || item.selectedVariant.label) : 'default';
          return itemPId === prodId && itemVKey === vKey
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        });
      }

      let activeStoreName = 'Wom Up Chandlodiya - Tragad Dark Store';
      try {
        const saved = localStorage.getItem('wormup_saved_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.storeName) activeStoreName = parsed.storeName;
        }
      } catch {}

      return [
        ...prev,
        {
          product: chosenVariant
            ? {
                ...product,
                price: chosenVariant.price,
                sellingPrice: chosenVariant.price,
                mrp: chosenVariant.mrp || product.mrp,
                unit: chosenVariant.label,
                quantityLabel: chosenVariant.label,
              }
            : product,
          quantity: 1,
          selectedVariant: chosenVariant,
          storeName: activeStoreName,
        },
      ];
    });

    // 2. Authoritative sync to MongoDB Atlas backend (exact same as mobile app CartService.addItemToServer)
    const token = getAuthToken();
    if (token) {
      const vId = chosenVariant ? (chosenVariant.id || (chosenVariant as any)._id) : undefined;
      ServerCartApi.addItem(prodId, 1, vId)
        .then((summary) => {
          if (summary && Array.isArray(summary.items)) {
            setCart((prev) => {
              return summary.items.map((si: any) => {
                const clientItem = mapServerCartItemToClient(si);
                const localMatch = prev.find(
                  (p) => (p.product.id || p.product._id) === (clientItem.product.id || clientItem.product._id)
                );
                return {
                  ...clientItem,
                  selectedVariant: clientItem.selectedVariant || localMatch?.selectedVariant || chosenVariant,
                };
              });
            });
          }
        })
        .catch((err) => {
          console.warn('[CartContext] Server addItem error:', err);
        });
    }
  }, [isAuthenticated, openLoginModal]);

  // 3. Auto-add pending cart item immediately when user completes login
  useEffect(() => {
    if (isAuthenticated && pendingCartItem) {
      const itemToAdd = pendingCartItem;
      clearPendingCartItem();
      const variantToUse = itemToAdd.variant || (itemToAdd as any).selectedVariant;
      addToCart(itemToAdd.product, variantToUse);
    }
  }, [isAuthenticated, pendingCartItem, clearPendingCartItem, addToCart]);

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => (item.product.id || item.product._id) !== productId));

    const token = getAuthToken();
    if (token) {
      ServerCartApi.removeItem(productId)
        .then((summary) => {
          if (summary && Array.isArray(summary.items)) {
            setCart(summary.items.map(mapServerCartItemToClient));
          }
        })
        .catch((err) => {
          console.warn('[CartContext] Server removeItem error:', err);
        });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const currentQty = getItemQuantity(productId);
    const delta = quantity - currentQty;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        (item.product.id || item.product._id) === productId ? { ...item, quantity } : item
      )
    );

    const token = getAuthToken();
    if (token && delta !== 0) {
      ServerCartApi.updateQuantity(productId, delta)
        .then((summary) => {
          if (summary && Array.isArray(summary.items)) {
            setCart(summary.items.map(mapServerCartItemToClient));
          }
        })
        .catch((err) => {
          console.warn('[CartContext] Server updateQuantity error:', err);
        });
    }
  };

  const getItemQuantity = (productId: string): number => {
    const item = cart.find((i) => (i.product.id || i.product._id) === productId);
    return item ? item.quantity : 0;
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setUseCoins(false);

    const token = getAuthToken();
    if (token) {
      ServerCartApi.clearCart().catch((err) => {
        console.warn('[CartContext] Server clearCart error:', err);
      });
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const mrpTotal = cart.reduce((sum, item) => {
    const unitPrice = item.selectedVariant
      ? item.selectedVariant.price
      : item.product.price || item.product.sellingPrice || 0;
    const unitMrp = item.selectedVariant
      ? (item.selectedVariant.mrp || unitPrice)
      : (item.product.mrp || item.product.oldPrice || unitPrice);
    return sum + unitMrp * item.quantity;
  }, 0);

  const subtotal = cart.reduce((sum, item) => {
    const unitPrice = item.selectedVariant
      ? item.selectedVariant.price
      : item.product.price || item.product.sellingPrice || 0;
    return sum + unitPrice * item.quantity;
  }, 0);

  const productDiscount = Math.max(0, mrpTotal - subtotal);
  const isThaltej = (resolvedLocation?.areaName || '').toLowerCase().includes('thaltej');
  const distanceKm = isThaltej ? 1.15 : 1.64;
  const ratePerKm = 12;
  // Delivery Partner Fee: distance × ₹12/km with Floor Guarantee (Min ₹30 to match MongoDB & mobile app)
  const deliveryFee = subtotal === 0 ? 0 : Math.max(30, Math.round(distanceKm * ratePerKm));
  const platformFee = subtotal === 0 ? 0 : 5;

  const applyCoupon = (code: string): boolean => {
    const c = code.trim().toUpperCase();
    if (
      c === 'WORMUP50' ||
      c === 'WELCOME50' ||
      c === 'BLINKIT50' ||
      c === 'AUCC30' ||
      c === 'FIRST100' ||
      c === 'WORM100' ||
      c === 'SAVE20' ||
      c === 'FESTIVE20'
    ) {
      setAppliedCoupon(c);
      const token = localStorage.getItem('wormup_auth_token');
      if (token) {
        ServerCartApi.applyCoupon(c).catch(() => {});
      }
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  let couponDiscount = 0;
  if (appliedCoupon === 'AUCC30') {
    couponDiscount = 16;
  } else if (appliedCoupon === 'WORMUP50' || appliedCoupon === 'WELCOME50' || appliedCoupon === 'BLINKIT50') {
    couponDiscount = 50;
  } else if (appliedCoupon === 'FIRST100' || appliedCoupon === 'WORM100') {
    couponDiscount = 100;
  } else if (appliedCoupon === 'SAVE20' || appliedCoupon === 'FESTIVE20') {
    couponDiscount = 20;
  }

  // Shopping coins: match App BlinkitCheckoutScreen calculation exactly
  // orderSubtotal = subtotal + deliveryFee + platformFee - couponDiscount
  const orderSubtotal = Math.max(0, subtotal + deliveryFee + platformFee - couponDiscount);
  const maxCoinsUsable = Math.min(userCoins, Math.max(10, Math.floor(orderSubtotal * 0.2)));
  const coinDiscount = useCoins && userCoins > 0 ? maxCoinsUsable : 0;

  const total = Math.max(0, orderSubtotal - coinDiscount);
  const totalSavings = productDiscount + couponDiscount + coinDiscount;

  const handleSetUseCoins = (use: boolean) => {
    setUseCoins(use);
    const token = getAuthToken();
    if (token) {
      ServerCartApi.toggleCoins(use).catch((err) => {
        console.warn('[CartContext] Notice toggling coins on server:', err);
      });
    }
  };

  const earnCoins = (amount: number) => {
    setUserCoins((prev) => prev + amount);
  };

  // Place live order directly on NestJS MongoDB Atlas backend
  const placeOrder = async (payload: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    houseFlat?: string;
    street?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
    deliverySlot: string;
    paymentMethod: string;
    deliveryInstructions?: string;
    tip?: number;
    storeId?: string;
    areaId?: string;
    addressId?: string;
    coordinates?: [number, number]; // [lng, lat]
  }): Promise<Order> => {
    setIsSubmittingOrder(true);
    try {
      const orderItems = cart.map((ci) => {
        const prod = ci.product;
        const pId = (prod.id || prod._id) as string;
        const unitPrice = ci.selectedVariant
          ? ci.selectedVariant.price
          : prod.price || prod.sellingPrice || 0;
        const unitMrp = ci.selectedVariant
          ? ci.selectedVariant.mrp || unitPrice
          : prod.oldPrice || prod.mrp || unitPrice;
        const qLabel = ci.selectedVariant
          ? ci.selectedVariant.label
          : prod.unit || prod.quantityLabel || '1 unit';
        const img =
          prod.image ||
          prod.imageUrl ||
          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80';

        const vId = ci.selectedVariant ? (ci.selectedVariant.id || (ci.selectedVariant as any)._id) : undefined;

        return {
          productId: pId,
          variantId: vId,
          quantity: ci.quantity,
          name: `${prod.name} ${qLabel}`.trim(),
          price: unitPrice,
          mrp: unitMrp,
          imageUrl: img,
          quantityLabel: qLabel,
        };
      });

      let defaultArea = 'Chandlodiya - Tragad';
      let defaultStoreId = '6aac257b8f337240651ef43b';
      let defaultAreaId = '6aac257b8f337240651ef43c';
      try {
        const saved = localStorage.getItem('wormup_saved_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.areaName) defaultArea = parsed.areaName;
          if (parsed && parsed.storeId) defaultStoreId = parsed.storeId;
          if (parsed && parsed.areaId) defaultAreaId = parsed.areaId;
        }
      } catch {}

      const coords: [number, number] = payload.coordinates || [72.5507, 23.1288];

      const serverPayload = {
        storeId: payload.storeId || defaultStoreId,
        areaId: payload.areaId || defaultAreaId,
        addressId: payload.addressId,
        paymentMethod: payload.paymentMethod || 'UPI',
        deliveryInstructions: payload.deliveryInstructions || 'Ring bell & leave at door',
        tip: payload.tip || 0,
        deliveryFee,
        latitude: coords[1],
        longitude: coords[0],
        address: {
          houseFlat: payload.houseFlat || 'Flat 402, Shivam Residency',
          street: payload.street || 'Near University Road',
          areaLandmark: payload.landmark || defaultArea,
          city: payload.city || 'Ahmedabad',
          pincode: payload.pincode || '380009',
          label: payload.addressId ? 'Saved Address' : 'Home',
          fullName: payload.customerName || user?.name || 'Customer',
          phoneNumber: payload.customerPhone || user?.phone || '+91 98765 43210',
          latitude: coords[1],
          longitude: coords[0],
          location: {
            type: 'Point',
            coordinates: coords,
          },
        },
        items: orderItems,
      };

      const createdOrder = await apiPlaceOrder(serverPayload);

      // Earn coins (10 coins per order)
      earnCoins(10);
      if (useCoins) {
        setUserCoins((prev) => Math.max(0, prev - coinDiscount));
      }

      // Prepend to local state & track
      setOrders((prev) => [createdOrder, ...prev]);
      setActiveTrackingOrder(createdOrder);

      // If server auto-adjusted prices for store, notify user immediately
      if (createdOrder.priceAdjustments && createdOrder.priceAdjustments.length > 0) {
        const count = createdOrder.priceAdjustments.length;
        setCartNotification(
          `Prices auto-adjusted for "${createdOrder.storeName || 'your delivery store'}": ${count} item${count > 1 ? 's' : ''} updated.`
        );
      }

      setCart([]);
      setAppliedCoupon(null);
      setUseCoins(false);
      setIsCartOpen(false);

      // Refresh orders from MongoDB Atlas
      await refreshOrders();

      return createdOrder;
    } catch (err: any) {
      console.error('[CartContext] Order placement failed:', err);
      throw err;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const cancelOrder = async (orderId: string, reason?: string): Promise<boolean> => {
    try {
      const ok = await cancelLiveOrder(orderId, reason);
      if (ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: 'CANCELLED', cancellationReason: reason } : o
          )
        );
        if (activeTrackingOrder?.id === orderId) {
          setActiveTrackingOrder((prev) =>
            prev ? { ...prev, status: 'CANCELLED', cancellationReason: reason } : null
          );
        }
        await refreshOrders();
      }
      return ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        getItemQuantity,
        clearCart,
        totalItems,
        subtotal,
        mrpTotal,
        productDiscount,
        distanceKm,
        ratePerKm,
        deliveryFee,
        platformFee,
        totalSavings,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        useCoins,
        setUseCoins: handleSetUseCoins,
        maxCoinsUsable,
        coinDiscount,
        total,
        isCartOpen,
        setIsCartOpen,
        userCoins,
        earnCoins,
        orders,
        refreshOrders,
        syncServerCart,
        placeOrder,
        activeTrackingOrder,
        setActiveTrackingOrder,
        cancelOrder,
        isSubmittingOrder,
        cartNotification,
        clearCartNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
