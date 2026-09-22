import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
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
  Settings,
  ChevronRight,
  LogOut,
  Store,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../../theme';
import { useAdminState, ActiveTab, ActiveSubView } from '../../context/AdminStateContext';

export const SidebarDrawer: React.FC = () => {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    activeTab,
    setActiveTab,
    subView,
    setSubView,
  } = useAdminState();

  const handleNavigateTab = (tab: ActiveTab) => {
    setSubView('none');
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const handleNavigateSubView = (sub: ActiveSubView) => {
    setSubView(sub);
    setIsSidebarOpen(false);
  };

  return (
    <Modal
      visible={isSidebarOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setIsSidebarOpen(false)}
      statusBarTranslucent={true}
    >
      <View style={styles.backdrop}>
        {/* Clickable Backdrop overlay covering full screen behind drawer */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={() => setIsSidebarOpen(false)}
          activeOpacity={1}
        />

        {/* Slide-out Sidebar Content Panel */}
        <SafeAreaView style={styles.safeDrawerArea}>
          <View style={styles.drawerPanel}>
            {/* Top Navy Branding Header */}
            <LinearGradient colors={GRADIENTS.navyHeader} style={styles.drawerHeader}>
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
                  onPress={() => setIsSidebarOpen(false)}
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
                  <Text style={styles.adminName}>Administrator</Text>
                  <Text style={styles.adminRole}>Super Administrator</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>ONLINE</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Navigation Items Scroll List */}
            <ScrollView
              style={styles.menuScroll}
              contentContainerStyle={styles.menuContent}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              bounces={true}
              overScrollMode="always"
            >
            <Text style={styles.menuSectionTitle}>PRIMARY MODULES</Text>

            {/* 1. Dashboard */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeTab === 'Dashboard' && subView === 'none' && styles.menuItemActive,
              ]}
              onPress={() => handleNavigateTab('Dashboard')}
            >
              <View style={[styles.iconContainer, activeTab === 'Dashboard' && subView === 'none' && styles.iconActive]}>
                <LayoutDashboard size={18} color={activeTab === 'Dashboard' && subView === 'none' ? COLORS.white : COLORS.purple} />
              </View>
              <Text style={[styles.menuLabel, activeTab === 'Dashboard' && subView === 'none' && styles.menuLabelActive]}>
                Dashboard & Telemetry
              </Text>
              <ChevronRight size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>

            {/* 2. Users */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeTab === 'Users' && subView === 'none' && styles.menuItemActive,
              ]}
              onPress={() => handleNavigateTab('Users')}
            >
              <View style={[styles.iconContainer, activeTab === 'Users' && subView === 'none' && styles.iconActive]}>
                <Users size={18} color={activeTab === 'Users' && subView === 'none' ? COLORS.white : COLORS.purple} />
              </View>
              <Text style={[styles.menuLabel, activeTab === 'Users' && subView === 'none' && styles.menuLabelActive]}>
                Customer Management
              </Text>
              <ChevronRight size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>

            {/* 3. Area Dynamic Pricing */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeTab === 'Prices' && subView === 'none' && styles.menuItemActive,
              ]}
              onPress={() => handleNavigateTab('Prices')}
            >
              <View style={[styles.iconContainer, activeTab === 'Prices' && subView === 'none' && styles.iconActive]}>
                <Tag size={18} color={activeTab === 'Prices' && subView === 'none' ? COLORS.white : COLORS.purple} />
              </View>
              <Text style={[styles.menuLabel, activeTab === 'Prices' && subView === 'none' && styles.menuLabelActive]}>
                Area Dynamic Pricing
              </Text>
              <ChevronRight size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>

            {/* 4. Dark Store Inventory */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeTab === 'Inventory' && subView === 'none' && styles.menuItemActive,
              ]}
              onPress={() => handleNavigateTab('Inventory')}
            >
              <View style={[styles.iconContainer, activeTab === 'Inventory' && subView === 'none' && styles.iconActive]}>
                <Package size={18} color={activeTab === 'Inventory' && subView === 'none' ? COLORS.white : COLORS.purple} />
              </View>
              <Text style={[styles.menuLabel, activeTab === 'Inventory' && subView === 'none' && styles.menuLabelActive]}>
                Dark Store Inventory
              </Text>
              <ChevronRight size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>

            {/* 5. Live Orders */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeTab === 'Orders' && subView === 'none' && styles.menuItemActive,
              ]}
              onPress={() => handleNavigateTab('Orders')}
            >
              <View style={[styles.iconContainer, activeTab === 'Orders' && subView === 'none' && styles.iconActive]}>
                <ShoppingBag size={18} color={activeTab === 'Orders' && subView === 'none' ? COLORS.white : COLORS.purple} />
              </View>
              <Text style={[styles.menuLabel, activeTab === 'Orders' && subView === 'none' && styles.menuLabelActive]}>
                Live Orders & 11 Stages
              </Text>
              <ChevronRight size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>

            {/* 6. Staff Management */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeTab === 'Staff' && subView === 'none' && styles.menuItemActive,
              ]}
              onPress={() => handleNavigateTab('Staff')}
            >
              <View style={[styles.iconContainer, activeTab === 'Staff' && subView === 'none' && styles.iconActive]}>
                <UserCheck size={18} color={activeTab === 'Staff' && subView === 'none' ? COLORS.white : COLORS.purple} />
              </View>
              <Text style={[styles.menuLabel, activeTab === 'Staff' && subView === 'none' && styles.menuLabelActive]}>
                Staff & Fleet Dispatch
              </Text>
              <ChevronRight size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>

            {/* 7. Marketing */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeTab === 'Marketing' && subView === 'none' && styles.menuItemActive,
              ]}
              onPress={() => handleNavigateTab('Marketing')}
            >
              <View style={[styles.iconContainer, activeTab === 'Marketing' && subView === 'none' && styles.iconActive]}>
                <Megaphone size={18} color={activeTab === 'Marketing' && subView === 'none' ? COLORS.white : COLORS.purple} />
              </View>
              <Text style={[styles.menuLabel, activeTab === 'Marketing' && subView === 'none' && styles.menuLabelActive]}>
                Marketing & Campaigns
              </Text>
              <ChevronRight size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>

            {/* 8. Dark Stores & Hubs */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeTab === 'Stores' && subView === 'none' && styles.menuItemActive,
              ]}
              onPress={() => handleNavigateTab('Stores')}
            >
              <View style={[styles.iconContainer, activeTab === 'Stores' && subView === 'none' && styles.iconActive]}>
                <Store size={18} color={activeTab === 'Stores' && subView === 'none' ? COLORS.white : COLORS.hotPink} />
              </View>
              <Text style={[styles.menuLabel, activeTab === 'Stores' && subView === 'none' && styles.menuLabelActive]}>
                Dark Stores & Hubs
              </Text>
              <ChevronRight size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>

            <Text style={[styles.menuSectionTitle, { marginTop: SPACING.md }]}>
              EXTENDED SYSTEMS
            </Text>

            {/* 8. Shopping Coin Ledger */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                subView === 'ShoppingCoin' && styles.menuItemActive,
              ]}
              onPress={() => handleNavigateSubView('ShoppingCoin')}
            >
              <View style={[styles.iconContainer, subView === 'ShoppingCoin' && styles.iconActive]}>
                <Coins size={18} color={subView === 'ShoppingCoin' ? COLORS.white : COLORS.hotPink} />
              </View>
              <Text style={[styles.menuLabel, subView === 'ShoppingCoin' && styles.menuLabelActive]}>
                Shopping Coin Ledger
              </Text>
              <ChevronRight size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>

            {/* 9. Security Audit Logs */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                subView === 'AuditLogs' && styles.menuItemActive,
              ]}
              onPress={() => handleNavigateSubView('AuditLogs')}
            >
              <View style={[styles.iconContainer, subView === 'AuditLogs' && styles.iconActive]}>
                <ShieldCheck size={18} color={subView === 'AuditLogs' ? COLORS.white : COLORS.blue} />
              </View>
              <Text style={[styles.menuLabel, subView === 'AuditLogs' && styles.menuLabelActive]}>
                Security & Audit Logs
              </Text>
              <ChevronRight size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>
          </ScrollView>

            {/* Footer Logout Button */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.logoutBtn} onPress={() => setIsSidebarOpen(false)}>
                <LogOut size={16} color={COLORS.error} style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>Admin Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  safeDrawerArea: {
    width: '82%',
    maxWidth: 320,
    height: '100%',
  },
  drawerPanel: {
    flex: 1,
    backgroundColor: COLORS.white,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
    overflow: 'hidden',
  },
  drawerHeader: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 45,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: RADIUS.card,
    borderBottomRightRadius: RADIUS.card,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 18,
  },
  brandName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  adminProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.card,
    padding: SPACING.sm,
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  statusBadge: {
    backgroundColor: 'rgba(34, 168, 107, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  statusBadgeText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '800',
  },
  menuScroll: {
    flex: 1,
    flexShrink: 1,
  },
  menuContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  menuSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
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
  },
  iconActive: {
    backgroundColor: COLORS.hotPink,
  },
  menuLabel: {
    flex: 1,
    fontSize: 13,
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
