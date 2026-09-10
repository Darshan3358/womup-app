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
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from './AppIcon';
import { useApp } from '../../context/AppContext';
import { LocationService, DetectedLocation } from '../../services/locationService';
import { AddressService } from '../../services/addressService';
import { StorageService } from '../../services/storageService';

export const LocationPickerModal: React.FC = () => {
  const {
    isLocationModalVisible,
    setLocationModalVisible,
    deliveryLocation,
    setDeliveryLocation,
    user,
    setUser,
    selectedAddress,
    setSelectedAddress,
    setActiveScreen,
    setCurrentArea,
  } = useApp();

  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<DetectedLocation | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);

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

    const shortLabel = loc.shortAddress || loc.readableAddress;
    const locationString = `Current Location — ${shortLabel}`;
    setDeliveryLocation(locationString);

    const addressObj = {
      id: `current_${Date.now()}`,
      type: 'Current' as const,
      fullName: user.fullName || 'Customer',
      phoneNumber: user.phoneNumber || '',
      houseFlat: loc.street || 'Current GPS Location',
      areaLandmark: loc.areaLandmark || loc.shortAddress,
      city: loc.city || 'Ahmedabad',
      pincode: loc.pincode || '380015',
      latitude: loc.latitude,
      longitude: loc.longitude,
      isDefault: true,
    };

    setSelectedAddress(addressObj);
    setLocationModalVisible(false);

    // Immediately resolve area for area-based product pricing
    LocationService.resolveArea(loc.latitude, loc.longitude).then((area) => {
      if (area) setCurrentArea(area.areaId, area.areaName);
    });

    // Save to Database (MongoDB Atlas) in background
    try {
      await AddressService.saveAddress({
        type: 'Current',
        fullName: addressObj.fullName,
        phoneNumber: addressObj.phoneNumber,
        houseFlat: addressObj.houseFlat,
        areaLandmark: addressObj.areaLandmark,
        city: addressObj.city,
        pincode: addressObj.pincode,
        latitude: addressObj.latitude,
        longitude: addressObj.longitude,
        isDefault: true,
      });

      // Refresh user saved addresses
      const liveAddresses = await AddressService.getAddresses();
      if (liveAddresses && liveAddresses.length > 0) {
        const updatedProfile = { ...user, savedAddresses: liveAddresses };
        setUser(updatedProfile);
        StorageService.saveItem(StorageService.KEYS.USER, updatedProfile);
      }
    } catch (e) {
      console.warn('[LocationPickerModal] Background address save warning:', e);
    }
  };

  // Real database saved addresses for the user
  const savedAddrs = user.savedAddresses || [];

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
            {/* 📍 1. REAL-TIME CURRENT GPS LOCATION CARD (HIGHLIGHTED) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSelectCurrentLocation()}
              style={[
                styles.currentLocationCard,
                deliveryLocation.startsWith('Current Location') && styles.activeCard,
              ]}
            >
              <View style={styles.currentLocHeader}>
                <View style={styles.gpsIconCircle}>
                  <AppIcon name="map-pin" size={20} color="#15803D" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.currentLocTitle}>Use Current Location</Text>
                    {isDetecting ? (
                      <View style={styles.detectingBadge}>
                        <ActivityIndicator size="small" color="#15803D" style={{ transform: [{ scale: 0.7 }] }} />
                        <Text style={styles.detectingText}>Detecting GPS…</Text>
                      </View>
                    ) : currentLocation ? (
                      <View style={styles.gpsActiveBadge}>
                        <View style={styles.greenDot} />
                        <Text style={styles.gpsActiveText}>Live GPS</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Detected Address Details */}
                  {isDetecting ? (
                    <Text style={styles.currentLocSubtitle}>
                      Fetching precise coordinates from device GPS…
                    </Text>
                  ) : currentLocation ? (
                    <View>
                      <Text style={styles.currentLocAddress} numberOfLines={2}>
                        {currentLocation.readableAddress}
                      </Text>
                      <Text style={styles.coordsText}>
                        Lat: {currentLocation.latitude.toFixed(4)}, Lng: {currentLocation.longitude.toFixed(4)}
                      </Text>
                    </View>
                  ) : detectionError ? (
                    <Text style={styles.errorLocSubtitle}>{detectionError}. Tap to retry.</Text>
                  ) : (
                    <Text style={styles.currentLocSubtitle}>
                      Tap to detect device real-time GPS location
                    </Text>
                  )}
                </View>
              </View>

              {/* Action Buttons inside Current Location */}
              <View style={styles.currentLocActionRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAutoDetectLocation();
                  }}
                  style={styles.refreshLocBtn}
                >
                  <AppIcon name="sparkles" size={14} color="#15803D" />
                  <Text style={styles.refreshLocText}>Redetect GPS</Text>
                </TouchableOpacity>

                {currentLocation && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleSelectCurrentLocation()}
                    style={styles.deliverHereBtn}
                  >
                    <Text style={styles.deliverHereText}>Deliver Here ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

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
                const formatted = `${addr.houseFlat}, ${addr.areaLandmark ? addr.areaLandmark + ', ' : ''}${addr.city}`;
                const isSelected =
                  deliveryLocation.includes(formatted) ||
                  (selectedAddress && selectedAddress.id === addr.id);

                const getIconName = () => {
                  if (label === 'Home') return 'home';
                  if (label === 'Work') return 'user';
                  return 'map-pin';
                };

                return (
                  <TouchableOpacity
                    key={addr.id || formatted}
                    activeOpacity={0.7}
                    onPress={() => {
                      setDeliveryLocation(`${label} — ${formatted}`);
                      setSelectedAddress(addr);
                      if (addr.latitude && addr.longitude) {
                        LocationService.resolveArea(addr.latitude, addr.longitude).then((area) => {
                          if (area) setCurrentArea(area.areaId, area.areaName);
                        });
                      }
                      setLocationModalVisible(false);
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
