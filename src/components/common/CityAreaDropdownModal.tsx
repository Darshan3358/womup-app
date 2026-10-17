import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { useApp } from '../../context/AppContext';
import { LocationService } from '../../services/locationService';

export interface AdminCity {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  zoneCount: number;
}

export interface AdminArea {
  id: string;
  name: string;
  cityName: string;
  cityId?: string;
  pincode?: string;
  deliveryMinutes: number;
  darkStoreName?: string;
  hubStoreId?: string;
  isActive: boolean;
}

// 🏛️ ADMIN-VERIFIED CITIES (Strictly no unapproved/unverified cities like Mesana)
const ADMIN_CITIES: AdminCity[] = [
  { id: '6abcefe75a521a988d799c02', name: 'Ahmedabad', code: 'AHM', isActive: true, zoneCount: 11 },
  { id: '6abcefe75a521a988d799c03', name: 'Surat', code: 'SUR', isActive: true, zoneCount: 2 },
  { id: '6abcefe75a521a988d799c04', name: 'Vadodara', code: 'BDQ', isActive: false, zoneCount: 0 },
  { id: '6abcefe75a521a988d799c05', name: 'Rajkot', code: 'RAJ', isActive: false, zoneCount: 0 },
  { id: '6abcefe75a521a988d799c06', name: 'Gandhinagar', code: 'GNR', isActive: false, zoneCount: 0 },
];

// 📍 ADMIN-CONFIGURED SERVICEABLE AREAS
const ADMIN_AREAS: AdminArea[] = [
  // Ahmedabad Zones
  { id: '6aac257b8f337240651ef43c', name: 'Chandlodiya - Tragad', cityName: 'Ahmedabad', pincode: '382481', deliveryMinutes: 9, darkStoreName: 'Chandlodiya Dark Store', hubStoreId: '6aac257b8f337240651ef43b', isActive: true },
  { id: '6aa11866c6c3e5984e2ef5e0', name: 'Prahlad Nagar', cityName: 'Ahmedabad', pincode: '380015', deliveryMinutes: 9, darkStoreName: 'Prahlad Nagar Dark Store', hubStoreId: '6aa277a7fc02997cbe281ac2', isActive: true },
  { id: '6aa11866c6c3e5984e2ef5e5', name: 'Thaltej', cityName: 'Ahmedabad', pincode: '380054', deliveryMinutes: 8, darkStoreName: 'Thaltej Dark Store', hubStoreId: '6aa277a8fc02997cbe281ac7', isActive: true },
  { id: '6a9ffe87d4a21fe082fbbe2d', name: 'Satellite', cityName: 'Ahmedabad', pincode: '380015', deliveryMinutes: 10, darkStoreName: 'Satellite Dark Store', hubStoreId: '6aa277a7fc02997cbe281ac1', isActive: true },
  { id: '6aa11866c6c3e5984e2ef5e1', name: 'Navrangpura', cityName: 'Ahmedabad', pincode: '380009', deliveryMinutes: 9, darkStoreName: 'Navrangpura Dark Store', hubStoreId: '6aa277a7fc02997cbe281ac3', isActive: true },
  { id: '6aa11866c6c3e5984e2ef5e3', name: 'Bopal', cityName: 'Ahmedabad', pincode: '380058', deliveryMinutes: 12, darkStoreName: 'Bopal Dark Store', hubStoreId: '6aa277a7fc02997cbe281ac5', isActive: true },
  { id: '6aa11866c6c3e5984e2ef5e4', name: 'SG Highway', cityName: 'Ahmedabad', pincode: '380054', deliveryMinutes: 10, darkStoreName: 'SG Highway Dark Store', hubStoreId: '6aa277a8fc02997cbe281ac6', isActive: true },
  { id: '6aa279407dab7debc8348c16', name: 'Vastrapur', cityName: 'Ahmedabad', pincode: '380015', deliveryMinutes: 10, darkStoreName: 'Vastrapur Dark Store', hubStoreId: '6aa27940fc02997cbe281af6', isActive: true },
  { id: '6aa11866c6c3e5984e2ef5e2', name: 'Ghatlodia', cityName: 'Ahmedabad', pincode: '380061', deliveryMinutes: 11, darkStoreName: 'Ghatlodia Dark Store', hubStoreId: '6aa277a7fc02997cbe281ac4', isActive: true },
  { id: '6abcf767c486687900e11ef4', name: 'Paldi', cityName: 'Ahmedabad', pincode: '380007', deliveryMinutes: 9, darkStoreName: 'Central Dark Store', hubStoreId: '6a9ffe87d4a21fe082fbbe2c', isActive: true },
  { id: '6abcf767c486687900e11ef3', name: 'Maninagar', cityName: 'Ahmedabad', pincode: '380008', deliveryMinutes: 9, darkStoreName: 'Maninagar Dark Store', hubStoreId: '6ac36432ccb04b37e676d731', isActive: true },

  // Surat Zones
  { id: '6ac36432ccb04b37e676d732', name: 'Vesu', cityName: 'Surat', pincode: '395007', deliveryMinutes: 10, darkStoreName: 'Vesu Dark Store', hubStoreId: '6ac36432ccb04b37e676d733', isActive: true },
  { id: '6ac36432ccb04b37e676d734', name: 'Adajan', cityName: 'Surat', pincode: '395009', deliveryMinutes: 10, darkStoreName: 'Adajan Dark Store', hubStoreId: '6ac36432ccb04b37e676d735', isActive: true },
];

interface CityAreaDropdownModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectArea?: (area: AdminArea) => void;
  currentSelectedCity?: string;
  currentSelectedArea?: string;
}

export const CityAreaDropdownModal: React.FC<CityAreaDropdownModalProps> = ({
  visible,
  onClose,
  onSelectArea,
  currentSelectedCity = 'Ahmedabad',
  currentSelectedArea,
}) => {
  const insets = useSafeAreaInsets();
  const {
    currentCityName,
    setCurrentCityName,
    currentAreaName,
    setCurrentArea,
    setCurrentStore,
    setDeliveryLocation,
    setDeliveryEtaMinutes,
    setIsServiceable,
  } = useApp();

  const [activeCity, setActiveCity] = useState<string>(
    currentSelectedCity || currentCityName || 'Ahmedabad'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  useEffect(() => {
    if (visible) {
      setActiveCity(currentSelectedCity || currentCityName || 'Ahmedabad');
      setSearchQuery('');
    }
  }, [visible, currentSelectedCity, currentCityName]);

  // Filtered areas for the currently active city or global search
  const filteredAreas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return ADMIN_AREAS.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.cityName.toLowerCase().includes(q) ||
          (a.pincode && a.pincode.includes(q))
      );
    }
    return ADMIN_AREAS.filter(
      (a) => a.cityName.toLowerCase() === activeCity.toLowerCase()
    );
  }, [activeCity, searchQuery]);

  const handleSelectArea = (area: AdminArea) => {
    setCurrentCityName(area.cityName);
    setCurrentArea(area.id, area.name);
    if (area.hubStoreId) {
      setCurrentStore(area.hubStoreId, area.darkStoreName || null);
    }
    setDeliveryLocation(`${area.name}, ${area.cityName}`);
    setDeliveryEtaMinutes(area.deliveryMinutes);
    setIsServiceable(area.isActive);

    if (onSelectArea) {
      onSelectArea(area);
    }
    onClose();
  };

  const handleAutoDetect = async () => {
    setIsDetectingGps(true);
    try {
      const loc = await LocationService.getCurrentLocation();
      if (loc) {
        const resolved = await LocationService.resolveArea(loc.latitude, loc.longitude, true);
        if (resolved) {
          const match = ADMIN_AREAS.find(
            (a) => a.name.toLowerCase() === resolved.areaName.toLowerCase()
          );
          if (match) {
            handleSelectArea(match);
            return;
          }
        }
      }
      // Default to Chandlodiya, Ahmedabad
      const fallback = ADMIN_AREAS[0];
      handleSelectArea(fallback);
    } catch {
      const fallback = ADMIN_AREAS[0];
      handleSelectArea(fallback);
    } finally {
      setIsDetectingGps(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Sheet Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="location" size={20} color="#E11D48" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Select Delivery City & Zone</Text>
                <Text style={styles.sheetSubtitle}>Admin-verified serviceable areas only</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close location picker"
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search area, landmark or pincode..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* GPS Location Button */}
          <TouchableOpacity
            style={styles.gpsBanner}
            onPress={handleAutoDetect}
            disabled={isDetectingGps}
            activeOpacity={0.8}
          >
            <View style={styles.gpsIconCircle}>
              {isDetectingGps ? (
                <ActivityIndicator size="small" color="#E11D48" />
              ) : (
                <Ionicons name="navigate" size={18} color="#E11D48" />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.gpsTitle}>Use Current Location</Text>
              <Text style={styles.gpsSub}>Auto-detect GPS coordinates via satellite</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Admin Cities Selector (Horizontal Tabs) */}
          <Text style={styles.sectionHeaderLabel}>OFFICIAL ADMIN CITIES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cityTabsContainer}
          >
            {ADMIN_CITIES.map((city) => {
              const isSelected = activeCity.toLowerCase() === city.name.toLowerCase() && !searchQuery;
              return (
                <TouchableOpacity
                  key={city.id}
                  style={[
                    styles.cityTab,
                    isSelected && styles.cityTabSelected,
                    !city.isActive && styles.cityTabDisabled,
                  ]}
                  onPress={() => {
                    if (city.isActive) {
                      setActiveCity(city.name);
                      setSearchQuery('');
                    }
                  }}
                  activeOpacity={city.isActive ? 0.75 : 1}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name="business"
                      size={15}
                      color={isSelected ? '#FFFFFF' : city.isActive ? '#1E293B' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.cityNameText,
                        isSelected && styles.cityNameSelected,
                        !city.isActive && styles.cityNameDisabled,
                      ]}
                    >
                      {city.name}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cityBadge,
                      isSelected
                        ? { backgroundColor: 'rgba(255,255,255,0.25)' }
                        : city.isActive
                        ? { backgroundColor: '#F1F5F9' }
                        : { backgroundColor: '#F8FAFC' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cityBadgeText,
                        isSelected ? { color: '#FFFFFF' } : city.isActive ? { color: '#166534' } : { color: '#94A3B8' },
                      ]}
                    >
                      {city.isActive ? `${city.zoneCount} Zones` : 'Coming Soon'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Areas List */}
          <View style={styles.areasHeaderRow}>
            <Text style={styles.sectionHeaderLabel}>
              {searchQuery ? `SEARCH RESULTS (${filteredAreas.length})` : `SERVICEABLE AREAS IN ${activeCity.toUpperCase()} (${filteredAreas.length})`}
            </Text>
            <Text style={styles.guaranteeTag}>⚡ 9-11 Min Quick Delivery</Text>
          </View>

          <ScrollView
            style={styles.areasListScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {filteredAreas.length > 0 ? (
              filteredAreas.map((area) => {
                const isSelected =
                  (currentSelectedArea && currentSelectedArea.toLowerCase() === area.name.toLowerCase()) ||
                  (currentAreaName && currentAreaName.toLowerCase() === area.name.toLowerCase());

                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[styles.areaCard, isSelected && styles.areaCardSelected]}
                    onPress={() => handleSelectArea(area)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.areaPinCircle, isSelected && styles.areaPinCircleSelected]}>
                      <Ionicons
                        name="location-sharp"
                        size={18}
                        color={isSelected ? '#FFFFFF' : '#E11D48'}
                      />
                    </View>

                    <View style={styles.areaInfoCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.areaNameText, isSelected && styles.areaNameSelected]}>
                          {area.name}
                        </Text>
                        {area.pincode && (
                          <View style={styles.pincodeBadge}>
                            <Text style={styles.pincodeText}>{area.pincode}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.areaMetaRow}>
                        <Ionicons name="storefront" size={12} color="#64748B" />
                        <Text style={styles.darkStoreText} numberOfLines={1}>
                          {area.darkStoreName || 'Womup Hub'}
                        </Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Ionicons name="flash" size={12} color="#D97706" />
                        <Text style={styles.etaText}>{area.deliveryMinutes} mins</Text>
                      </View>
                    </View>

                    <View style={styles.areaRightAction}>
                      {isSelected ? (
                        <View style={styles.selectedCheckCircle}>
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.selectRadioOuter} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyAreaBox}>
                <Ionicons name="alert-circle-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyAreaTitle}>No Areas Found</Text>
                <Text style={styles.emptyAreaDesc}>
                  Service is currently active across Ahmedabad and Surat. We do not operate in unapproved regions like Mesana.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '88%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  gpsIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },
  gpsSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cityTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  cityTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cityTabSelected: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cityTabDisabled: {
    opacity: 0.55,
  },
  cityNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  cityNameSelected: {
    color: '#FFFFFF',
  },
  cityNameDisabled: {
    color: '#94A3B8',
  },
  cityBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  areasHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  guaranteeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  areasListScroll: {
    maxHeight: 320,
  },
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  areaCardSelected: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  areaPinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaPinCircleSelected: {
    backgroundColor: '#E11D48',
  },
  areaInfoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  areaNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  areaNameSelected: {
    color: '#E11D48',
  },
  pincodeBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  pincodeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  areaMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  darkStoreText: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 130,
  },
  metaDot: {
    color: '#94A3B8',
    fontSize: 11,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  areaRightAction: {
    marginLeft: 4,
  },
  selectRadioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  selectedCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAreaBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyAreaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptyAreaDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
