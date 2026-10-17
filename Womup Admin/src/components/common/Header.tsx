import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ArrowLeft, Layers, Menu, LogOut } from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack }) => {
  const { activeTab, setActiveTab, subView, setSubView, goBackSubView, toggleSidebar, logoutAdmin } = useAdminState();
  const [showApprovalsModal, setShowApprovalsModal] = React.useState(false);

  const isSubScreen = showBack || subView !== 'none';

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

  return (
    <LinearGradient colors={GRADIENTS.navyHeader} style={styles.container}>
      <View style={styles.content}>
        {isSubScreen ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft color={COLORS.white} size={22} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoRow} onPress={toggleSidebar} activeOpacity={0.8}>
            <Image
              source={require('../../../assets/womup_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
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
            onPress={() => setShowApprovalsModal(true)}
            accessibilityLabel="View Pending Approvals"
          >
            <Bell color={COLORS.white} size={20} />
            <View style={styles.badge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleSidebar}
          >
            <Menu color={COLORS.white} size={22} />
          </TouchableOpacity>
        </View>
      </View>

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
