import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
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

const MainApp: React.FC = () => {
  const { activeTab, subView } = useAdminState();
  const [showSplash, setShowSplash] = useState(true);

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
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.container}>
        <Header />
        <View style={styles.body}>{renderContent()}</View>
        <BottomNav />
      </View>

      {/* Global Sidebar Drawer & Modal Layer */}
      <SidebarDrawer />
      <EditCustomerModal />
      <AddCustomerModal />
      <CrossZoneMatrixModal />
      <BulkPriceAdjustmentModal />
      <StockDiscrepancyModal />
      <StaffReassignmentModal />
      <OrderCancelRefundModal />
      <CampaignBuilderModal />
      <PrintLabelModal />
      <PrintOrderModal />
      <AddProductModal />
      <EditProductModal />
      <PriceHistoryModal />
      <EditZonePriceModal />
      <AddZoneModal />

      {/* Launch Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AdminStateProvider>
      <MainApp />
    </AdminStateProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  body: {
    flex: 1,
  },
});
