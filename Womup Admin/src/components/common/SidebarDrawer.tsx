import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Modal,
  Image,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  LayoutDashboard,
  Users,
  Tag,
  Package,
  ShoppingBag,
  UserCheck,
  Megaphone,
  Coins,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Store,
  MapPin,
  Layers,
  FolderTree,
  Wallet,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../../theme';
import { useAdminState, ActiveTab, ActiveSubView } from '../../context/AdminStateContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.82), 340);

export const SidebarDrawer: React.FC = () => {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    activeTab,
    setActiveTab,
    subView,
    setSubView,
    locationSubTab,
    setLocationSubTab,
    adminUser,
    adminSponsorId,
    logoutAdmin,
  } = useAdminState();

  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSidebarOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [isSidebarOpen]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setIsSidebarOpen(false);
    });
  };

  const handleNavigateTab = (tab: ActiveTab) => {
    setSubView('none');
    setActiveTab(tab);
    handleClose();
  };

  const handleNavigateSubView = (sub: ActiveSubView) => {
    setSubView(sub);
    handleClose();
  };

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <Modal
      visible={isSidebarOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View style={styles.modalRoot}>
        {/* Animated Dark Backdrop Overlay (Press outside drawer to dismiss) */}
        <Animated.View style={[styles.backdropOverlay, { opacity: fadeAnim }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityLabel="Close Drawer"
          />
        </Animated.View>

        {/* Flex container holding Left-empty-space and Right-sliding-drawer */}
        <View style={styles.flexRowContainer} pointerEvents="box-none">
          {/* Left transparent area that captures outside taps */}
          <Pressable
            style={styles.leftDismissArea}
            onPress={handleClose}
            accessibilityLabel="Dismiss Sidebar Area"
          />

          {/* Slide-out Sidebar Content Panel */}
          <Animated.View
            style={[
              styles.drawerPanel,
              {
                width: DRAWER_WIDTH,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Top Branding Header */}
            <LinearGradient
              colors={GRADIENTS.navyHeader}
              style={[
                styles.drawerHeader,
                {
                  paddingTop: Math.max(
                    insets.top + (Platform.OS === 'android' ? 10 : 6),
                    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 40,
                  ),
                },
              ]}
            >
              <View style={styles.headerTop}>
                <View style={styles.brandRow}>
                  <Image
                    source={require('../../../assets/womup_logo.png')}
                    style={styles.logoBadge}
                    resizeMode="contain"
                  />
                  <Text style={styles.brandName}>Womup Admin</Text>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <X size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              {/* Admin User Profile Card */}
              <View style={styles.adminProfileCard}>
                <Image
                  source={require('../../../assets/womup_logo.png')}
                  style={styles.adminAvatar}
                  resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminName} numberOfLines={1}>
                    {adminUser?.name || 'SuperAdmin'}
                  </Text>
                  <Text style={styles.adminRole} numberOfLines={1}>
                    Sponsor: {adminSponsorId || 'WORMUP001'}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>ROOT</Text>
                </View>
              </View>
            </LinearGradient>

            {/* 100% Scrollable Navigation Container for Mobile & Web */}
            <View style={styles.scrollWrapper}>
              <ScrollView
                style={styles.menuScroll}
                contentContainerStyle={[
                  styles.menuContent,
                  { paddingBottom: Math.max(insets.bottom, 20) + 70 },
                ]}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                bounces={true}
                overScrollMode="always"
                scrollEventThrottle={16}
                removeClippedSubviews={false}
              >
                <Text style={styles.menuSectionTitle}>PRIMARY MODULES</Text>

                {/* 1. Dashboard */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Dashboard' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Dashboard')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Dashboard' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <LayoutDashboard
                      size={18}
                      color={
                        activeTab === 'Dashboard' && subView === 'none'
                          ? COLORS.white
                          : COLORS.purple
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Dashboard' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Dashboard & Telemetry
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 2. Pending Approvals Hub */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Approvals' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Approvals')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Approvals' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <ShieldCheck
                      size={18}
                      color={
                        activeTab === 'Approvals' && subView === 'none' ? COLORS.white : '#DC2626'
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Approvals' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    🛡️ Pending Approvals
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 3. Customer Management */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Users' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Users')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Users' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <Users
                      size={18}
                      color={
                        activeTab === 'Users' && subView === 'none' ? COLORS.white : COLORS.purple
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Users' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Customer Management
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 4. Area Dynamic Pricing */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Prices' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Prices')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Prices' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <Tag
                      size={18}
                      color={
                        activeTab === 'Prices' && subView === 'none' ? COLORS.white : COLORS.purple
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Prices' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Area Dynamic Pricing
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 5. Dark Store Inventory */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Inventory' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Inventory')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Inventory' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <Package
                      size={18}
                      color={
                        activeTab === 'Inventory' && subView === 'none'
                          ? COLORS.white
                          : COLORS.purple
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Inventory' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Dark Store Inventory
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 6. Live Orders */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Orders' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Orders')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Orders' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <ShoppingBag
                      size={18}
                      color={
                        activeTab === 'Orders' && subView === 'none' ? COLORS.white : COLORS.purple
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Orders' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Live Orders & 11 Stages
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 7. Staff Management */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Staff' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Staff')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Staff' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <UserCheck
                      size={18}
                      color={
                        activeTab === 'Staff' && subView === 'none' ? COLORS.white : COLORS.purple
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Staff' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Staff & Fleet Dispatch
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 8. Marketing */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Marketing' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Marketing')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Marketing' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <Megaphone
                      size={18}
                      color={
                        activeTab === 'Marketing' && subView === 'none'
                          ? COLORS.white
                          : COLORS.purple
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Marketing' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Marketing & Campaigns
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 9. Dark Stores & Hubs */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Stores' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Stores')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Stores' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <Store
                      size={18}
                      color={
                        activeTab === 'Stores' && subView === 'none' ? COLORS.white : COLORS.hotPink
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Stores' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Dark Stores & Hubs
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 10. Local Store Vendors */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Vendors' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Vendors')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Vendors' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <Coins
                      size={18}
                      color={
                        activeTab === 'Vendors' && subView === 'none' ? COLORS.white : '#D97706'
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Vendors' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Local Store Vendors
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 11. Cities & Operational Areas */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Locations' &&
                      locationSubTab !== 'Pincodes' &&
                      subView === 'none' &&
                      styles.menuItemActive,
                  ]}
                  onPress={() => {
                    setLocationSubTab('Cities');
                    handleNavigateTab('Locations');
                  }}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Locations' &&
                        locationSubTab !== 'Pincodes' &&
                        subView === 'none' &&
                        styles.iconActive,
                    ]}
                  >
                    <MapPin
                      size={18}
                      color={
                        activeTab === 'Locations' &&
                        locationSubTab !== 'Pincodes' &&
                        subView === 'none'
                          ? COLORS.white
                          : COLORS.success
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Locations' &&
                        locationSubTab !== 'Pincodes' &&
                        subView === 'none' &&
                        styles.menuLabelActive,
                    ]}
                  >
                    Cities & Operational Areas
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 12. GeoJSON Pincodes & Serviceability */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Locations' &&
                      locationSubTab === 'Pincodes' &&
                      subView === 'none' &&
                      styles.menuItemActive,
                  ]}
                  onPress={() => {
                    setLocationSubTab('Pincodes');
                    handleNavigateTab('Locations');
                  }}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Locations' &&
                        locationSubTab === 'Pincodes' &&
                        styles.iconActive,
                    ]}
                  >
                    <Layers
                      size={18}
                      color={
                        activeTab === 'Locations' && locationSubTab === 'Pincodes'
                          ? COLORS.white
                          : COLORS.purple
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Locations' &&
                        locationSubTab === 'Pincodes' &&
                        styles.menuLabelActive,
                    ]}
                  >
                    GeoJSON Pincodes & Serviceability
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 13. Categories & Subcategories */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Categories' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Categories')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Categories' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <FolderTree
                      size={18}
                      color={
                        activeTab === 'Categories' && subView === 'none'
                          ? COLORS.white
                          : COLORS.purple
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Categories' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Categories & Sub-Cats
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 14. Rider Per-KM Payout Rates */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'PayoutRates' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('PayoutRates')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'PayoutRates' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <Coins
                      size={18}
                      color={
                        activeTab === 'PayoutRates' && subView === 'none' ? COLORS.white : '#10B981'
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'PayoutRates' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Rider Payout Rates (Per-KM)
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 15. Wallets & Payment Revenue */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    activeTab === 'Wallets' && subView === 'none' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateTab('Wallets')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      activeTab === 'Wallets' && subView === 'none' && styles.iconActive,
                    ]}
                  >
                    <Wallet
                      size={18}
                      color={
                        activeTab === 'Wallets' && subView === 'none' ? COLORS.white : '#8B5CF6'
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      activeTab === 'Wallets' && subView === 'none' && styles.menuLabelActive,
                    ]}
                  >
                    Wallets & Revenue (3-Way)
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                <Text style={[styles.menuSectionTitle, { marginTop: SPACING.md }]}>
                  EXTENDED SYSTEMS
                </Text>

                {/* 16. Shopping Coin Ledger */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    subView === 'ShoppingCoin' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateSubView('ShoppingCoin')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      subView === 'ShoppingCoin' && styles.iconActive,
                    ]}
                  >
                    <Coins
                      size={18}
                      color={subView === 'ShoppingCoin' ? COLORS.white : COLORS.hotPink}
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      subView === 'ShoppingCoin' && styles.menuLabelActive,
                    ]}
                  >
                    Shopping Coin Ledger
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>

                {/* 17. Security Audit Logs */}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    subView === 'AuditLogs' && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigateSubView('AuditLogs')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[styles.iconContainer, subView === 'AuditLogs' && styles.iconActive]}
                  >
                    <ShieldCheck
                      size={18}
                      color={subView === 'AuditLogs' ? COLORS.white : COLORS.blue}
                    />
                  </View>
                  <Text
                    style={[styles.menuLabel, subView === 'AuditLogs' && styles.menuLabelActive]}
                  >
                    Security & Audit Logs
                  </Text>
                  <ChevronRight size={16} color={COLORS.secondaryText} />
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Fixed Footer Sign Out Button */}
            <View
              style={[
                styles.drawerFooter,
                { paddingBottom: Math.max(insets.bottom, 12) + (Platform.OS === 'android' ? 6 : 0) },
              ]}
            >
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  logoutAdmin();
                  handleClose();
                }}
                activeOpacity={0.8}
              >
                <LogOut size={16} color={COLORS.error} style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>Admin Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  flexRowContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftDismissArea: {
    flex: 1,
  },
  drawerPanel: {
    height: '100%',
    backgroundColor: COLORS.white,
    flexDirection: 'column',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    // Android elevation (without overflow: 'hidden' to prevent Android scroll gesture clipping)
    elevation: 20,
  },
  drawerHeader: {
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: RADIUS.card,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    marginRight: 8,
  },
  brandName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  adminProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: RADIUS.card,
    padding: SPACING.sm,
  },
  adminAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  adminName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  adminRole: {
    color: COLORS.lightPink,
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(34, 168, 107, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  statusBadgeText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '800',
  },
  scrollWrapper: {
    flex: 1,
    width: '100%',
  },
  menuScroll: {
    flex: 1,
    width: '100%',
  },
  menuContent: {
    paddingHorizontal: 10,
    paddingTop: 12,
    flexGrow: 1,
  },
  menuSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: RADIUS.card,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: COLORS.lightPink,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  iconActive: {
    backgroundColor: COLORS.hotPink,
  },
  menuLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuLabelActive: {
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  drawerFooter: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCECEE',
    paddingVertical: 10,
    borderRadius: RADIUS.input,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 13,
  },
});
