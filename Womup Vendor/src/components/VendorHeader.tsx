import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Store, QrCode, Bell, ShieldCheck } from 'lucide-react-native';
import { COLORS, GRADIENTS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';

export const VendorHeader: React.FC = () => {
  const { vendor, setIsQRModalVisible, pendingRequests, refreshData, toggleStoreOnline } = useVendor();
  const [isToggling, setIsToggling] = React.useState(false);
  const isOnline = vendor?.isOnline !== false && vendor?.isOpenNow !== false;

  const handleToggleOnline = async () => {
    if (isToggling) return;
    setIsToggling(true);
    await toggleStoreOnline();
    setIsToggling(false);
  };

  return (
    <LinearGradient colors={GRADIENTS.navyHeader} style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <View style={styles.logoPill}>
            <Store size={18} color={COLORS.white} />
          </View>
          <View>
            <View style={styles.storeNameRow}>
              <Text style={styles.storeName}>{vendor?.storeName || 'Vendor Store'}</Text>
              <TouchableOpacity
                style={[styles.onlineBadge, !isOnline && styles.offlineBadge]}
                onPress={handleToggleOnline}
                activeOpacity={0.7}
                disabled={isToggling}
              >
                <View style={[styles.greenDot, !isOnline && styles.redDot]} />
                <Text style={[styles.onlineText, !isOnline && styles.offlineText]}>
                  {isToggling ? '...' : isOnline ? 'Online' : 'Offline'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.vendorCode}>
              ID: {vendor?.vendorCode || 'VND001'} • {vendor?.categoryName} • {vendor?.city}
            </Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          {/* Quick Counter QR Button */}
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => setIsQRModalVisible(true)}
            activeOpacity={0.8}
          >
            <QrCode size={18} color={COLORS.white} />
            <Text style={styles.qrButtonText}>Counter QR</Text>
          </TouchableOpacity>

          {/* Real Notification Bell with Pending Badge */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => refreshData()}
            activeOpacity={0.8}
            accessibilityLabel="Refresh Pending Requests"
          >
            <Bell size={18} color={COLORS.white} />
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  offlineBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  redDot: {
    backgroundColor: '#EF4444',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  offlineText: {
    color: '#EF4444',
  },
  vendorCode: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.rose,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  qrButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.navy,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
