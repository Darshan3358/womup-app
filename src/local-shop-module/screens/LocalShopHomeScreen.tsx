import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

// API & Types
import { LocalShopApi } from '../api/localShopApi';
import { LocalVendor, LocalCartItem } from '../types/localShop.types';
import { MOCK_LOCAL_VENDORS } from '../data/mockLocalShops';

export const LocalShopHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, user } = useApp();

  // Navigation State
  const [activeTab, setActiveTab] = useState<LocalTabKey>('Home');
  const [currentSubScreen, setCurrentSubScreen] = useState<
    'none' | 'shop_detail' | 'cart' | 'qr_scanner'
  >('none');

  // Shop & Cart State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [vendors, setVendors] = useState<LocalVendor[]>(MOCK_LOCAL_VENDORS);
  const [coinBalance, setCoinBalance] = useState(2000);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<LocalVendor>(MOCK_LOCAL_VENDORS[0]);
  const [currentCart, setCurrentCart] = useState<LocalCartItem[]>([]);

  // QR Modal State
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Load vendors
  const loadVendors = async () => {
    try {
      const data = await LocalShopApi.getNearbyShops(selectedCategory, searchQuery);
      setVendors(data);
      const balance = await LocalShopApi.getCoinBalance();
      setCoinBalance(balance);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    loadVendors();
  }, [selectedCategory, searchQuery]);

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
      if (activeTab !== 'Home') {
        setActiveTab('Home');
        return true;
      }
      handleBackToMainApp();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentSubScreen, activeTab]);

  const handleSelectTab = (tab: LocalTabKey) => {
    if (tab === 'Main App') {
      handleBackToMainApp();
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
  if (currentSubScreen === 'shop_detail') {
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
        onPaymentSuccess={(earnedCoins, amount, vendorName) => {
          setCoinBalance((prev) => prev + earnedCoins);
          Alert.alert(
            'Payment Verified! 🎉',
            `Paid ₹${amount} to ${vendorName}.\n\n+${earnedCoins} Shopping Coins credited to your wallet!`,
            [{ text: 'View Wallet', onPress: () => setActiveTab('My Coin') }]
          );
        }}
      />
    );
  }

  // Tab rendering: My Coin Wallet
  if (activeTab === 'My Coin') {
    return (
      <View style={{ flex: 1 }}>
        <MyCoinWalletScreen onGoBack={() => setActiveTab('Home')} />
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
          onGoBack={() => setActiveTab('Home')}
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
          onGoBack={() => setActiveTab('Home')}
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
      {/* 1. Header (Logo, Location: Mahesana, Notification badge) */}
      <WomupHeader
        location="Mahesana"
        onOpenMenu={() => {
          Alert.alert(
            'WOMUP Menu',
            'Select an option:',
            [
              { text: '⚡ Back to Womup (9-Min Express)', onPress: handleBackToMainApp },
              { text: '🪙 My Coin Wallet', onPress: () => setActiveTab('My Coin') },
              { text: '📦 My Orders', onPress: () => setActiveTab('My Orders') },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
        onSelectLocation={() => {
          Alert.alert('Select Location', 'Selected: Mahesana (Gujarat)');
        }}
        onOpenNotifications={() => {
          Alert.alert(
            'Notifications (3)',
            '1. Gokul Vegetables added 15% coin cashback!\n2. You earned 75 coins from your last visit.\n3. Jay Medical Store is now open.'
          );
        }}
        onBackToQuickCommerce={handleBackToMainApp}
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
          userName={user?.fullName || 'Manish Shah'}
          userId="WM100258"
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
            <Text style={styles.sectionTitleText}>Nearby WOMUP Shops</Text>
          </View>

          {/* View on Map Pill Button */}
          <TouchableOpacity
            style={styles.viewOnMapBtn}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                'Map View',
                'Interactive Map loaded for Mahesana with 4 live partner locations.'
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
          {vendors.map((vendor) => (
            <ShopCard
              key={vendor.id}
              vendor={vendor}
              onPressShop={handleSelectShop}
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating QR Scanner Button */}
      <TouchableOpacity
        style={styles.floatingQRButton}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedVendor(vendors[0]);
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
});
