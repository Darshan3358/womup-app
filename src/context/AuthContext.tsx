import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storageService';
import { AuthService } from '../services/authService';
import { api } from '../services/api';
import { UserProfile } from '../types';
import io, { Socket } from 'socket.io-client';

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'DARK_STORE' | 'RIDER' | 'ADMIN';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  userRole: UserRole;
  login: (token: string, refreshToken?: string, userData?: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('CUSTOMER');

  /**
   * Check login state and validate token with backend on launch
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const storedToken = await StorageService.getItem<string | null>(StorageService.KEYS.AUTH_TOKEN, null);

      if (!storedToken) {
        api.setToken(null);
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return false;
      }

      api.setToken(storedToken);

      // Validate session with backend
      const profile = await AuthService.getProfile();
      if (profile && (profile.email || profile.phoneNumber || profile.id)) {
        setUser(profile);
        setIsAuthenticated(true);
        setUserRole('CUSTOMER');
        setIsLoading(false);
        return true;
      } else {
        // Token invalid or expired - attempt refresh
        const refreshed = await refreshToken();
        if (!refreshed) {
          await logout();
          setIsLoading(false);
          return false;
        }
        setIsLoading(false);
        return true;
      }
    } catch (e) {
      console.warn('[AuthGuard] checkAuth error:', e);
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Rotate access token using refresh token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const rToken = await StorageService.getItem<string | null>(StorageService.KEYS.REFRESH_TOKEN, null);
      if (!rToken) return false;

      const res = await api.post<any>('/auth/refresh-token', { refreshToken: rToken });
      if (res.success && res.data?.accessToken) {
        const newAccess = res.data.accessToken;
        api.setToken(newAccess);
        await StorageService.saveItem(StorageService.KEYS.AUTH_TOKEN, newAccess);

        if (res.data.refreshToken) {
          await StorageService.saveItem(StorageService.KEYS.REFRESH_TOKEN, res.data.refreshToken);
        }

        const profile = await AuthService.getProfile();
        if (profile) setUser(profile);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[AuthGuard] refreshToken failed:', e);
      return false;
    }
  }, []);

  /**
   * Log in user and persist credentials
   */
  const login = useCallback(async (token: string, refreshToken?: string, userData?: any) => {
    try {
      api.setToken(token);
      await StorageService.saveItem(StorageService.KEYS.AUTH_TOKEN, token);
      if (refreshToken) {
        await StorageService.saveItem(StorageService.KEYS.REFRESH_TOKEN, refreshToken);
      }

      let profile = userData;
      if (!profile) {
        profile = await AuthService.getProfile();
      }

      if (profile) {
        setUser(profile);
        await StorageService.saveItem(StorageService.KEYS.USER, profile);
      }

      setIsAuthenticated(true);
    } catch (e) {
      console.warn('[AuthGuard] login error:', e);
    }
  }, []);

  /**
   * Log out user, purge storage, and reset navigation
   */
  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch (e) {
      console.warn('[AuthGuard] logout backend call failed:', e);
    } finally {
      api.setToken(null);
      await StorageService.removeItem(StorageService.KEYS.AUTH_TOKEN);
      await StorageService.removeItem(StorageService.KEYS.REFRESH_TOKEN);
      await StorageService.removeItem(StorageService.KEYS.USER);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Run initial auth check on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for WebSocket force_logout events (Admin block / suspension / token revoke)
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      const socketUrl = api.getToken() ? 'https://womup-app.onrender.com' : null;
      if (socketUrl) {
        socket = io(socketUrl, { transports: ['websocket'] });
        socket.on('force_logout', () => {
          console.warn('[AuthGuard] Force logout event received from server');
          logout();
        });
      }
    } catch (_) {}

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isAuthenticated, logout]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        userRole,
        login,
        logout,
        checkAuth,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
