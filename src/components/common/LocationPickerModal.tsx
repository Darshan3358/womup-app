import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from './AppIcon';
import { useApp } from '../../context/AppContext';
import { LocationService, DetectedLocation, ResolvedArea } from '../../services/locationService';
import { AddressService } from '../../services/addressService';
import { StorageService } from '../../services/storageService';
import { matchAreaByName } from '../../data/areas';

export const LocationPickerModal: React.FC = () => {
  const {
    isLocationModalVisible,
    setLocationModalVisible,
    deliveryLocation,
    setDeliveryLocation,
    user,
    setUser,
    selectedAddress,
    selectedAddressId,
    selectedAddressSource,
    setActiveDeliveryAddress,
    setActiveGpsLocation,
    setSelectedAddress,
    setActiveScreen,
    setCurrentArea,
    setCurrentStore,
    setCurrentCityName,
    setIsServiceable,
    setDeliveryEtaMinutes,
    currentStoreName,
    deliveryEtaMinutes,
  } = useApp();

  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<DetectedLocation | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [gpsResolvedArea, setGpsResolvedArea] = useState<ResolvedArea | null>(null);
  const [isResolvingArea, setIsResolvingArea] = useState<boolean>(false);

  // Auto-detect GPS location whenever the modal opens
  useEffect(() => {
    if (isLocationModalVisible) {
      handleAutoDetectLocation();
    }
  }, [isLocationModalVisible]);

  const handleAutoDetectLocation = async () => {
    setIsDetecting(true);
    setDetectionError(null);
    try {
      const loc = await LocationService.getCurrentLocation();
      if (loc) {
        setCurrentLocation(loc);
        setIsResolvingArea(true);
        try {
          const resolved = await LocationService.resolveArea(loc.latitude, loc.longitude, false);
          setGpsResolvedArea(resolved);
        } catch (resErr) {
          console.warn('[LocationPickerModal] Background resolveArea notice:', resErr);
        } finally {
          setIsResolvingArea(false);
        }
      } else {
        setDetectionError('Permission required or location unavailable');
      }
    } catch (err: any) {
      console.warn('[LocationPickerModal] Detection failed:', err);
      setDetectionError('Unable to detect real-time GPS');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectCurrentLocation = async (locToUse?: DetectedLocation) => {
    const loc = locToUse || currentLocation;
    if (!loc) {
      handleAutoDetectLocation();
      return;
    }

    setLocationModalVisible(false);
    // GPS location is used strictly as the active delivery location for this session/order.
    // It is NEVER auto-saved into permanent Saved Addresses unless explicitly saved by user.
    await setActiveGpsLocation(loc);
  };

  // Real database saved addresses for the user (exclude temporary GPS markers and deduplicate)
  const savedAddrs = (user.savedAddresses || [])
    .filter((a) => a.type !== 'Current' && !a.id?.startsWith('current_'))
    .filter((a, idx, arr) => 
      arr.findIndex((other) => 
        (a.id && other.id && (a.id === other.id || (a as any)._id === (other as any)._id)) ||
        (a.houseFlat?.trim().toLowerCase() === other.houseFlat?.trim().toLowerCase() && 
         a.areaLandmark?.trim().toLowerCase() === other.areaLandmark?.trim().toLowerCase() &&
         a.city?.trim().toLowerCase() === other.city?.trim().toLowerCase())
      ) === idx
    );

  const handleDeleteAddress = (addrId: string, label: string, targetAddr?: any) => {
    const performDelete = async () => {
      try {
        const currentList = user.savedAddresses || [];
        const updated = currentList.filter((a) => {
          const aId = a.id || (a as any)._id;
          if (addrId) {
            return aId !== addrId;
          }
          if (targetAddr) {
            return (
              a.houseFlat !== targetAddr.houseFlat ||
              a.city !== targetAddr.city
            );
          }
          return true;
        });

        const updatedProfile = { ...user, savedAddresses: updated };
        setUser(updatedProfile);
        await StorageService.saveItem(StorageService.KEYS.USER, updatedProfile);

        const currentSelectedId = selectedAddress?.id || (selectedAddress as any)?._id;
        if (currentSelectedId === addrId) {
          if (updated.length > 0) {
            const nextAddr = updated[0];
            setSelectedAddress(nextAddr);
            setDeliveryLocation(`${nextAddr.type} — ${nextAddr.houseFlat}, ${nextAddr.city}`);
          } else {
            setSelectedAddress(null as any);
            setDeliveryLocation('Select Delivery Location');
          }
        }

        // Notify backend in background if valid ID exists
        if (addrId && !addrId.startsWith('current_')) {
          try {
            await AddressService.deleteAddress(addrId);
          } catch (apiErr) {
            console.warn('[LocationPickerModal] Backend deleteAddress notice:', apiErr);
          }
        }
      } catch (e) {
        console.error('[LocationPickerModal] Delete address error:', e);
      }
    };

    const confirmMessage = `Are you sure you want to remove "${label}" from your saved addresses?`;

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' ? window.confirm(confirmMessage) : true;
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert('Remove Address', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: performDelete,
        },
      ]);
    }
  };

  return (
    <Modal
      visible={isLocationModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setLocationModalVisible(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setLocationModalVisible(false)}
        style={styles.backdrop}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Choose delivery location</Text>
              <Text style={styles.subtitle}>Select your location for 9-minute delivery</Text>
            </View>
            <TouchableOpacity
              onPress={() => setLocationModalVisible(false)}
              style={styles.closeBtn}
              accessibilityLabel="Close"
            >
              <AppIcon name="x" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollList}>
            {/* 📍 1. REAL-TIME CURRENT GPS LOCATION CARD (3-STATE HONEST GPS) */}
            {(() => {
              const isGpsApplied = selectedAddressSource === 'GPS';

              const isGpsServiceable = gpsResolvedArea
                ? gpsResolvedArea.serviceable !== false
                : true;

              const isFarOrFallback = Boolean(
                gpsResolvedArea &&
                  gpsResolvedArea.distanceKm &&
                  gpsResolvedArea.distanceKm > 2.5
              );

              const servingStore = gpsResolvedArea?.storeName || (isGpsApplied ? currentStoreName : (isDetecting ? 'Detecting store…' : 'Wom Up Dark Store'));
              const distanceDisplay = gpsResolvedArea?.distanceKm ? `${gpsResolvedArea.distanceKm} km` : null;
              const etaMinutes = gpsResolvedArea?.deliveryMinutes || (isGpsApplied ? deliveryEtaMinutes : 9);

              return (
                <View
                  style={[
                    styles.currentLocationCard,
                    isGpsApplied && styles.activeCard,
                    !isGpsServiceable && styles.unserviceableCard,
                  ]}
                >
                  <View style={styles.currentLocHeader}>
                    <View
                      style={[
                        styles.gpsIconCircle,
                        !isGpsServiceable && { backgroundColor: '#FEE2E2' },
                        !isGpsApplied && isGpsServiceable && { backgroundColor: '#E0F2FE' },
                      ]}
                    >
                      <AppIcon
                        name="map-pin"
                        size={20}
                        color={!isGpsServiceable ? '#DC2626' : !isGpsApplied ? '#0284C7' : '#15803D'}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.currentLocTitle}>Current Device Location</Text>

                        {/* BADGE: 3 HONEST STATES */}
                        {isDetecting ? (
                          <View style={styles.detectingBadge}>
                            <ActivityIndicator
                              size="small"
                              color="#15803D"
                              style={{ transform: [{ scale: 0.7 }] }}
                            />
                            <Text style={styles.detectingText}>Detecting GPS…</Text>
                          </View>
                        ) : isResolvingArea ? (
                          <View style={styles.checkingBadge}>
                            <ActivityIndicator
                              size="small"
                              color="#0284C7"
                              style={{ transform: [{ scale: 0.7 }] }}
                            />
                            <Text style={styles.checkingBadgeText}>Checking Store…</Text>
                          </View>
                        ) : currentLocation ? (
                          !isGpsServiceable ? (
                            /* State 3: Not Serviceable */
                            <View style={styles.outsideZoneBadge}>
                              <Ionicons name="warning-outline" size={12} color="#DC2626" />
                              <Text style={styles.outsideZoneText}>Not Serviceable</Text>
                            </View>
                          ) : isGpsApplied ? (
                            /* State 1: Matched & Applied */
                            <View style={styles.gpsActiveBadge}>
                              <View style={styles.greenDot} />
                              <Text style={styles.gpsActiveText}>Live GPS ✓</Text>
                            </View>
                          ) : (
                            /* State 2: Detected, Not Yet Applied */
                            <View style={styles.gpsDetectedBadge}>
                              <Ionicons name="compass-outline" size={13} color="#0284C7" />
                              <Text style={styles.gpsDetectedText}>GPS Detected</Text>
                            </View>
                          )
                        ) : null}
                      </View>

                      {/* Detected Address Details */}
                      {isDetecting ? (
                        <Text style={styles.currentLocSubtitle}>
                          Fetching high-accuracy coordinates from device GPS…
                        </Text>
                      ) : currentLocation ? (
                        <View>
                          <Text style={styles.currentLocAddress} numberOfLines={2}>
                            {currentLocation.readableAddress}
                          </Text>
                          <Text style={styles.coordsText}>
                            Lat: {currentLocation.latitude.toFixed(4)}, Lng: {currentLocation.longitude.toFixed(4)}
                          </Text>

                          {/* State Context Message */}
                          {!isGpsServiceable ? (
                            <View style={styles.warningBox}>
                              <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
                              <Text style={styles.warningBoxText}>
                                Wom Up 9-minute delivery is not yet available at your GPS location. Please select a saved address.
                              </Text>
                            </View>
                          ) : gpsResolvedArea ? (
                            <View
                              style={[
                                styles.storeInfoBox,
                                isFarOrFallback ? styles.fallbackStoreBox : styles.matchedStoreBox,
                              ]}
                            >
                              <Ionicons
                                name={isFarOrFallback ? 'information-circle-outline' : 'checkmark-circle-outline'}
                                size={14}
                                color={isFarOrFallback ? '#0369A1' : '#15803D'}
                              />
                              <Text
                                style={[
                                  styles.storeInfoText,
                                  isFarOrFallback ? { color: '#0369A1' } : { color: '#166534' },
                                ]}
                              >
                                {isFarOrFallback
                                  ? `Serving Hub: ${servingStore}${distanceDisplay ? ` (${distanceDisplay} away)` : ''} · ETA ${etaMinutes} mins`
                                  : `Serving Hub: ${servingStore} · Delivery in ${etaMinutes} mins`}
                              </Text>
                            </View>
                          ) : null}

                          {!isGpsApplied && isGpsServiceable && (
                            <Text style={styles.unappliedHintText}>
                              Tap "Deliver Here" below to use this GPS location for delivery.
                            </Text>
                          )}
                        </View>
                      ) : detectionError ? (
                        <Text style={styles.errorLocSubtitle}>
                          {detectionError}. Tap Redetect to retry.
                        </Text>
                      ) : (
                        <Text style={styles.currentLocSubtitle}>
                          Tap to detect device real-time GPS location
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.currentLocActionRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        LocationService.clearCache();
                        handleAutoDetectLocation();
                      }}
                      style={styles.refreshLocBtn}
                    >
                      <AppIcon name="sparkles" size={14} color="#15803D" />
                      <Text style={styles.refreshLocText}>Redetect GPS</Text>
                    </TouchableOpacity>

                    {currentLocation && isGpsServiceable ? (
                      isGpsApplied ? (
                        <View style={styles.alreadyActiveBtn}>
                          <AppIcon name="check" size={13} color="#15803D" />
                          <Text style={styles.alreadyActiveText}>Delivering Here ✓</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleSelectCurrentLocation()}
                          style={styles.deliverHereBtn}
                        >
                          <Text style={styles.deliverHereText}>Deliver Here ✓</Text>
                        </TouchableOpacity>
                      )
                    ) : null}
                  </View>
                </View>
              );
            })()}

            {/* SECTION DIVIDER: SAVED ADDRESSES */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>
              <Text style={styles.savedCountText}>
                {savedAddrs.length} {savedAddrs.length === 1 ? 'address' : 'addresses'}
              </Text>
            </View>

            {/* User Saved Addresses from Database */}
            {savedAddrs.length > 0 ? (
              savedAddrs.map((addr) => {
                const label = addr.type;
                const addrId = addr.id || (addr as any)._id;
                const formatted = `${addr.houseFlat}, ${addr.areaLandmark ? addr.areaLandmark + ', ' : ''}${addr.city}`;
                const isSelected = selectedAddressSource === 'SAVED' && Boolean(
                  (selectedAddressId && addrId && (selectedAddressId === addrId || String(selectedAddressId) === String(addrId))) ||
                  (selectedAddress && (
                    (selectedAddress.id && (selectedAddress.id === addrId || String(selectedAddress.id) === String(addrId))) ||
                    ((selectedAddress as any)._id && ((selectedAddress as any)._id === addrId || String((selectedAddress as any)._id) === String(addrId))) ||
                    (selectedAddress.type === addr.type && selectedAddress.houseFlat === addr.houseFlat)
                  ))
                );

                const getIconName = () => {
                  if (label === 'Home') return 'home';
                  if (label === 'Work') return 'user';
                  return 'map-pin';
                };

                return (
                  <TouchableOpacity
                    key={addrId || formatted}
                    activeOpacity={0.7}
                    onPress={async () => {
                      console.log(`[LocationPickerModal] User selected saved address: id=${addrId}, label=${label}, coords=[${addr.latitude}, ${addr.longitude}]`);
                      setLocationModalVisible(false);
                      await setActiveDeliveryAddress(addr);
                    }}
                    style={[styles.savedItem, isSelected && styles.savedItemActive]}
                  >
                    <View style={styles.savedItemLeft}>
                      <View
                        style={[
                          styles.savedIconCircle,
                          isSelected && { backgroundColor: '#DCFCE7' },
                        ]}
                      >
                        <AppIcon
                          name={getIconName()}
                          size={18}
                          color={isSelected ? '#15803D' : COLORS.textPrimary}
                        />
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text
                          style={[
                            styles.savedItemLabel,
                            isSelected && { color: '#15803D', fontWeight: '700' },
                          ]}
                        >
                          {label}
                        </Text>
                        <Text style={styles.savedItemText} numberOfLines={2}>
                          {formatted}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.savedItemRight}>
                      {isSelected && (
                        <View style={styles.checkedCircle}>
                          <AppIcon name="check" size={14} color={COLORS.white} />
                        </View>
                      )}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        onPress={(e: any) => {
                          e?.stopPropagation?.();
                          const targetId = addr.id || (addr as any)._id || '';
                          handleDeleteAddress(targetId, label, addr);
                        }}
                        style={styles.deleteAddrBtn}
                        accessibilityLabel="Delete address"
                      >
                        <AppIcon name="trash" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noSavedContainer}>
                <Text style={styles.noSavedText}>
                  No saved addresses in your account yet. Use Current Location above or add a new address below.
                </Text>
              </View>
            )}

            {/* ➕ Add New Address Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setLocationModalVisible(false);
                setActiveScreen('C11_AddAddress');
              }}
              style={styles.addNewBtn}
            >
              <AppIcon name="plus" size={18} color="#15803D" />
              <Text style={styles.addNewText}>Add New Address</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    maxHeight: 460,
  },

  // ── CURRENT GPS LOCATION CARD ──
  currentLocationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    padding: 14,
    marginBottom: 18,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  activeCard: {
    borderColor: '#15803D',
    backgroundColor: '#DCFCE7',
  },
  currentLocHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  gpsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  currentLocTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14532D',
  },
  detectingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  detectingText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
  gpsActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
  },
  gpsActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  currentLocSubtitle: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
  currentLocAddress: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
    marginTop: 2,
  },
  coordsText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  errorLocSubtitle: {
    fontSize: 12,
    color: '#DC2626',
  },
  currentLocActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(134, 239, 172, 0.5)',
  },
  refreshLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshLocText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  checkingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  checkingBadgeText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  gpsDetectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  gpsDetectedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  outsideZoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  outsideZoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  unserviceableCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F8',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  warningBoxText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
    lineHeight: 15,
  },
  storeInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
  },
  fallbackStoreBox: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  matchedStoreBox: {
    backgroundColor: 'rgba(21, 128, 61, 0.08)',
    borderColor: 'rgba(21, 128, 61, 0.25)',
  },
  storeInfoText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  unappliedHintText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  alreadyActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alreadyActiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  deliverHereBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deliverHereText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },

  // ── SECTION HEADER ──
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  savedCountText: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // ── SAVED ADDRESSES ──
  savedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: COLORS.white,
  },
  savedItemActive: {
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
  },
  savedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  savedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  savedItemText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  savedItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteAddrBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSavedContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  noSavedText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'center',
  },

  // ── ADD NEW ADDRESS ──
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
    marginTop: 8,
    marginBottom: 10,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
});
