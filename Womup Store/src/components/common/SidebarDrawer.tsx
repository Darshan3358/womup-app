import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { COLORS } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.85);

export const SidebarDrawer: React.FC = () => {
  const {
    isSidebarOpen,
    setSidebarOpen,
    store,
    staff,
    setCurrentTab,
    setSubScreen,
    logout,
  } = useStore();

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Modals for secondary items
  const [activeModal, setActiveModal] = useState<'notifications' | 'settings' | 'help' | 'logoutConfirm' | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [autoCameraScan, setAutoCameraScan] = useState(true);

  useEffect(() => {
    if (isSidebarOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSidebarOpen, slideAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSidebarOpen(false);
    });
  };

  const handleNavigate = (action: () => void) => {
    handleClose();
    setTimeout(() => {
      action();
    }, 150);
  };

  const handleLogout = () => {
    setActiveModal('logoutConfirm');
  };

  // Clean Store Name
  let displayStoreName = store?.name || 'Prahlad Nagar Store';
  if (displayStoreName.startsWith('Wom Up ')) {
    displayStoreName = displayStoreName.slice(7).trim();
  }
  if (displayStoreName.length > 25 && displayStoreName.endsWith(' Dark Store')) {
    displayStoreName = displayStoreName.replace(/\s*Dark\s*Store$/i, '').trim();
  }

  // Picker Code
  const rawCode = staff?.employeeCode || store?.code || 'HUB-01';
  const cleanCode = rawCode.replace(/^STF-STORE-/, '').replace(/^STF-/, '');
  const pickerDisplay = cleanCode.length > 8 ? `#${cleanCode.slice(-4)}` : `#${cleanCode}`;
  const staffRole = staff?.role ? staff.role.replace(/_/g, ' ') : 'STORE ASSOCIATE';

  if (!isSidebarOpen) return null;

  return (
    <Modal
      visible={isSidebarOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Drawer Panel Sliding from Right */}
        <Animated.View
          style={[
            styles.drawerContainer,
            { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.storeInfoRow}>
              <View style={styles.storeIconContainer}>
                <Ionicons name="storefront" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.storeTextCol}>
                <Text style={styles.storeTitle} numberOfLines={1}>
                  {displayStoreName}
                </Text>
                <Text style={styles.pickerSubtitle}>
                  Picker: <Text style={styles.pickerCodeHighlight}>{pickerDisplay}</Text> · {staffRole}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Menu Items List */}
          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            {/* Stock & Inventory */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                handleNavigate(() => {
                  setSubScreen(null);
                  setCurrentTab('Inventory');
                })
              }
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="file-tray-stacked-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Stock & Inventory</Text>
                <Text style={styles.menuSubtitle}>Manage shelf locations & counts</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* Order History */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                handleNavigate(() => {
                  setSubScreen(null);
                  setCurrentTab('History');
                })
              }
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="time-outline" size={20} color="#10B981" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Order History</Text>
                <Text style={styles.menuSubtitle}>Delivered & fulfilled orders</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* My Profile */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                handleNavigate(() => {
                  setSubScreen(null);
                  setCurrentTab('Profile');
                })
              }
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(236, 74, 157, 0.15)' }]}>
                <Ionicons name="person-outline" size={20} color="#EC4A9D" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>My Profile</Text>
                <Text style={styles.menuSubtitle}>Staff info, shift schedule & ID</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* My Performance */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                handleNavigate(() => {
                  setSubScreen('Performance');
                })
              }
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="trending-up-outline" size={20} color="#F59E0B" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>My Performance</Text>
                <Text style={styles.menuSubtitle}>Pick speed, accuracy & metrics</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Notifications */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveModal('notifications')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="notifications-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Notifications</Text>
                <Text style={styles.menuSubtitle}>Dispatch alerts & announcements</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveModal('settings')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(100, 116, 139, 0.15)' }]}>
                <Ionicons name="settings-outline" size={20} color="#94A3B8" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Settings</Text>
                <Text style={styles.menuSubtitle}>Scan sound, haptics & terminal</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* Help & Support */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveModal('help')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#06B6D4" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Help & Support</Text>
                <Text style={styles.menuSubtitle}>Dark store SOPs & operations hotline</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>
          </ScrollView>

          {/* Footer: Sign Out */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Womup Dark Store v2.4.0 (Enterprise)</Text>
          </View>
        </Animated.View>
      </View>

      {/* Sub-Modal: Notifications */}
      {activeModal === 'notifications' && (
        <Modal transparent animationType="fade" visible={true} onRequestClose={() => setActiveModal(null)}>
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeader}>
                <Ionicons name="notifications" size={22} color="#8B5CF6" />
                <Text style={styles.dialogTitle}>Dark Store Notifications</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Ionicons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View style={styles.dialogBody}>
                <View style={styles.emptyNoticeBox}>
                  <Ionicons name="checkmark-circle-outline" size={36} color="#10B981" />
                  <Text style={styles.emptyNoticeTitle}>All Caught Up!</Text>
                  <Text style={styles.emptyNoticeDesc}>
                    There are no unread broadcast alerts. Incoming orders and rider handovers trigger real-time sound and banner alerts automatically.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Sub-Modal: Settings */}
      {activeModal === 'settings' && (
        <Modal transparent animationType="fade" visible={true} onRequestClose={() => setActiveModal(null)}>
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeader}>
                <Ionicons name="settings" size={22} color="#94A3B8" />
                <Text style={styles.dialogTitle}>Store Terminal Settings</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Ionicons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View style={styles.dialogBody}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Audio Alerts</Text>
                    <Text style={styles.settingSub}>Chime on new order & rider arrival</Text>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={setSoundEnabled}
                    trackColor={{ false: '#334155', true: COLORS.primary }}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Haptic Feedback</Text>
                    <Text style={styles.settingSub}>Vibrate upon successful barcode scan</Text>
                  </View>
                  <Switch
                    value={vibrationEnabled}
                    onValueChange={setVibrationEnabled}
                    trackColor={{ false: '#334155', true: COLORS.primary }}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Auto-Scan Camera</Text>
                    <Text style={styles.settingSub}>Instant capture without tapping button</Text>
                  </View>
                  <Switch
                    value={autoCameraScan}
                    onValueChange={setAutoCameraScan}
                    trackColor={{ false: '#334155', true: COLORS.primary }}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Sub-Modal: Help & Support (Wireframe Screen 18) */}
      {activeModal === 'help' && (
        <Modal transparent animationType="fade" visible={true} onRequestClose={() => setActiveModal(null)}>
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeader}>
                <Ionicons name="help-circle" size={22} color="#FF3B98" />
                <Text style={styles.dialogTitle}>Help & Support</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Ionicons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View style={styles.dialogBody}>
                {/* Hero Illustration */}
                <View style={{ alignItems: 'center', marginBottom: 14 }}>
                  <Image
                    source={require('../../../assets/store_support_hero.png')}
                    style={{ width: 88, height: 88 }}
                    resizeMode="contain"
                  />
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#071B52', marginTop: 4 }}>
                    How can we help you?
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 2 }}>
                    Our dedicated dark store support desk is active 24/7.
                  </Text>
                </View>

                {/* Support Option Rows */}
                <View style={styles.helpItem}>
                  <Text style={styles.helpLabel}>📖 FAQ</Text>
                  <Text style={styles.helpValue}>Find answers to common operational questions</Text>
                </View>

                <View style={styles.helpItem}>
                  <Text style={styles.helpLabel}>📞 Call Us (24/7 Toll-Free)</Text>
                  <Text style={styles.helpValue}>+91 98765 43210</Text>
                </View>

                <View style={styles.helpItem}>
                  <Text style={styles.helpLabel}>⚠️ Report an Issue</Text>
                  <Text style={styles.helpValue}>Device, scanner or network not working?</Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#FF3B98',
                    paddingVertical: 13,
                    borderRadius: 14,
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                  onPress={() => {
                    Alert.alert('Support Chat', 'Connecting with Central Dark Store Operations Desk...');
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>Chat Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Sub-Modal: Logout Confirmation */}
      {activeModal === 'logoutConfirm' && (
        <Modal transparent animationType="fade" visible={true} onRequestClose={() => setActiveModal(null)}>
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeader}>
                <Ionicons name="log-out" size={22} color="#EF4444" />
                <Text style={styles.dialogTitle}>Sign Out of Dark Store</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Ionicons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View style={styles.dialogBody}>
                <Text style={{ fontSize: 14, color: '#E2E8F0', lineHeight: 20, marginBottom: 8 }}>
                  Are you sure you want to end your session and sign out?
                </Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', lineHeight: 18, marginBottom: 20 }}>
                  You will be logged out of {store?.name || 'this dark store'} terminal and returned to the login screen.
                </Text>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      alignItems: 'center',
                    }}
                    onPress={() => setActiveModal(null)}
                  >
                    <Text style={{ color: '#E2E8F0', fontWeight: '600', fontSize: 13 }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: '#EF4444',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    onPress={async () => {
                      setActiveModal(null);
                      handleClose();
                      await logout();
                    }}
                  >
                    <Ionicons name="log-out-outline" size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Yes, Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawerContainer: {
    marginLeft: 'auto',
    height: '100%',
    backgroundColor: '#0A1449',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 20,
  },
  drawerHeader: {
    paddingHorizontal: 18,
    paddingTop: 45,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070D30',
  },
  storeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  storeIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(236, 74, 157, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(236, 74, 157, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  storeTextCol: {
    flex: 1,
  },
  storeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  pickerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  pickerCodeHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.1,
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 8,
    marginHorizontal: 4,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#070D30',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    paddingVertical: 11,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
  },
  // Dialog / Sub-modal styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  dialogTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  dialogBody: {
    padding: 16,
  },
  emptyNoticeBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyNoticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 10,
  },
  emptyNoticeDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  settingSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  helpItem: {
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  helpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  helpValue: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 18,
  },
});
