import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Product } from '../types';
import { ServerWishlistApi, api, TRACKING_WS_URL, mapRawItemToProduct } from '../services/api';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

interface WishlistContextType {
  wishlist: Product[];
  totalWishlistItems: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  syncServerWishlist: () => Promise<void>;
  isSyncing: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'wormup_wishlist';
const APP_WISHLIST_KEY = '@wormup_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const savedUser = localStorage.getItem('wormup_customer_user');
      const savedToken = localStorage.getItem('wormup_auth_token') || localStorage.getItem('@wormup_token');
      if (!savedUser && !savedToken) {
        // Guests start with a clean empty wishlist (0 items)
        return [];
      }
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY) || localStorage.getItem(APP_WISHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  // Clear wishlist if user is unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setWishlist([]);
      try {
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
        localStorage.removeItem(APP_WISHLIST_KEY);
      } catch (_) {}
    }
  }, [isAuthenticated]);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (isAuthenticated) {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
      }
    } catch (e) {
      console.warn('[WishlistContext] Storage save error:', e);
    }
  }, [wishlist, isAuthenticated]);

  // Sync with MongoDB backend
  const syncServerWishlist = useCallback(async () => {
    if (isSyncingRef.current) return;
    try {
      isSyncingRef.current = true;
      setIsSyncing(true);

      const token = await api.ensureToken();
      if (!token && !localStorage.getItem('wormup_customer_user')) {
        setWishlist([]);
        return;
      }

      const serverItems = await ServerWishlistApi.getWishlist();
      if (Array.isArray(serverItems)) {
        setWishlist(serverItems);
        try {
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(serverItems));
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[WishlistContext] Server sync notice:', err);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // Sync on mount and when authentication changes
  useEffect(() => {
    syncServerWishlist();
  }, [user, isAuthenticated, syncServerWishlist]);

  // Real-time WebSocket synchronization across Web and Mobile
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

    socket.on('wishlist_updated', (payload: any) => {
      if (!payload) return;
      if (payload.userId && payload.userId !== currentUserId) return;
      const serverItems = payload.wishlist || payload.data || [];
      if (Array.isArray(serverItems)) {
        const mapped = serverItems.map(mapRawItemToProduct);
        setWishlist(mapped);
        try {
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(mapped));
        } catch (_) {}
      }
    });

    return () => {
      socket.emit('leave_user', { userId: currentUserId });
      socket.disconnect();
    };
  }, [user?.id, (user as any)?._id]);

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      if (!productId) return false;
      const cleanId = productId.toString();
      return wishlist.some(
        (item) => (item.id && item.id.toString() === cleanId) || (item._id && item._id.toString() === cleanId)
      );
    },
    [wishlist]
  );

  const toggleWishlist = async (product: Product): Promise<void> => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    const prodId = (product.id || product._id || '').toString();
    if (!prodId) return;

    const alreadyIn = isInWishlist(prodId);

    // 1. Optimistic local update
    if (alreadyIn) {
      setWishlist((prev) =>
        prev.filter(
          (item) => (item.id && item.id.toString() !== prodId) && (item._id && item._id.toString() !== prodId)
        )
      );
    } else {
      setWishlist((prev) => [product, ...prev]);
    }

    // 2. Authoritative backend sync
    try {
      await api.ensureToken();
      const res = await ServerWishlistApi.toggleWishlist(prodId);
      if (res && Array.isArray(res.items)) {
        setWishlist(res.items);
      }
    } catch (e) {
      console.warn('[WishlistContext] Server toggle error:', e);
    }
  };

  const removeFromWishlist = async (productId: string): Promise<void> => {
    const prodId = productId.toString();
    setWishlist((prev) =>
      prev.filter(
        (item) => (item.id && item.id.toString() !== prodId) && (item._id && item._id.toString() !== prodId)
      )
    );

    try {
      await api.ensureToken();
      const res = await ServerWishlistApi.toggleWishlist(prodId);
      if (res && Array.isArray(res.items)) {
        setWishlist(res.items);
      }
    } catch (e) {
      console.warn('[WishlistContext] Server remove error:', e);
    }
  };

  const clearWishlist = async (): Promise<void> => {
    setWishlist([]);
    try {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
      await api.ensureToken();
      await ServerWishlistApi.clearWishlist();
    } catch (e) {
      console.warn('[WishlistContext] Server clear error:', e);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        totalWishlistItems: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        syncServerWishlist,
        isSyncing,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
