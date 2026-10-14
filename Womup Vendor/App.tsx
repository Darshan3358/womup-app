import React from 'react';
import { StyleSheet, View, StatusBar, Modal } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { VendorAuthProvider, useVendor } from './src/context/VendorAuthContext';
import { COLORS } from './src/theme';

// Components
import { VendorHeader } from './src/components/VendorHeader';
import { VendorBottomNav } from './src/components/VendorBottomNav';
import { VerificationRequestModal } from './src/components/VerificationRequestModal';

import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { QRCodeDisplayScreen } from './src/screens/QRCodeDisplayScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { VendorRegistrationScreen } from './src/screens/VendorRegistrationScreen';
import { VendorStatusScreen } from './src/screens/VendorStatusScreen';

const MainNavigator: React.FC = () => {
  const { isLoggedIn, activeTab, isQRModalVisible, setIsQRModalVisible, vendor } = useVendor();
  const [showSplash, setShowSplash] = React.useState(true);
  const [showRegistration, setShowRegistration] = React.useState(false);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (showRegistration) {
    return (
      <VendorRegistrationScreen
        onCancel={() => setShowRegistration(false)}
        onSuccess={() => setShowRegistration(false)}
      />
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onRegisterPress={() => setShowRegistration(true)} />;
  }

  // Check vendor status workflow and security flags
  const isBlocked = vendor?.isBlocked === 1;
  const isSuspended = vendor?.isSuspended === 1;
  const isPending = vendor?.vendorStatus === 1 || (!vendor?.isVerified && vendor?.vendorStatus !== 2);
  const isRejected = vendor?.vendorStatus === 3;

  if (isBlocked || isSuspended || isPending || isRejected) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
        <VendorStatusScreen onResubmit={() => setShowRegistration(true)} />
      </SafeAreaView>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardScreen />;
      case 'QRCode':
        return <QRCodeDisplayScreen />;
      case 'Transactions':
        return <TransactionsScreen />;
      case 'Wallet':
        return <WalletScreen />;
      case 'Analytics':
        return <AnalyticsScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.container}>
        <VendorHeader />
        <View style={styles.body}>{renderActiveScreen()}</View>
        <VendorBottomNav />

        {/* Real-time Customer Payment Verification Alert Modal */}
        <VerificationRequestModal />

        {/* Counter QR Code Overlay Modal */}
        <Modal
          visible={isQRModalVisible}
          animationType="slide"
          onRequestClose={() => setIsQRModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <QRCodeDisplayScreen />
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <VendorAuthProvider>
        <MainNavigator />
      </VendorAuthProvider>
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
    backgroundColor: '#F8FAFC',
  },
  body: {
    flex: 1,
  },
});
