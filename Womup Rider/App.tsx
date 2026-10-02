import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RiderProvider, useRider } from './src/context/RiderContext';
import { Header } from './src/components/common/Header';
import { BottomNav } from './src/components/common/BottomNav';
import { COLORS } from './src/theme/colors';

// Auth & Onboarding Screens (R01 - R06)
import { R01_SplashScreen } from './src/screens/auth/R01_SplashScreen';
import { R02_MobileLoginScreen } from './src/screens/auth/R02_MobileLoginScreen';
import { R03_OtpVerificationScreen } from './src/screens/auth/R03_OtpVerificationScreen';
import { R04_RiderRegistrationScreen } from './src/screens/auth/R04_RiderRegistrationScreen';
import { R06_ApprovalPendingScreen } from './src/screens/auth/R06_ApprovalPendingScreen';

// Primary Tab Screens (R07 - R24)
import { RiderDashboardScreen } from './src/screens/home/R08_RiderDashboardScreen';
import { CurrentDeliveryScreen } from './src/screens/delivery/R13_CurrentDeliveryScreen';
import { EarningsSettlementScreen } from './src/screens/earnings/R29_EarningsSettlementScreen';
import { SupportScreen } from './src/screens/operations/R33_SupportScreen';
import { RiderMoreMenuScreen } from './src/screens/more/RiderMoreMenuScreen';

// Sub Inspector Screens (R20 - R29)
import { PerformanceScreen } from './src/screens/operations/R30_PerformanceScreen';
import { DutyHistoryScreen } from './src/screens/operations/R31_DutyHistoryScreen';
import { DocumentsScreen } from './src/screens/more/R35_DocumentsScreen';
import { RiderProfileScreen } from './src/screens/more/RiderProfileScreen';
import { VehicleDetailsScreen } from './src/screens/more/VehicleDetailsScreen';
import { BankSettlementScreen } from './src/screens/more/BankSettlementScreen';
import { NotificationsScreen } from './src/screens/more/NotificationsScreen';
import { SettingsScreen } from './src/screens/more/SettingsScreen';

// Operational Modals (R09, R11, R15, R18, R28, R29)
import { NewDeliveryModal } from './src/components/modals/NewDeliveryModal';
import { RejectDeliveryModal } from './src/components/modals/RejectDeliveryModal';
import { DeliveryVerificationModal } from './src/components/modals/DeliveryVerificationModal';
import { EmergencyModal } from './src/components/modals/EmergencyModal';
import { PickupVerificationModal } from './src/components/modals/PickupVerificationModal';
import { CustomerUnavailableModal } from './src/components/modals/CustomerUnavailableModal';

const MainRiderApp: React.FC = () => {
  const { authStep, currentTab, subScreen } = useRider();

  // 1. Auth & Onboarding Flow (R01 - R06)
  if (authStep === 'SPLASH') return <R01_SplashScreen />;
  if (authStep === 'LOGIN') return <R02_MobileLoginScreen />;
  if (authStep === 'OTP') return <R03_OtpVerificationScreen />;
  if (authStep === 'REGISTER') return <R04_RiderRegistrationScreen />;
  if (authStep === 'KYC') return <DocumentsScreen isAuthOnboarding={true} />;
  if (authStep === 'APPROVAL_PENDING') return <R06_ApprovalPendingScreen />;

  // 2. Authenticated Rider Shell (R07 - R29)
  const renderContent = () => {
    // Sub Screens (opened from More menu, alerts or dashboard shortcuts)
    if (subScreen === 'Performance') return <PerformanceScreen />;
    if (subScreen === 'DutyHistory') return <DutyHistoryScreen />;
    if (subScreen === 'Documents') return <DocumentsScreen />;
    if (subScreen === 'Profile') return <RiderProfileScreen />;
    if (subScreen === 'VehicleDetails') return <VehicleDetailsScreen />;
    if (subScreen === 'BankSettlement') return <BankSettlementScreen />;
    if (subScreen === 'Notifications') return <NotificationsScreen />;
    if (subScreen === 'Settings') return <SettingsScreen />;

    // Primary Tab Screen
    switch (currentTab) {
      case 'Home':
        return <RiderDashboardScreen />;
      case 'Deliveries':
        return <CurrentDeliveryScreen />;
      case 'Earnings':
        return <EarningsSettlementScreen />;
      case 'Help':
        return <SupportScreen />;
      case 'More':
        return <RiderMoreMenuScreen />;
      default:
        return <RiderDashboardScreen />;
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

      {/* Global Modals Layer */}
      <NewDeliveryModal />
      <RejectDeliveryModal />
      <DeliveryVerificationModal />
      <EmergencyModal />
      <PickupVerificationModal />
      <CustomerUnavailableModal />
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
      <RiderProvider>
        <MainRiderApp />
      </RiderProvider>
    </SafeAreaProvider>
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
