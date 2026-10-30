import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AdminStateProvider, useAdminState } from './src/context/AdminStateContext';
import { Header } from './src/components/common/Header';
import { BottomNav } from './src/components/common/BottomNav';
import { SidebarDrawer } from './src/components/common/SidebarDrawer';
import { SplashScreen } from './src/components/common/SplashScreen';
import { COLORS } from './src/theme';

// Primary Screens
import { DashboardScreen } from './src/screens/DashboardScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { AreaPricingScreen } from './src/screens/AreaPricingScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { StaffScreen } from './src/screens/StaffScreen';
import { MarketingScreen } from './src/screens/MarketingScreen';
import { StoresManagementScreen } from './src/screens/StoresManagementScreen';
import { VendorsManagementScreen } from './src/screens/VendorsManagementScreen';
import { LocationManagementScreen } from './src/screens/LocationManagementScreen';
import { CategoryManagementScreen } from './src/screens/CategoryManagementScreen';
import { PayoutRatesScreen } from './src/screens/PayoutRatesScreen';
import { WalletsRevenueScreen } from './src/screens/WalletsRevenueScreen';
import { ApprovalHubScreen } from './src/screens/ApprovalHubScreen';

// Sub Views
import { CustomerProfileScreen } from './src/screens/sub/CustomerProfileScreen';
import { SingleZonePricingScreen } from './src/screens/sub/SingleZonePricingScreen';
import { OrderInspectorScreen } from './src/screens/sub/OrderInspectorScreen';
import { ShoppingCoinScreen } from './src/screens/sub/ShoppingCoinScreen';
import { AuditLogsScreen } from './src/screens/sub/AuditLogsScreen';

// Modals
import { EditCustomerModal } from './src/screens/modals/EditCustomerModal';
import { AddCustomerModal } from './src/screens/modals/AddCustomerModal';
import { CrossZoneMatrixModal } from './src/screens/modals/CrossZoneMatrixModal';
import { BulkPriceAdjustmentModal } from './src/screens/modals/BulkPriceAdjustmentModal';
import { StockDiscrepancyModal } from './src/screens/modals/StockDiscrepancyModal';
import { StaffReassignmentModal } from './src/screens/modals/StaffReassignmentModal';
import { OrderCancelRefundModal } from './src/screens/modals/OrderCancelRefundModal';
import { CampaignBuilderModal } from './src/screens/modals/CampaignBuilderModal';
import { PrintLabelModal } from './src/screens/modals/PrintLabelModal';
import { PrintOrderModal } from './src/screens/modals/PrintOrderModal';
import { AddProductModal } from './src/screens/modals/AddProductModal';
import { EditProductModal } from './src/screens/modals/EditProductModal';
import { PriceHistoryModal } from './src/screens/modals/PriceHistoryModal';
import { EditZonePriceModal } from './src/screens/modals/EditZonePriceModal';
import { AddZoneModal } from './src/screens/modals/AddZoneModal';
import { AdminLoginScreen } from './src/screens/AdminLoginScreen';

const MainApp: React.FC = () => {
  const { activeTab, subView, isAdminAuthenticated, activeModal } = useAdminState();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaView>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
        <AdminLoginScreen />
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    // Render sub-views first if active
    if (subView === 'CustomerProfile') return <CustomerProfileScreen />;
    if (subView === 'SingleZonePricing') return <SingleZonePricingScreen />;
    if (subView === 'OrderInspector') return <OrderInspectorScreen />;
    if (subView === 'ShoppingCoin') return <ShoppingCoinScreen />;
    if (subView === 'AuditLogs') return <AuditLogsScreen />;

    // Otherwise render primary tab screens
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardScreen />;
      case 'Approvals':
        return <ApprovalHubScreen />;
      case 'Users':
        return <CustomersScreen />;
      case 'Prices':
        return <AreaPricingScreen />;
      case 'Inventory':
        return <InventoryScreen />;
      case 'Orders':
        return <OrdersScreen />;
      case 'Staff':
        return <StaffScreen />;
      case 'Marketing':
        return <MarketingScreen />;
      case 'Stores':
        return <StoresManagementScreen />;
      case 'Vendors':
        return <VendorsManagementScreen />;
      case 'Locations':
        return <LocationManagementScreen />;
      case 'Categories':
        return <CategoryManagementScreen />;
      case 'PayoutRates':
        return <PayoutRatesScreen />;
      case 'Wallets':
        return <WalletsRevenueScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.container}>
        <Header />
        <View style={styles.body}>{renderContent()}</View>
        <BottomNav />
      </View>

      {/* Global Sidebar Drawer & Modal Layer (Only mounted when modal is triggered) */}
      <SidebarDrawer />
      {activeModal === 'EditCustomer' && <EditCustomerModal />}
      {activeModal === 'AddCustomer' && <AddCustomerModal />}
      {activeModal === 'CrossZoneMatrix' && <CrossZoneMatrixModal />}
      {activeModal === 'BulkPriceAdjustment' && <BulkPriceAdjustmentModal />}
      {activeModal === 'StockDiscrepancy' && <StockDiscrepancyModal />}
      {activeModal === 'StaffReassignment' && <StaffReassignmentModal />}
      {activeModal === 'OrderCancelRefund' && <OrderCancelRefundModal />}
      {activeModal === 'CampaignBuilder' && <CampaignBuilderModal />}
      {activeModal === 'PrintLabel' && <PrintLabelModal />}
      {activeModal === 'PrintOrderDetails' && <PrintOrderModal />}
      {activeModal === 'AddProduct' && <AddProductModal />}
      {activeModal === 'EditProduct' && <EditProductModal />}
      {activeModal === 'PriceHistory' && <PriceHistoryModal />}
      {activeModal === 'EditZonePrice' && <EditZonePriceModal />}
      {activeModal === 'AddZone' && <AddZoneModal />}
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
      <AdminStateProvider>
        <MainApp />
      </AdminStateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: (Platform.OS === 'web' ? '100vh' : '100%') as any,
    backgroundColor: COLORS.navy,
  },
  container: {
    flex: 1,
    height: '100%',
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    overflow: 'hidden',
  },
});
