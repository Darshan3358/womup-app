import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ArrowLeft, Layers, Menu, LogOut } from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { AdminNotificationModal } from './AdminNotificationModal';
import { adminNotificationService } from '../../services/adminNotificationService';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack }) => {
  const { activeTab, setActiveTab, subView, setSubView, goBackSubView, toggleSidebar, logoutAdmin } = useAdminState();
  const [showApprovalsModal, setShowApprovalsModal] = React.useState(false);
  const [showNotificationModal, setShowNotificationModal] = React.useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const count = await adminNotificationService.getUnreadCount();
        if (mounted) setAdminUnreadCount(count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // 30s fallback check
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isSubScreen = showBack || subView !== 'none';
  const isDashboard = activeTab === 'Dashboard' && !isSubScreen;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (subView !== 'none') {
      goBackSubView();
    }
  };

  const handleNavigateQueue = (tabName: any) => {
    setShowApprovalsModal(false);
    setActiveTab(tabName);
  };

  if (isDashboard) {
    return (
      <View style={styles.dashboardContainer}>
        <View style={styles.content}>
          {/* Left Brand Identity: Logo + WomUp + Admin Panel */}
          <TouchableOpacity style={styles.dashboardBrandRow} onPress={toggleSidebar} activeOpacity={0.8}>
            <View style={styles.logoBadgeContainer}>
              <Image
                source={require('../../../assets/Wormup.png')}
                style={styles.dashboardLogoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.dashboardBrandTextCol}>
              <Text style={styles.dashboardBrandName}>WomUp</Text>
              <Text style={styles.dashboardBrandSub}>Admin Panel</Text>
            </View>
          </TouchableOpacity>

          {/* Right Action Buttons: Bell with Badge + Hamburger Menu */}
          <View style={styles.dashboardActionRow}>
            <TouchableOpacity
              style={styles.dashboardIconButton}
              onPress={() => setShowNotificationModal(true)}
              accessibilityLabel="Notifications"
            >
              <Bell color="#111044" size={20} strokeWidth={2.2} />
              {adminUnreadCount > 0 ? (
                <View style={styles.dashboardBadgePill}>
                  <Text style={styles.dashboardBadgeText}>{adminUnreadCount > 99 ? '99+' : adminUnreadCount}</Text>
                </View>
              ) : (
                <View style={styles.dashboardBadgeDot} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dashboardIconButton}
              onPress={toggleSidebar}
              accessibilityLabel="Open navigation menu"
            >
              <Menu color="#111044" size={22} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>

        <AdminNotificationModal
          visible={showNotificationModal}
          onClose={() => {
            setShowNotificationModal(false);
            adminNotificationService.getUnreadCount().then(setAdminUnreadCount).catch(() => {});
          }}
        />
      </View>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.navyHeader} style={styles.container}>
      <View style={styles.content}>
        {isSubScreen ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft color={COLORS.white} size={22} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoRow} onPress={toggleSidebar} activeOpacity={0.8}>
            <View style={styles.logoBadgeContainer}>
              <Image
                source={require('../../../assets/Wormup.png')}
                style={styles.dashboardLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>Womup</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.screenTitle}>
          {title || (subView !== 'none' ? subView : activeTab)}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: 'rgba(239, 68, 68, 0.18)' }]}
            onPress={logoutAdmin}
            accessibilityLabel="Admin Sign Out"
          >
            <LogOut color="#EF4444" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowNotificationModal(true)}
            accessibilityLabel="View Admin Notifications"
          >
            <Bell color={COLORS.white} size={20} />
            {adminUnreadCount > 0 ? (
              <View style={[styles.badge, styles.badgePill]}>
                <Text style={styles.badgeText}>{adminUnreadCount > 99 ? '99+' : adminUnreadCount}</Text>
              </View>
            ) : (
              <View style={styles.badge} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleSidebar}
          >
            <Menu color={COLORS.white} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <AdminNotificationModal
        visible={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false);
          adminNotificationService.getUnreadCount().then(setAdminUnreadCount).catch(() => {});
        }}
      />

      {/* APPROVALS QUEUE MODAL */}
      <Modal
        visible={showApprovalsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowApprovalsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowApprovalsModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🔔 Pending Approvals Queue</Text>
                <Text style={styles.modalSubtitle}>8 Approval workflows requiring admin sign-off</Text>
              </View>
              <TouchableOpacity onPress={() => setShowApprovalsModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.queueList}>
              <TouchableOpacity style={styles.queueItem} onPress={() => handleNavigateQueue('Customers')}>
                <Text style={styles.queueItemTitle}>👥 Customer KYC</Text>
                <View style={[styles.queueCountBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.queueCountText, { color: '#1D4ED8' }]}>45 pending</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.queueItem} onPress={() => handleNavigateQueue('Staff')}>
                <Text style={styles.queueItemTitle}>🛵 Rider Applications</Text>
                <View style={[styles.queueCountBadge, { backgroundColor: '#F0FDFA' }]}>
                  <Text style={[styles.queueCountText, { color: '#0D9488' }]}>8 pending</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.queueItem} onPress={() => handleNavigateQueue('Stores')}>
                <Text style={styles.queueItemTitle}>🏪 Dark Stores</Text>
                <View style={[styles.queueCountBadge, { backgroundColor: '#FFFBEB' }]}>
                  <Text style={[styles.queueCountText, { color: '#D97706' }]}>3 pending</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.queueItem} onPress={() => handleNavigateQueue('Vendors')}>
                <Text style={styles.queueItemTitle}>🏪 Local Vendors</Text>
                <View style={[styles.queueCountBadge, { backgroundColor: '#F5F3FF' }]}>
                  <Text style={[styles.queueCountText, { color: '#7C3AED' }]}>12 pending</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.queueItem} onPress={() => handleNavigateQueue('Wallets')}>
                <Text style={styles.queueItemTitle}>💰 Wallet Withdrawals</Text>
                <View style={[styles.queueCountBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.queueCountText, { color: '#059669' }]}>15 pending</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.queueItem} onPress={() => handleNavigateQueue('Orders')}>
                <Text style={styles.queueItemTitle}>📦 Order Cancellations</Text>
                <View style={[styles.queueCountBadge, { backgroundColor: '#FEF2F2' }]}>
                  <Text style={[styles.queueCountText, { color: '#DC2626' }]}>6 pending</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.queueItem} onPress={() => handleNavigateQueue('Staff')}>
                <Text style={styles.queueItemTitle}>👤 Staff (Pickers)</Text>
                <View style={[styles.queueCountBadge, { backgroundColor: '#F8FAFC' }]}>
                  <Text style={[styles.queueCountText, { color: '#475569' }]}>5 pending</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.queueItem} onPress={() => handleNavigateQueue('PayoutRates')}>
                <Text style={styles.queueItemTitle}>📢 Payout Rate Changes</Text>
                <View style={[styles.queueCountBadge, { backgroundColor: '#FFF0F7' }]}>
                  <Text style={[styles.queueCountText, { color: '#FF3B98' }]}>2 pending</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  dashboardContainer: {
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F8F4FF',
  },
  dashboardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadgeContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#25105F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardLogoImage: {
    width: 27,
    height: 27,
  },
  dashboardBrandTextCol: {
    justifyContent: 'center',
  },
  dashboardBrandName: {
    color: '#111044',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  dashboardBrandSub: {
    color: '#565477',
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  dashboardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dashboardIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E7D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#762DEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
  },
  dashboardBadgePill: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  dashboardBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  dashboardBadgeDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  container: {
    paddingTop: Platform.OS === 'android' ? 10 : 8,
    paddingBottom: 12,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: RADIUS.card,
    borderBottomRightRadius: RADIUS.card,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 8,
  },
  brandTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  screenTitle: {
    color: COLORS.lightPink,
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    marginLeft: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.hotPink,
  },
  badgePill: {
    top: 2,
    right: 2,
    width: 'auto',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 27, 82, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4,
    fontWeight: '700',
  },
  queueList: {
    gap: 8,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queueItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#071B52',
  },
  queueCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  queueCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
