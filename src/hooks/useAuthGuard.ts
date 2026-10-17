import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

/**
 * Custom hook to guard protected screens.
 * If user is not authenticated, redirects automatically to the login screen.
 */
export const useAuthGuard = (fallbackScreen: string = 'C06_MobileNumber') => {
  const { isAuthenticated, isLoading, user, userRole, logout } = useAuth();
  const { setActiveScreen } = useApp();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setActiveScreen(fallbackScreen as any);
    }
  }, [isLoading, isAuthenticated, setActiveScreen, fallbackScreen]);

  return {
    isAuthenticated,
    isLoading,
    user,
    userRole,
    logout,
  };
};
