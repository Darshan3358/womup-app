import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToastItem, ToastType, ToastOverlay } from '../components/Toast';

export interface ToastOptions {
  title?: string;
  duration?: number;
  onPress?: () => void;
}

export interface ToastContextValue {
  showToast: (type: ToastType, message: string, options?: ToastOptions) => string;
  showSuccess: (message: string, title?: string, options?: Omit<ToastOptions, 'title'>) => string;
  showError: (message: string, title?: string, options?: Omit<ToastOptions, 'title'>) => string;
  showWarning: (message: string, title?: string, options?: Omit<ToastOptions, 'title'>) => string;
  showInfo: (message: string, title?: string, options?: Omit<ToastOptions, 'title'>) => string;
  showLoading: (message: string, title?: string) => string;
  hide: (id?: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounter = useRef(1);

  const hide = useCallback((id?: string) => {
    setToasts((prev) => {
      if (!id) {
        // If no ID passed, dismiss top toast
        return prev.slice(1);
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const id = `toast_${Date.now()}_${idCounter.current++}`;
      const newToast: ToastItem = {
        id,
        type,
        message,
        title: options?.title,
        duration: options?.duration,
        onPress: options?.onPress,
      };

      setToasts((prev) => {
        // Queue up to 6 in memory, Top 3 rendered on screen
        const updated = [newToast, ...prev];
        return updated.slice(0, 6);
      });

      return id;
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, title?: string, options?: Omit<ToastOptions, 'title'>) => {
      return showToast('success', message, { ...options, title });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title?: string, options?: Omit<ToastOptions, 'title'>) => {
      return showToast('error', message, { ...options, title });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string, options?: Omit<ToastOptions, 'title'>) => {
      return showToast('warning', message, { ...options, title });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string, options?: Omit<ToastOptions, 'title'>) => {
      return showToast('info', message, { ...options, title });
    },
    [showToast]
  );

  const showLoading = useCallback(
    (message: string, title?: string) => {
      return showToast('loading', message, { title, duration: 0 });
    },
    [showToast]
  );

  const value: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    hide,
    clearAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastOverlay toasts={toasts} onDismiss={hide} />
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export const useToast = useToastContext;

