import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';

// Local Shop Components
import { WomupHeader } from '../components/WomupHeader';
import { UserCoinHero } from '../components/UserCoinHero';
import { SearchBarFilter } from '../components/SearchBarFilter';
import { CategoryHScroll } from '../components/CategoryHScroll';
import { ShopCard } from '../components/ShopCard';
import { LocalBottomNav, LocalTabKey } from '../components/LocalBottomNav';
import { QRScannerModal } from '../components/QRScannerModal';

// Sub-screens
import { ShopDetailScreen } from './ShopDetailScreen';
import { CartScreen } from './CartScreen';
import { QRScannerScreen } from './QRScannerScreen';
import { MyCoinWalletScreen } from './MyCoinWalletScreen';
import { MyOrdersScreen } from './MyOrdersScreen';
import { MyProfileScreen } from './MyProfileScreen';
import { CityAreaDropdownModal, AdminArea } from '../../components/common/CityAreaDropdownModal';

// API & Types
import { LocalShopApi } from '../api/localShopApi';
import { LocalVendor, LocalCartItem } from '../types/localShop.types';

export const LocalShopHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    setActiveScreen,
    user,
    currentCityName,
    currentAreaName,
    setCurrentCityName,
    setCurrentArea,
    isAuthenticated,
    openAuthPrompt,
  } = useApp();

  // City & Area Modal State
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<LocalTabKey>('Shops');
  const [currentSubScreen, setCurrentSubScreen] = useState<
    'none' | 'shop_detail' | 'cart' | 'qr_scanner'
  >('none');

  // Shop & Cart State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [vendors, setVendors] = useState<LocalVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 23.1288,
    lng: 72.5507,
  });
  const [coinBalance, setCoinBalance] = useState(2000);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<LocalVendor | null>(null);
  const [currentCart, setCurrentCart] = useState<LocalCartItem[]>([]);

  // QR Modal State
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Obtain user's GPS coords on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
        }
      } catch {
        // Fallback to default (Ahmedabad)
      }
    })();
  }, []);

  // Load live vendors from MongoDB within 5km radius
  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const data = await LocalShopApi.getNearbyShops(
        selectedCategory,
        searchQuery,
        userLocation.lat,
        userLocation.lng,
        5 // 🚨 Strict 5km Radius
      );
      setVendors(data);
      if (data.length > 0 && !selectedVendor) {
        setSelectedVendor(data[0]);
      }
      const balance = await LocalShopApi.getCoinBalance();
      setCoinBalance(balance);
    } catch (err) {
      console.warn('Failed to load live vendors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [selectedCategory, searchQuery, userLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVendors();
    setRefreshing(false);
  };

  // Back to Main Quick-Commerce App Handler
  const handleBackToMainApp = () => {
    setActiveScreen('Blinkit_Home');
  };

  // Hardware Back / Browser Back support
  useEffect(() => {
    const onBackPress = () => {
      if (currentSubScreen !== 'none') {
        setCurrentSubScreen('none');
        return true;
      }
      if (activeTab !== 'Shops') {
        setActiveTab('Shops');
        return true;
      }
      handleBackToMainApp();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentSubScreen, activeTab]);

  const handleSelectTab = (tab: LocalTabKey) => {
    if ((tab === 'My Orders' || tab === 'My Coin' || tab === 'My Profile') && !isAuthenticated) {
      openAuthPrompt('Please sign in or register to access this section.', 'Local Shop');
      return;
    }
    if (tab === 'Shops') {
      setSelectedCategory('');
      setSearchQuery('');
    }
    setActiveTab(tab);
  };

  // User taps "Shop Now >" on a ShopCard
  const handleSelectShop = (vendor: LocalVendor) => {
    setSelectedVendor(vendor);
    setCurrentSubScreen('shop_detail');
  };

  // Open Cart
  const handleOpenCart = (cart: LocalCartItem[]) => {
    if (!isAuthenticated) {
      openAuthPrompt('Please sign in or register to view your cart and place order.', 'Local Shop Cart');
      return;
    }
    setCurrentCart(cart);
    setCurrentSubScreen('cart');
  };

  // Successful checkout from Cart
  const handleOrderSuccess = (orderId: string, earnedCoins: number) => {
    setCoinBalance((prev) => prev + earnedCoins);
    setCurrentCart([]);
    setCurrentSubScreen('none');
    setActiveTab('My Orders');
    Alert.alert(
      'Order Placed Successfully! 🎉',
      `Order ID: ${orderId}\n\nYou earned ${earnedCoins} WOMUP Shopping Coins (Worth ₹${earnedCoins})! View your order in My Orders.`,
      [{ text: 'Great!' }]
    );
  };

  // Sub-screen rendering: ShopDetailScreen
  if (currentSubScreen === 'shop_detail' && selectedVendor) {
    return (
      <ShopDetailScreen
        vendorId={selectedVendor.id}
        onGoBack={() => setCurrentSubScreen('none')}
        onOpenCart={handleOpenCart}
        onScanCounterQR={() => {
          setCurrentSubScreen('qr_scanner');
        }}
      />
    );
  }

  // Sub-screen rendering: CartScreen
  if (currentSubScreen === 'cart') {
    return (
      <CartScreen
        initialCart={currentCart}
        onGoBack={() => setCurrentSubScreen('shop_detail')}
        onOrderSuccess={handleOrderSuccess}
      />
    );
  }

  // Sub-screen rendering: QRScannerScreen (Full Camera Scan)
  if (currentSubScreen === 'qr_scanner') {
    return (
      <QRScannerScreen
        initialVendor={selectedVendor}
        onGoBack={() => setCurrentSubScreen('none')}
        onPaymentSuccess={(earnedCoins, amount, vendorName, coinsUsed, newBalance) => {
          if (typeof newBalance === 'number') {
            setCoinBalance(newBalance);
          } else if (coinsUsed && coinsUsed > 0) {
            setCoinBalance((prev) => Math.max(0, prev - coinsUsed));
          } else if (earnedCoins && earnedCoins > 0) {
            setCoinBalance((prev) => prev + earnedCoins);
          }
          // Authoritative sync from backend
          LocalShopApi.getCoinBalance().then((latest) => {
            if (typeof latest === 'number') setCoinBalance(latest);
          });
          setCurrentSubScreen('none');
          setActiveTab('My Coin');
        }}
        onViewOrders={() => {
          LocalShopApi.getCoinBalance().then((latest) => {
            if (typeof latest === 'number') setCoinBalance(latest);
          });
          setCurrentSubScreen('none');
          setActiveTab('My Orders');
        }}
      />
    );
  }

  // Tab rendering: My Coin Wallet
  if (activeTab === 'My Coin') {
    return (
      <View style={{ flex: 1 }}>
        <MyCoinWalletScreen onGoBack={() => setActiveTab('Shops')} />
        <LocalBottomNav
          currentTab={activeTab}
          onSelectTab={handleSelectTab}
          onBackToMainApp={handleBackToMainApp}
        />
      </View>
    );
  }

  // Tab rendering: My Orders
  if (activeTab === 'My Orders') {
    return (
      <View style={{ flex: 1 }}>
        <MyOrdersScreen
          onGoBack={() => setActiveTab('Shops')}
          onShopAgain={(vId) => {
            const v = vendors.find((item) => item.id === vId) || vendors[0];
            setSelectedVendor(v);
            setCurrentSubScreen('shop_detail');
          }}
        />
        <LocalBottomNav
          currentTab={activeTab}
          onSelectTab={handleSelectTab}
          onBackToMainApp={handleBackToMainApp}
        />
      </View>
    );
  }

  // Tab rendering: My Profile
  if (activeTab === 'My Profile') {
    return (
      <View style={{ flex: 1 }}>
        <MyProfileScreen
          coinBalance={coinBalance}
          onGoBack={() => setActiveTab('Shops')}
          onOpenWallet={() => setActiveTab('My Coin')}
        />
        <LocalBottomNav
          currentTab={activeTab}
          onSelectTab={handleSelectTab}
          onBackToMainApp={handleBackToMainApp}
        />
      </View>
    );
  }

  // Master Screen: Home & Shops Tabs (Pixel-matched with the screenshot!)
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. Header (Logo, Location: Admin-verified City/Area, Real Notifications Popup) */}
      <WomupHeader
        location={currentAreaName ? `${currentAreaName}` : (currentCityName || 'Ahmedabad')}
        onSelectLocation={() => {
          setIsCityModalVisible(true);
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E11D48']} />
        }
      >
        {/* 2. Hero Section: User Welcome & My Shopping Coin (2,000) */}
        <UserCoinHero
          userName={user?.fullName || 'Customer'}
          userId={user?.referralCode || 'WORM5871'}
          coinBalance={coinBalance}
          onPressProfile={() => {
            setActiveTab('My Profile');
          }}
          onPressCoins={() => {
            setActiveTab('My Coin');
          }}
        />

        {/* 3. Search Bar with Filter and Pink Circle Action */}
        <SearchBarFilter
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => {
            Alert.alert(
              'Filter Shops',
              'Filter by: Highest Coin % • Distance (Near to Far) • Rating 4.5+'
            );
          }}
          onSubmitSearch={loadVendors}
        />

        {/* 4. Category Horizontal Scroll (Vegetables, Grocery, Medical, Salon, Garments, More) */}
        <CategoryHScroll
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* 5. Nearby WOMUP Shops Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleLeft}>
            <Ionicons name="location-sharp" size={20} color="#E11D48" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitleText}>Nearby Shops</Text>
          </View>

          {/* View on Map Pill Button */}
          <TouchableOpacity
            style={styles.viewOnMapBtn}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                'Map View',
                `Interactive Map loaded for ${currentCityName || 'Ahmedabad'} with live partner locations.`
              );
            }}
          >
            <Ionicons name="map-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.viewOnMapText}>View on Map</Text>
            <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 6. Vendor Cards List */}
        <View style={styles.vendorList}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E11D48" />
              <Text style={styles.loadingText}>Finding nearby partner stores...</Text>
            </View>
          ) : vendors.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="storefront" size={40} color="#E11D48" />
              </View>
              <Text style={styles.emptyTitle}>No Stores Nearby</Text>
              <Text style={styles.emptyDesc}>
                We couldn't find any local stores online within 5km of your location. Please check back later!
              </Text>
              <TouchableOpacity
                style={styles.emptyRefreshBtn}
                activeOpacity={0.8}
                onPress={onRefresh}
              >
                <Ionicons name="refresh" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyRefreshBtnText}>Refresh Stores</Text>
              </TouchableOpacity>
            </View>
          ) : (
            vendors.map((vendor) => (
              <ShopCard
                key={vendor.id}
                vendor={vendor}
                onPressShop={handleSelectShop}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating QR Scanner Button */}
      <TouchableOpacity
        style={styles.floatingQRButton}
        activeOpacity={0.85}
        onPress={() => {
          if (!isAuthenticated) {
            openAuthPrompt('Please sign in or register to scan shop QR codes and pay.', 'Scan & Pay');
            return;
          }
          setSelectedVendor(null);
          setCurrentSubScreen('qr_scanner');
        }}
        accessibilityLabel="Scan Shop QR Code"
      >
        <Ionicons name="qr-code" size={24} color="#FFFFFF" />
        <Text style={styles.floatingQRText}>Scan & Pay</Text>
      </TouchableOpacity>

      {/* 7. Bottom Navigation (Womup ⚡, Home, Shops, My Orders, My Coin, My Profile) */}
      <LocalBottomNav
        currentTab={activeTab}
        onSelectTab={handleSelectTab}
        onBackToMainApp={handleBackToMainApp}
      />

      {/* In-Store QR Counter Payment Modal */}
      <QRScannerModal
        visible={isQRModalOpen}
        vendor={selectedVendor}
        onClose={() => setIsQRModalOpen(false)}
        onPaymentSuccess={(earnedCoins) => {
          setCoinBalance((prev) => prev + earnedCoins);
        }}
      />

      {/* Official Admin City & Delivery Zone Dropdown Modal */}
      <CityAreaDropdownModal
        visible={isCityModalVisible}
        onClose={() => setIsCityModalVisible(false)}
        currentSelectedCity={currentCityName || 'Ahmedabad'}
        currentSelectedArea={currentAreaName || undefined}
        onSelectArea={() => {
          loadVendors();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  viewOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  viewOnMapText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  vendorList: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  floatingQRButton: {
    position: 'absolute',
    bottom: 74,
    right: 16,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  floatingQRText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FECDD3',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 14,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 18,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyRefreshBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
