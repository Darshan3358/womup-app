import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from './src/context/StoreContext';
import { Header } from './src/components/common/Header';
import { BottomNav } from './src/components/common/BottomNav';
import { SidebarDrawer } from './src/components/common/SidebarDrawer';
import { ConfirmHandoverModal } from './src/components/modals/ConfirmHandoverModal';
import { COLORS } from './src/theme/colors';

// Auth Screens (ST01 - ST04)
import { ST01_SplashScreen } from './src/screens/auth/ST01_SplashScreen';
import { ST02_StoreLoginScreen } from './src/screens/auth/ST02_StoreLoginScreen';
import { ST02b_StoreRegistrationScreen } from './src/screens/auth/ST02b_StoreRegistrationScreen';
import { ST03_OtpVerificationScreen } from './src/screens/auth/ST03_OtpVerificationScreen';
import { ST04_StoreSelectionScreen } from './src/screens/auth/ST04_StoreSelectionScreen';

// Dashboard & Core Screens (ST05 - ST16)
import { ST05_StaffDashboardScreen } from './src/screens/dashboard/ST05_StaffDashboardScreen';
import { ST06_IncomingOrdersScreen } from './src/screens/dashboard/ST06_IncomingOrdersScreen';
import { ST16_StorePerformanceScreen } from './src/screens/dashboard/ST16_StorePerformanceScreen';
import { ST07_OrderDetailScreen } from './src/screens/picking/ST07_OrderDetailScreen';
import { ST08_PickingScreen } from './src/screens/picking/ST08_PickingScreen';
import { ST10_PackingScreen } from './src/screens/picking/ST10_PackingScreen';
import { ST11_ReadyForPickupScreen } from './src/screens/pickup/ST11_ReadyForPickupScreen';
import { ST11b_HandoverScanScreen } from './src/screens/pickup/ST11b_HandoverScanScreen';
import { ST12_InventoryScreen } from './src/screens/inventory/ST12_InventoryScreen';
import { ST13b_InventoryLogsScreen } from './src/screens/inventory/ST13b_InventoryLogsScreen';
import { ST17_AddProductScreen } from './src/screens/inventory/ST17_AddProductScreen';
import { ST14_ShiftHistoryScreen } from './src/screens/profile/ST14_ShiftHistoryScreen';
import { ST15_StaffProfileScreen } from './src/screens/profile/ST15_StaffProfileScreen';
import { ST17_OrderHistoryScreen } from './src/screens/history/ST17_OrderHistoryScreen';

const MainStoreApp: React.FC = () => {
  const { authStep, currentTab, subScreen } = useStore();

  // 1. Auth Flow
  if (authStep === 'SPLASH') return <ST01_SplashScreen />;
  if (authStep === 'LOGIN') return <ST02_StoreLoginScreen />;
  if (authStep === 'REGISTER') return <ST02b_StoreRegistrationScreen />;
  if (authStep === 'OTP') return <ST03_OtpVerificationScreen />;
  if (authStep === 'STORE_SELECT') return <ST04_StoreSelectionScreen />;

  // 2. Authenticated Store Operations Shell
  const renderContent = () => {
    // Sub screens (opened from dashboard actions, detail buttons, or menus)
    if (subScreen === 'OrderDetail') return <ST07_OrderDetailScreen />;
    if (subScreen === 'PickingCore') return <ST08_PickingScreen />;
    if (subScreen === 'Packing') return <ST10_PackingScreen />;
    if (subScreen === 'HandoverScan') return <ST11b_HandoverScanScreen />;
    if (subScreen === 'Performance') return <ST16_StorePerformanceScreen />;
    if (subScreen === 'InventoryLogs') return <ST13b_InventoryLogsScreen />;
    if (subScreen === 'ShiftHistory') return <ST14_ShiftHistoryScreen />;
    if (subScreen === 'AddProduct') return <ST17_AddProductScreen />;

    // Primary Tabs
    switch (currentTab) {
      case 'Dashboard':
        return <ST05_StaffDashboardScreen />;
      case 'Incoming':
        return <ST06_IncomingOrdersScreen />;
      case 'Picking':
        return <ST08_PickingScreen />;
      case 'Ready':
        return <ST11_ReadyForPickupScreen />;
      case 'Inventory':
        return <ST12_InventoryScreen />;
      case 'History':
        return <ST17_OrderHistoryScreen />;
      case 'Profile':
        return <ST15_StaffProfileScreen />;
      default:
        return <ST05_StaffDashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Header />
        <View style={styles.body}>{renderContent()}</View>
        <BottomNav />
      </View>

      {/* Slide-out Sidebar Drawer (Hamburger Menu) */}
      <SidebarDrawer />

      {/* Real-time Handover Alert Modal (triggers on rider arrival at counter) */}
      <ConfirmHandoverModal />
    </SafeAreaView>
  );
};

export default function App() {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.history) {
      try {
        window.history.replaceState(null, '', '/');
      } catch (e) {}
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <MainStoreApp />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  body: {
    flex: 1,
  },
});
