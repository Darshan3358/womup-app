import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { BottomNavigation, BlinkitTabKey } from '../components/common/BottomNavigation';
import { LocationPickerModal } from '../components/common/LocationPickerModal';
import { DistrictModal } from '../components/common/DistrictModal';
import { COLORS } from '../theme/colors';

// Blinkit Screens
import { BlinkitHomeScreen } from '../screens/blinkit/BlinkitHomeScreen';
import { BlinkitCategoriesScreen } from '../screens/blinkit/BlinkitCategoriesScreen';
import { BlinkitOrderAgainScreen } from '../screens/blinkit/BlinkitOrderAgainScreen';
import { BlinkitPrintScreen } from '../screens/blinkit/BlinkitPrintScreen';
import { BlinkitProfileScreen } from '../screens/blinkit/BlinkitProfileScreen';
import { BlinkitMoneyScreen } from '../screens/blinkit/BlinkitMoneyScreen';
import { BlinkitProductDetailScreen } from '../screens/blinkit/BlinkitProductDetailScreen';
import { BlinkitCartScreen } from '../screens/blinkit/BlinkitCartScreen';
import { BlinkitCheckoutScreen } from '../screens/blinkit/BlinkitCheckoutScreen';
import { BlinkitWishlistScreen } from '../screens/blinkit/BlinkitWishlistScreen';

// Legacy screens for backward compatibility
import { S01_SplashScreen } from '../screens/S01_SplashScreen';
import { S02_Onboarding1Screen } from '../screens/S02_Onboarding1Screen';
import { S03_Onboarding2Screen } from '../screens/S03_Onboarding2Screen';
import { S04_Onboarding3Screen } from '../screens/S04_Onboarding3Screen';
import { S05_Onboarding4Screen } from '../screens/S05_Onboarding4Screen';
import { S06_MobileNumberScreen } from '../screens/S06_MobileNumberScreen';
import { S07_OtpVerificationScreen } from '../screens/S07_OtpVerificationScreen';
import { S08_CreateAccountScreen } from '../screens/S08_CreateAccountScreen';
import { S09_ReferralCodeScreen } from '../screens/S09_ReferralCodeScreen';
import { S10_LocationPermissionScreen } from '../screens/S10_LocationPermissionScreen';
import { S11_AddAddressScreen } from '../screens/S11_AddAddressScreen';
import { S12_HomeScreen } from '../screens/S12_HomeScreen';
import { S13_CategoryScreen } from '../screens/S13_CategoryScreen';
import { S14_SubCategoryScreen } from '../screens/S14_SubCategoryScreen';
import { S15_ProductListingScreen } from '../screens/S15_ProductListingScreen';
import { S16_ProductDetailsScreen } from '../screens/S16_ProductDetailsScreen';
import { S17_SearchScreen } from '../screens/S17_SearchScreen';
import { S18_FilterSortScreen } from '../screens/S18_FilterSortScreen';
import { S19_CartScreen } from '../screens/S19_CartScreen';
import { S20_CheckoutScreen } from '../screens/S20_CheckoutScreen';
import { S21_ApplyShoppingCoinScreen } from '../screens/S21_ApplyShoppingCoinScreen';
import { S22_PaymentScreen } from '../screens/S22_PaymentScreen';
import { S23_OrderPlacedScreen } from '../screens/S23_OrderPlacedScreen';
import { S24_OrderTrackingScreen } from '../screens/S24_OrderTrackingScreen';
import { S25_OrderHistoryScreen } from '../screens/S25_OrderHistoryScreen';
import { S26_AccountScreen } from '../screens/S26_AccountScreen';

export const RootNavigator: React.FC = () => {
  const { activeScreen, setActiveScreen, goBack, canGoBack } = useApp();

  // Listen to Android hardware back button
  useEffect(() => {
    const handleHardwareBack = () => {
      if (canGoBack) {
        goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => backHandler.remove();
  }, [canGoBack, goBack]);

  // Handle Web Browser Back Button (popstate)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        if (canGoBack) {
          goBack();
        }
      };

      window.history.pushState({ screen: activeScreen }, '');
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [activeScreen, canGoBack, goBack]);

  // Screens that show bottom navigation bar
  const isMainTabScreen =
    activeScreen === 'Blinkit_Home' ||
    activeScreen === 'Blinkit_OrderAgain' ||
    activeScreen === 'Blinkit_Categories' ||
    activeScreen === 'Blinkit_Print' ||
    activeScreen === 'C12_Home' ||
    activeScreen === 'C13_Category' ||
    activeScreen === 'C19_Cart' ||
    activeScreen === 'C25_OrderHistory' ||
    activeScreen === 'C26_Account';

  const getCurrentTabKey = (): BlinkitTabKey => {
    switch (activeScreen) {
      case 'Blinkit_Home':
      case 'C12_Home':
        return 'Home';
      case 'Blinkit_OrderAgain':
      case 'C25_OrderHistory':
        return 'Order Again';
      case 'Blinkit_Categories':
      case 'C13_Category':
        return 'Categories';
      case 'Blinkit_Print':
        return 'Print';
      default:
        return 'Home';
    }
  };

  const handleTabPress = (tab: BlinkitTabKey) => {
    switch (tab) {
      case 'Home':
        setActiveScreen('Blinkit_Home');
        break;
      case 'Order Again':
        setActiveScreen('Blinkit_OrderAgain');
        break;
      case 'Categories':
        setActiveScreen('Blinkit_Categories');
        break;
      case 'Print':
        setActiveScreen('Blinkit_Print');
        break;
    }
  };

  const renderCurrentScreen = () => {
    switch (activeScreen) {
      // Blinkit Primary Screens
      case 'Blinkit_Home':
        return <BlinkitHomeScreen />;
      case 'Blinkit_Categories':
        return <BlinkitCategoriesScreen />;
      case 'Blinkit_OrderAgain':
        return <BlinkitOrderAgainScreen />;
      case 'Blinkit_Print':
        return <BlinkitPrintScreen />;
      case 'Blinkit_Profile':
        return <BlinkitProfileScreen />;
      case 'Blinkit_Money':
        return <BlinkitMoneyScreen />;
      case 'Blinkit_ProductDetail':
        return <BlinkitProductDetailScreen />;
      case 'Blinkit_Cart':
        return <BlinkitCartScreen />;
      case 'Blinkit_Checkout':
        return <BlinkitCheckoutScreen />;
      case 'Blinkit_Wishlist':
        return <BlinkitWishlistScreen />;

      // Legacy screens
      case 'C01_Splash':
        return <S01_SplashScreen />;
      case 'C02_Onboarding1':
        return <S02_Onboarding1Screen />;
      case 'C03_Onboarding2':
        return <S03_Onboarding2Screen />;
      case 'C04_Onboarding3':
        return <S04_Onboarding3Screen />;
      case 'C05_Onboarding4':
        return <S05_Onboarding4Screen />;
      case 'C06_MobileNumber':
        return <S06_MobileNumberScreen />;
      case 'C07_OtpVerification':
        return <S07_OtpVerificationScreen />;
      case 'C08_CreateAccount':
        return <S08_CreateAccountScreen />;
      case 'C09_ReferralCode':
        return <S09_ReferralCodeScreen />;
      case 'C10_LocationPermission':
        return <S10_LocationPermissionScreen />;
      case 'C11_AddAddress':
        return <S11_AddAddressScreen />;
      case 'C12_Home':
        return <BlinkitHomeScreen />;
      case 'C13_Category':
        return <BlinkitCategoriesScreen />;
      case 'C14_SubCategory':
        return <S14_SubCategoryScreen />;
      case 'C15_ProductListing':
        return <S15_ProductListingScreen />;
      case 'C16_ProductDetails':
        return <S16_ProductDetailsScreen />;
      case 'C17_Search':
        return <S17_SearchScreen />;
      case 'C18_FilterSort':
        return <S18_FilterSortScreen />;
      case 'C19_Cart':
        return <S19_CartScreen />;
      case 'C20_Checkout':
        return <S20_CheckoutScreen />;
      case 'C21_ApplyShoppingCoin':
        return <S21_ApplyShoppingCoinScreen />;
      case 'C22_Payment':
        return <S22_PaymentScreen />;
      case 'C23_OrderPlaced':
        return <S23_OrderPlacedScreen />;
      case 'C24_OrderTracking':
        return <S24_OrderTrackingScreen />;
      case 'C25_OrderHistory':
        return <S25_OrderHistoryScreen />;
      case 'C26_Account':
        return <S26_AccountScreen />;

      default:
        return <BlinkitHomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderCurrentScreen()}</View>

      {/* 5-Tab Bottom Navigation for main tab screens */}
      {isMainTabScreen && (
        <BottomNavigation
          currentTab={getCurrentTabKey()}
          onSelectTab={handleTabPress}
        />
      )}

      {/* Global Modals */}
      <LocationPickerModal />
      <DistrictModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  screenContainer: {
    flex: 1,
  },
});
