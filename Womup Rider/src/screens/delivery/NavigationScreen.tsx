import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { RiderNavigationMap } from '../../components/RiderNavigationMap';
import { RiderChatModal } from '../../components/modals/RiderChatModal';

interface NavigationScreenProps {
  onBack?: () => void;
  modeOverride?: 'PICKUP' | 'DELIVERY';
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({
  onBack,
  modeOverride,
}) => {
  const {
    activeDelivery,
    advanceStep,
    setShowOtpModal,
    setSubScreen,
    currentLocation,
    profile,
  } = useRider();

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Determine mode based on active delivery step
  const stepStatus = activeDelivery?.stepStatus || 'GOING_TO_STORE';
  const mode: 'PICKUP' | 'DELIVERY' =
    modeOverride ||
    (stepStatus === 'OUT_FOR_DELIVERY' || stepStatus === 'ARRIVED_AT_CUSTOMER'
      ? 'DELIVERY'
      : 'PICKUP');

  // Coordinates directly from LocationCoordinates
  const riderLat = currentLocation?.latitude || 23.1188;
  const riderLng = currentLocation?.longitude || 72.5467;
  const riderHeading = currentLocation?.heading || 0;

  // Target coordinates
  const storeLat = activeDelivery?.storeCoordinates?.latitude || 23.1128;
  const storeLng = activeDelivery?.storeCoordinates?.longitude || 72.5427;
  const custLat = activeDelivery?.customerCoordinates?.latitude || 23.1288;
  const custLng = activeDelivery?.customerCoordinates?.longitude || 72.5507;

  const targetCoords = mode === 'PICKUP'
    ? { latitude: storeLat, longitude: storeLng }
    : { latitude: custLat, longitude: custLng };

  const targetName = mode === 'PICKUP'
    ? (activeDelivery?.storeName || 'Wom Up Chandlodiya - Tragad Dark Store')
    : (activeDelivery?.customerName || 'Darshan Thanki');

  const targetAddress = mode === 'PICKUP'
    ? (activeDelivery?.storeAddress || 'Shop 10-14, Ground Floor, Shukan Hub')
    : (activeDelivery?.customerAddress || 'Customer Doorstep, Chandlodiya');

  const distanceKm = activeDelivery?.distanceKm || (mode === 'PICKUP' ? 1.2 : 2.4);

  const durationMinutes = Math.max(2, Math.round((distanceKm / 20) * 60));

  const handleOpenGoogleMaps = () => {
    const lat = targetCoords.latitude;
    const lng = targetCoords.longitude;
    const label = encodeURIComponent(targetName);

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });

    Linking.openURL(url!).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('Phone Number', 'Phone number not available');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call', `Please dial: ${phone}`);
    });
  };

  const handleArrivedAction = async () => {
    if (mode === 'PICKUP') {
      await advanceStep('ARRIVED_AT_STORE');
      if (onBack) onBack();
    } else {
      await advanceStep('ARRIVED_AT_CUSTOMER');
      setShowOtpModal(true);
      if (onBack) onBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack ? onBack : () => setSubScreen('None')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            {mode === 'PICKUP' ? 'Pickup Navigation' : 'Delivery Navigation'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Order #{activeDelivery?.orderNumber || 'WORM-744177-600'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleOpenGoogleMaps}
          activeOpacity={0.7}
          accessibilityLabel="Open External Maps"
        >
          <Ionicons name="navigate-circle-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Live Navigation Map (60% Screen Height) */}
        <RiderNavigationMap
          mode={mode}
          riderCoords={{ latitude: riderLat, longitude: riderLng }}
          riderHeading={riderHeading}
          targetCoords={targetCoords}
          targetName={targetName}
          targetAddress={targetAddress}
          distanceKm={distanceKm}
          durationMinutes={durationMinutes}
          height={380}
        />

        {/* Turn / Route ETA Card */}
        <View style={styles.etaCard}>
          <View style={styles.etaIconCircle}>
            <Ionicons
              name={mode === 'PICKUP' ? 'storefront' : 'home'}
              size={22}
              color={mode === 'PICKUP' ? '#2563EB' : '#10B981'}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.etaTitle}>
              {mode === 'PICKUP' ? 'Head to Dark Store' : 'Head to Customer Doorstep'}
            </Text>
            <Text style={styles.etaValue}>
              {distanceKm} km  •  {durationMinutes} mins remaining
            </Text>
          </View>
          <View style={styles.fastRoutePill}>
            <Ionicons name="flash" size={12} color="#F59E0B" />
            <Text style={styles.fastRouteText}>FASTEST ROUTE</Text>
          </View>
        </View>

        {/* Target Details Card */}
        <View style={styles.targetCard}>
          <View style={styles.targetCardHeader}>
            <View style={[styles.targetBadge, { backgroundColor: mode === 'PICKUP' ? '#EFF6FF' : '#ECFDF5' }]}>
              <Ionicons
                name={mode === 'PICKUP' ? 'business' : 'person'}
                size={14}
                color={mode === 'PICKUP' ? '#2563EB' : '#059669'}
              />
              <Text style={[styles.targetBadgeText, { color: mode === 'PICKUP' ? '#1D4ED8' : '#047857' }]}>
                {mode === 'PICKUP' ? 'PICKUP LOCATION' : 'DELIVERY DESTINATION'}
              </Text>
            </View>
          </View>

          <Text style={styles.targetNameText}>{targetName}</Text>
          <Text style={styles.targetAddressText}>{targetAddress}</Text>

          {/* Quick Contact & Navigation Action Buttons */}
          <View style={styles.actionsRow}>
            {mode === 'PICKUP' ? (
              <>
                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  onPress={() => handleCall(activeDelivery?.storePhone || '079-4567890')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={15} color="#2563EB" />
                  <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Call Store</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtnOutline, { borderColor: '#10B981' }]}
                  onPress={handleOpenGoogleMaps}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={15} color="#059669" />
                  <Text style={[styles.actionBtnText, { color: '#059669' }]}>Google Maps</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  onPress={() => handleCall(activeDelivery?.customerPhone || '9876543210')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={15} color="#2563EB" />
                  <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtnOutline, { borderColor: '#8B5CF6' }]}
                  onPress={() => setIsChatModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubble-ellipses" size={15} color="#7C3AED" />
                  <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtnOutline, { borderColor: '#10B981' }]}
                  onPress={handleOpenGoogleMaps}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={15} color="#059669" />
                  <Text style={[styles.actionBtnText, { color: '#059669' }]}>Maps</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Primary Bottom Action Button */}
        <TouchableOpacity
          style={[styles.primaryActionBtn, { backgroundColor: mode === 'PICKUP' ? '#2563EB' : '#10B981' }]}
          onPress={handleArrivedAction}
          activeOpacity={0.88}
        >
          <Ionicons
            name={mode === 'PICKUP' ? 'checkmark-circle' : 'shield-checkmark'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.primaryActionText}>
            {mode === 'PICKUP'
              ? '✅ I HAVE ARRIVED AT STORE'
              : '✅ I HAVE ARRIVED AT CUSTOMER'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Customer Chat Modal */}
      {isChatModalOpen && activeDelivery && (
        <RiderChatModal
          visible={isChatModalOpen}
          orderId={activeDelivery.id}
          orderNumber={activeDelivery.orderNumber || ''}
          customerName={activeDelivery.customerName || 'Customer'}
          customerPhone={activeDelivery.customerPhone}
          riderId={profile?.id || 'RIDER-01'}
          riderName={profile?.name || 'Rider'}
          onClose={() => setIsChatModalOpen(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  refreshBtn: {
    padding: 4,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  etaCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  etaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  etaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  fastRoutePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  fastRouteText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
  },
  targetCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  targetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  targetAddressText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
