import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { COLORS } from '../theme/colors';

/**
 * Screen-level Auth Guard HOC (Layer 3 Protection).
 * Wrap sensitive screens like Wallet, Orders, Profile, Checkout, KYC with withAuth.
 * If user is not authenticated, redirects immediately to Login (C06_MobileNumber).
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallbackScreen: string = 'C06_MobileNumber'
): React.FC<P> {
  const ComponentWithAuth: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading } = useAuth();
    const { setActiveScreen } = useApp();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        setActiveScreen(fallbackScreen as any);
      }
    }, [isLoading, isAuthenticated, setActiveScreen]);

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary || '#FF3269'} />
        </View>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  ComponentWithAuth.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return ComponentWithAuth;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
