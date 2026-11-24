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
import { api } from '../../services/api';
import { getDynamicAreas, syncAreasFromBackend, AreaOption } from '../../data/areas';

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

  const [areas, setAreas] = useState<AdminArea[]>(() => {
    const dynamic = getDynamicAreas();
    return dynamic.map((d) => ({
      id: d.id || d.storeId || 'sanand',
      name: d.name,
      cityName: d.city || 'Ahmedabad',
      pincode: d.pincode,
      deliveryMinutes: 9,
      darkStoreName: d.storeName || `${d.name} Dark Store`,
      hubStoreId: d.storeId,
      isActive: true,
    }));
  });
  const [loadingAreas, setLoadingAreas] = useState(false);

  const [activeCity, setActiveCity] = useState<string>(
    currentSelectedCity || currentCityName || 'Ahmedabad'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Fetch real database areas and dark stores whenever modal becomes visible
  useEffect(() => {
    let isMounted = true;
    async function fetchDatabaseAreas() {
      if (!visible) return;
      setLoadingAreas(true);
      try {
        // 1. Fetch live areas from backend MongoDB
        const res = await api.get<any>('/location/areas');
        const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

        if (isMounted && rawList.length > 0) {
          // Only include areas that are active and have an active registered dark store
          const mapped: AdminArea[] = rawList
            .filter((a: any) => a && a.isActive !== false)
            .map((a: any) => {
              const storeName =
                a.assignedStore?.storeName ||
                a.darkStore ||
                (a.assignedStores && a.assignedStores[0]?.storeName) ||
                `${a.name} Dark Store`;
              const storeId =
                a.assignedStore?.storeId ||
                a.hubStoreId ||
                (a.assignedStores && a.assignedStores[0]?.storeId);

              return {
                id: a.id || (a._id?.toString ? a._id.toString() : String(a._id || '')),
                name: a.name,
                cityName: a.cityName || a.city || 'Ahmedabad',
                cityId: a.cityId?.toString ? a.cityId.toString() : a.cityId,
                pincode: (Array.isArray(a.pincodes) && a.pincodes[0]) || a.pincode || '',
                deliveryMinutes: a.defaultDeliveryMinutes || 9,
                darkStoreName: storeName,
                hubStoreId: storeId,
                isActive: a.isActive !== false,
              };
            });

          if (mapped.length > 0) {
            setAreas(mapped);
            if (mapped[0]?.cityName) {
              setActiveCity((prev) => prev || mapped[0].cityName);
            }
            return;
          }
        }
      } catch (e) {
        console.warn('[CityAreaDropdownModal] Error loading database areas:', e);
      } finally {
        if (isMounted) setLoadingAreas(false);
      }

      // 2. Fallback to synced storage
      try {
        const synced = await syncAreasFromBackend();
        if (isMounted && synced.length > 0) {
          setAreas(
            synced.map((d) => ({
              id: d.id || d.storeId || 'sanand',
              name: d.name,
              cityName: d.city || 'Ahmedabad',
              pincode: d.pincode,
              deliveryMinutes: 9,
              darkStoreName: d.storeName,
              hubStoreId: d.storeId,
              isActive: true,
            }))
          );
        }
      } catch (_) {}
    }

    fetchDatabaseAreas();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setActiveCity(currentSelectedCity || currentCityName || 'Ahmedabad');
      setSearchQuery('');
    }
  }, [visible, currentSelectedCity, currentCityName]);

  // Dynamic cities derived exclusively from active database areas
  const adminCities: AdminCity[] = useMemo(() => {
    const cityMap = new Map<string, number>();
    areas.forEach((a) => {
      const c = a.cityName || 'Ahmedabad';
      cityMap.set(c, (cityMap.get(c) || 0) + 1);
    });

    if (cityMap.size === 0) {
      return [{ id: 'ahm', name: 'Ahmedabad', code: 'AHM', isActive: true, zoneCount: 1 }];
    }

    return Array.from(cityMap.entries()).map(([name, count]) => ({
      id: name.toLowerCase(),
      name,
      code: name.substring(0, 3).toUpperCase(),
      isActive: count > 0,
      zoneCount: count,
    }));
  }, [areas]);

  // Filtered areas from database for the currently active city or search query
  const filteredAreas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return areas.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.cityName.toLowerCase().includes(q) ||
          (a.pincode && a.pincode.includes(q))
      );
    }
    return areas.filter(
      (a) => a.cityName.toLowerCase() === activeCity.toLowerCase()
    );
  }, [areas, activeCity, searchQuery]);

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
          const match = areas.find(
            (a) => a.name.toLowerCase() === resolved.areaName.toLowerCase()
          );
          if (match) {
            handleSelectArea(match);
            return;
          }
        }
      }
      if (areas.length > 0) {
        handleSelectArea(areas[0]);
      }
    } catch {
      if (areas.length > 0) {
        handleSelectArea(areas[0]);
      }
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
            {adminCities.map((city) => {
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
