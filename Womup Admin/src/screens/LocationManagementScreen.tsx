import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Building2,
  Store,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  X,
  ArrowRight,
  Check,
  Lock,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { CityItem, Zone } from '../types/admin';
import { ApiService } from '../services/api';

export const LocationManagementScreen: React.FC = () => {
  const {
    cities,
    selectedCity,
    setSelectedCity,
    zones,
    darkStores,
    addCity,
    updateCity,
    deleteCity,
    deleteAreaSafe,
    refreshFromDb,
    setActiveTab,
  } = useAdminState();

  // Active Main Tab: 'Cities' or 'Areas'
  const [activeSubTab, setActiveSubTab] = useState<'Cities' | 'Areas'>('Cities');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('All');
  const [storeStatusFilter, setStoreStatusFilter] = useState<'All' | 'Assigned' | 'Available'>('All');

  // City Modal State
  const [showCityModal, setShowCityModal] = useState(false);
  const [editingCity, setEditingCity] = useState<CityItem | null>(null);
  const [cityName, setCityName] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [cityState, setCityState] = useState('Gujarat');
  const [cityStatus, setCityStatus] = useState<'Active' | 'Inactive'>('Active');
  const [citySubmitting, setCitySubmitting] = useState(false);

  // Area Modal State
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Zone | null>(null);
  const [areaName, setAreaName] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [areaCityId, setAreaCityId] = useState('');
  const [areaSla, setAreaSla] = useState('9');
  const [areaRadius, setAreaRadius] = useState('3.5');
  const [areaLat, setAreaLat] = useState('23.0225');
  const [areaLng, setAreaLng] = useState('72.5714');
  const [areaPincodes, setAreaPincodes] = useState('380015');
  const [areaSubmitting, setAreaSubmitting] = useState(false);

  // Calculate Metrics
  const totalCities = cities.length;
  const activeCitiesCount = cities.filter((c) => c.status === 'Active' || !c.status).length;
  const totalAreas = zones.length;
  const assignedAreasCount = zones.filter((z) => {
    if (z.hasActiveStore) return true;
    const zIdStr = z.id || z._id;
    return darkStores.some((s) => {
      if (s.areaId && zIdStr && String(s.areaId) === String(zIdStr)) return true;
      if (s.areaName && z.name && s.areaName.toLowerCase() === z.name.toLowerCase()) return true;
      return false;
    });
  }).length;
  const availableAreasCount = Math.max(0, totalAreas - assignedAreasCount);

  // Filtered Cities
  const filteredCities = useMemo(() => {
    return cities.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.state || '').toLowerCase().includes(q)
      );
    });
  }, [cities, searchQuery]);

  // Filtered Areas
  const filteredAreas = useMemo(() => {
    return zones.filter((z) => {
      const zIdStr = z.id || z._id;
      const isAssigned =
        z.hasActiveStore ||
        darkStores.some((s) => {
          if (s.areaId && zIdStr && String(s.areaId) === String(zIdStr)) return true;
          if (s.areaName && z.name && s.areaName.toLowerCase() === z.name.toLowerCase()) return true;
          return false;
        });

      // 1. City filter
      if (selectedCityFilter !== 'All') {
        const matchesCityId = z.cityId && String(z.cityId) === String(selectedCityFilter);
        const matchesCityName =
          (z.cityName || z.city || '').toLowerCase() === selectedCityFilter.toLowerCase();
        if (!matchesCityId && !matchesCityName) return false;
      }

      // 2. Store assignment filter
      if (storeStatusFilter === 'Assigned' && !isAssigned) return false;
      if (storeStatusFilter === 'Available' && isAssigned) return false;

      // 3. Search query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const nameMatch = z.name.toLowerCase().includes(q);
        const codeMatch = (z.code || '').toLowerCase().includes(q);
        const storeMatch = (z.assignedStore?.name || z.darkStore || '').toLowerCase().includes(q);
        const pincodeMatch = (z.pincodes || []).some((p) => p.includes(q));
        if (!nameMatch && !codeMatch && !storeMatch && !pincodeMatch) return false;
      }

      return true;
    });
  }, [zones, selectedCityFilter, storeStatusFilter, searchQuery, darkStores]);

  // Handle Open Create City
  const handleOpenCreateCity = () => {
    setEditingCity(null);
    setCityName('');
    setCityCode('');
    setCityState('Gujarat');
    setCityStatus('Active');
    setShowCityModal(true);
  };

  // Handle Open Edit City
  const handleOpenEditCity = (city: CityItem) => {
    setEditingCity(city);
    setCityName(city.name);
    setCityCode(city.code);
    setCityState(city.state || 'Gujarat');
    setCityStatus(city.status);
    setShowCityModal(true);
  };

  // Submit City Form
  const handleSubmitCity = async () => {
    if (!cityName.trim()) {
      Alert.alert('Required', 'Please enter city name');
      return;
    }
    const cleanCode = cityCode.trim().toUpperCase() || cityName.trim().substring(0, 3).toUpperCase();

    setCitySubmitting(true);
    try {
      if (editingCity) {
        const res = await updateCity(editingCity.id, {
          name: cityName.trim(),
          code: cleanCode,
          state: cityState.trim(),
          status: cityStatus,
        });
        if (res.success) {
          setShowCityModal(false);
          Alert.alert('Success', `City "${cityName}" updated successfully`);
        } else {
          Alert.alert('Error', res.error || 'Failed to update city');
        }
      } else {
        const res = await addCity({
          name: cityName.trim(),
          code: cleanCode,
          state: cityState.trim(),
          status: cityStatus,
        });
        if (res.success) {
          setShowCityModal(false);
          Alert.alert('Success', `City "${cityName}" created successfully`);
        } else {
          Alert.alert('Error', res.error || 'Failed to add city');
        }
      }
    } finally {
      setCitySubmitting(false);
    }
  };

  // Handle Delete City
  const handleDeleteCity = (city: CityItem) => {
    Alert.alert(
      'Delete City',
      `Are you sure you want to delete ${city.name}? This will check that no areas are assigned to this city.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteCity(city.id);
            if (!res.success) {
              Alert.alert('Cannot Delete', res.error || 'Failed to delete city');
            } else {
              Alert.alert('Deleted', `City ${city.name} deleted successfully`);
            }
          },
        },
      ]
    );
  };

  // Handle Open Create Area
  const handleOpenCreateArea = () => {
    setEditingArea(null);
    setAreaName('');
    setAreaCode('');
    const defaultCity = cities.find((c) => c.id === selectedCityFilter || c._id === selectedCityFilter) || cities[0];
    const defaultCityId = defaultCity ? (defaultCity.id || defaultCity._id || '') : '';
    setAreaCityId(defaultCityId);
    setAreaSla('9');
    setAreaRadius('3.5');
    setAreaLat('23.0225');
    setAreaLng('72.5714');
    setAreaPincodes('380015');
    setShowAreaModal(true);
  };

  // Handle Open Edit Area
  const handleOpenEditArea = (area: Zone) => {
    setEditingArea(area);
    setAreaName(area.name);
    setAreaCode(area.code || '');
    setAreaCityId(area.cityId || cities[0]?.id || '');
    setAreaSla(String(area.defaultDeliveryMinutes || 9));
    setAreaRadius(String(area.radiusKm || 3.5));
    setAreaLat(String(area.centerLat || 23.0225));
    setAreaLng(String(area.centerLng || 72.5714));
    setAreaPincodes((area.pincodes || ['380015']).join(', '));
    setShowAreaModal(true);
  };

  // Submit Area Form
  const handleSubmitArea = async () => {
    if (!areaName.trim()) {
      Alert.alert('Required', 'Please enter area name');
      return;
    }
    const cleanCode = (areaCode.trim() || areaName.trim()).toUpperCase().replace(/\s+/g, '_');
    const selectedCityObj = cities.find((c) => c.id === areaCityId || c._id === areaCityId) || cities[0];

    const pins = areaPincodes
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    setAreaSubmitting(true);
    try {
      if (editingArea) {
        const res = await ApiService.updateArea(editingArea.id, {
          name: areaName.trim(),
          code: cleanCode,
          cityId: selectedCityObj ? (selectedCityObj.id || selectedCityObj._id) : null,
          cityName: selectedCityObj ? selectedCityObj.name : 'Ahmedabad',
          city: selectedCityObj ? selectedCityObj.name : 'Ahmedabad',
          defaultDeliveryMinutes: Number(areaSla) || 9,
          radiusKm: Number(areaRadius) || 3.5,
          centerLat: Number(areaLat) || 23.0225,
          centerLng: Number(areaLng) || 72.5714,
          pincodes: pins.length > 0 ? pins : ['380015'],
        });
        if (res.success) {
          await refreshFromDb();
          setShowAreaModal(false);
          Alert.alert('Success', `Area "${areaName}" updated successfully`);
        } else {
          Alert.alert('Error', res.error || 'Failed to update area');
        }
      } else {
        const res = await ApiService.addOperationalZone({
          name: areaName.trim(),
          code: cleanCode,
          cityId: selectedCityObj ? (selectedCityObj.id || selectedCityObj._id) : undefined,
          city: selectedCityObj ? selectedCityObj.name : 'Ahmedabad',
          darkStore: `Wom Up ${areaName.trim()} Dark Store`,
          address: `${areaName.trim()}, ${selectedCityObj?.name || 'Ahmedabad'}`,
          defaultDeliveryMinutes: Number(areaSla) || 9,
          radiusKm: Number(areaRadius) || 3.5,
          centerLat: Number(areaLat) || 23.0225,
          centerLng: Number(areaLng) || 72.5714,
          isActive: true,
        });
        if (res.success) {
          await refreshFromDb();
          setShowAreaModal(false);
          Alert.alert('Success', `Area "${areaName}" created successfully`);
        } else {
          Alert.alert('Error', res.error || 'Failed to add area');
        }
      }
    } finally {
      setAreaSubmitting(false);
    }
  };

  // Handle Delete Area
  const handleDeleteArea = (area: Zone) => {
    const zIdStr = area.id || area._id;
    const assignedStore = darkStores.find((s) => {
      if (s.areaId && zIdStr && String(s.areaId) === String(zIdStr)) return true;
      if (s.areaName && area.name && s.areaName.toLowerCase() === area.name.toLowerCase()) return true;
      return false;
    });

    if (area.hasActiveStore || assignedStore) {
      Alert.alert(
        'Action Blocked',
        `Cannot delete area "${area.name}" because active store "${assignedStore?.name || area.assignedStore?.name}" is assigned to it. Reassign or deactivate the store first.`
      );
      return;
    }

    Alert.alert(
      'Delete Area',
      `Are you sure you want to delete ${area.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteAreaSafe(area.id);
            if (!res.success) {
              Alert.alert('Cannot Delete', res.error || 'Failed to delete area');
            } else {
              Alert.alert('Deleted', `Area ${area.name} deleted successfully`);
            }
          },
        },
      ]
    );
  };

  // Switch to Areas tab filtered by specific city
  const handleViewCityAreas = (city: CityItem) => {
    setSelectedCityFilter(city.id || city._id || city.name);
    setActiveSubTab('Areas');
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Header Banner */}
      <LinearGradient colors={GRADIENTS.navyHeader} style={styles.headerBanner}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeftCol}>
            <View style={styles.badgeRow}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>MULTI-CITY ARCHITECTURE</Text>
              </View>
              <View style={styles.ruleBadge}>
                <ShieldCheck size={11} color={COLORS.success} />
                <Text style={styles.ruleBadgeText}>1 Store per Area Enforced</Text>
              </View>
            </View>

            <Text style={styles.headerTitle}>Location Management</Text>
            <Text style={styles.headerSubtitle}>
              City (Admin) → Area (Admin) → Store (1:1 Allocation) Hierarchy
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => refreshFromDb()}
            activeOpacity={0.7}
          >
            <Zap size={13} color={COLORS.hotPink} />
            <Text style={styles.refreshBtnText}>Sync DB</Text>
          </TouchableOpacity>
        </View>

        {/* 2x2 Responsive KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{totalCities}</Text>
            <Text style={styles.kpiLabel}>Cities Master</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{totalAreas}</Text>
            <Text style={styles.kpiLabel}>Total Areas</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiCardPurple]}>
            <Text style={[styles.kpiValue, { color: COLORS.purple }]}>{assignedAreasCount}</Text>
            <Text style={styles.kpiLabel}>Stores Assigned</Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiCardEmerald]}>
            <Text style={[styles.kpiValue, { color: COLORS.success }]}>{availableAreasCount}</Text>
            <Text style={styles.kpiLabel}>Available Areas</Text>
          </View>
        </View>
      </LinearGradient>

      {/* 2. Responsive Main Navigation Tabs */}
      <View style={styles.tabNavContainer}>
        <View style={styles.tabNavPills}>
          <TouchableOpacity
            style={[styles.tabNavBtn, activeSubTab === 'Cities' && styles.tabNavBtnActive]}
            onPress={() => setActiveSubTab('Cities')}
            activeOpacity={0.8}
          >
            <Building2
              size={15}
              color={activeSubTab === 'Cities' ? COLORS.white : COLORS.textMuted}
            />
            <Text
              style={[
                styles.tabNavText,
                activeSubTab === 'Cities' && styles.tabNavTextActive,
              ]}
            >
              Cities Master ({cities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeSubTab === 'Areas' && styles.tabNavBtnActive]}
            onPress={() => setActiveSubTab('Areas')}
            activeOpacity={0.8}
          >
            <MapPin
              size={15}
              color={activeSubTab === 'Areas' ? COLORS.white : COLORS.textMuted}
            />
            <Text
              style={[
                styles.tabNavText,
                activeSubTab === 'Areas' && styles.tabNavTextActive,
              ]}
            >
              Areas & Store Allocations ({zones.length})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionAddBtn}
          onPress={activeSubTab === 'Cities' ? handleOpenCreateCity : handleOpenCreateArea}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionAddBtnGradient}
          >
            <Plus size={15} color={COLORS.white} />
            <Text style={styles.actionAddBtnText}>
              {activeSubTab === 'Cities' ? 'Add City' : 'Add Area'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 3. Search & Filter Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeSubTab === 'Cities'
                ? 'Search cities by name, code, or state...'
                : 'Search areas by name, code, pincode, or store...'
            }
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {activeSubTab === 'Areas' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {/* City Selector Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>City:</Text>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCityFilter === 'All' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCityFilter('All')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCityFilter === 'All' && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {cities.map((c) => {
                const cIdStr = c.id || c._id || c.name;
                const isSelected = selectedCityFilter === cIdStr || selectedCityFilter === c.name;
                return (
                  <TouchableOpacity
                    key={cIdStr}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedCityFilter(cIdStr)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Store Status Filter */}
            <View style={[styles.filterGroup, { marginLeft: 10 }]}>
              <Text style={styles.filterLabel}>Store:</Text>
              {(['All', 'Assigned', 'Available'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    storeStatusFilter === status && styles.filterChipActive,
                  ]}
                  onPress={() => setStoreStatusFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      storeStatusFilter === status && styles.filterChipTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* 4. Main Content List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* ================= VIEW: CITIES ================= */}
        {activeSubTab === 'Cities' && (
          <View>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>Configured Cities ({filteredCities.length})</Text>
              <Text style={styles.sectionSub}>
                Master Cities list. Dark stores & vendor registrations select from this list.
              </Text>
            </View>

            {filteredCities.length === 0 ? (
              <View style={styles.emptyState}>
                <Building2 size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Cities Found</Text>
                <Text style={styles.emptySub}>
                  Try adjusting your search query or add a new city above.
                </Text>
              </View>
            ) : (
              <View style={styles.cardsGrid}>
                {filteredCities.map((city) => {
                  const cityIdStr = city.id || city._id || '';
                  const cityAreas = zones.filter((z) => {
                    if (z.cityId && cityIdStr && String(z.cityId) === String(cityIdStr)) return true;
                    if (z.cityName && city.name && z.cityName.toLowerCase() === city.name.toLowerCase()) return true;
                    if (z.city && city.name && z.city.toLowerCase() === city.name.toLowerCase()) return true;
                    return false;
                  });
                  const cityStores = darkStores.filter((s) => {
                    if (s.cityId && cityIdStr && String(s.cityId) === String(cityIdStr)) return true;
                    if (s.cityName && city.name && s.cityName.toLowerCase() === city.name.toLowerCase()) return true;
                    if (s.city && city.name && s.city.toLowerCase() === city.name.toLowerCase()) return true;
                    return false;
                  });

                  return (
                    <View key={cityIdStr || city.name} style={styles.cityCard}>
                      {/* Top Row: Name, Code, Status */}
                      <View style={styles.cityCardTop}>
                        <View style={styles.cityTitleWrap}>
                          <View style={styles.cityIconWrap}>
                            <Building2 size={20} color={COLORS.purple} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cityNameText}>{city.name}</Text>
                            <Text style={styles.cityStateText}>
                              {city.state || 'Gujarat'} · Code: {city.code}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            city.status === 'Active'
                              ? styles.statusBadgeActive
                              : styles.statusBadgeInactive,
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              city.status === 'Active'
                                ? styles.statusDotActive
                                : styles.statusDotInactive,
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusBadgeText,
                              city.status === 'Active'
                                ? styles.statusBadgeTextActive
                                : styles.statusBadgeTextInactive,
                            ]}
                          >
                            {city.status || 'Active'}
                          </Text>
                        </View>
                      </View>

                      {/* Middle: Stats */}
                      <View style={styles.cityStatsRow}>
                        <View style={styles.cityStatCol}>
                          <Text style={styles.cityStatNum}>{cityAreas.length}</Text>
                          <Text style={styles.cityStatLabel}>Areas</Text>
                        </View>
                        <View style={styles.cityStatDivider} />
                        <View style={styles.cityStatCol}>
                          <Text style={styles.cityStatNum}>{cityStores.length}</Text>
                          <Text style={styles.cityStatLabel}>Dark Stores</Text>
                        </View>
                        <View style={styles.cityStatDivider} />
                        <View style={styles.cityStatCol}>
                          <Text style={[styles.cityStatNum, { color: COLORS.success }]}>
                            {cityStores.filter((s) => s.isActive !== false).length}
                          </Text>
                          <Text style={styles.cityStatLabel}>Online</Text>
                        </View>
                      </View>

                      {/* Bottom: Action buttons */}
                      <View style={styles.cityCardActions}>
                        <TouchableOpacity
                          style={styles.viewAreasBtn}
                          onPress={() => handleViewCityAreas(city)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.viewAreasBtnText}>Manage Areas ({cityAreas.length})</Text>
                          <ArrowRight size={13} color={COLORS.purple} />
                        </TouchableOpacity>

                        <View style={styles.cardIconActions}>
                          <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => handleOpenEditCity(city)}
                            activeOpacity={0.7}
                          >
                            <Edit2 size={14} color={COLORS.textPrimary} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.iconBtn, styles.deleteBtn]}
                            onPress={() => handleDeleteCity(city)}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={14} color={COLORS.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ================= VIEW: AREAS ================= */}
        {activeSubTab === 'Areas' && (
          <View>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>Operational Areas ({filteredAreas.length})</Text>
              <Text style={styles.sectionSub}>
                Strict 1-Store-Per-Area rule guarantees instant 9-minute SLA fulfillment without inventory collision.
              </Text>
            </View>

            {filteredAreas.length === 0 ? (
              <View style={styles.emptyState}>
                <MapPin size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Areas Found</Text>
                <Text style={styles.emptySub}>
                  Try adjusting your filters or click "Add Area" to register one.
                </Text>
              </View>
            ) : (
              <View style={styles.cardsGrid}>
                {filteredAreas.map((area) => {
                  const zIdStr = area.id || area._id;
                  const assignedStore = darkStores.find((s) => {
                    if (s.areaId && zIdStr && String(s.areaId) === String(zIdStr)) return true;
                    if (s.areaName && area.name && s.areaName.toLowerCase() === area.name.toLowerCase()) return true;
                    return false;
                  }) || (area.assignedStore ? { name: area.assignedStore.name, loginId: area.assignedStore.code } as any : null);

                  const isAssigned = !!assignedStore;

                  return (
                    <View key={area.id || area._id || area.name} style={styles.areaCard}>
                      {/* Top Row: Name, City, Store status pill */}
                      <View style={styles.areaCardTop}>
                        <View style={styles.areaTitleWrap}>
                          <View
                            style={[
                              styles.areaIconWrap,
                              isAssigned ? styles.areaIconAssigned : styles.areaIconAvailable,
                            ]}
                          >
                            <MapPin
                              size={18}
                              color={isAssigned ? COLORS.purple : COLORS.success}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.areaNameText}>{area.name}</Text>
                            <View style={styles.areaCityBadge}>
                              <Building2 size={11} color={COLORS.textMuted} />
                              <Text style={styles.areaCityText}>
                                {area.cityName || area.city || 'Ahmedabad'}
                              </Text>
                              <Text style={styles.areaCodeText}>· {area.code}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Store Status Pill */}
                        {isAssigned ? (
                          <View style={styles.assignedPill}>
                            <Lock size={11} color={COLORS.purple} />
                            <Text style={styles.assignedPillText}>STORE ASSIGNED</Text>
                          </View>
                        ) : (
                          <View style={styles.availablePill}>
                            <CheckCircle2 size={11} color={COLORS.success} />
                            <Text style={styles.availablePillText}>AVAILABLE</Text>
                          </View>
                        )}
                      </View>

                      {/* Store Box: Displays assigned store info or prompt to register */}
                      <View
                        style={[
                          styles.storeInfoBox,
                          isAssigned ? styles.storeInfoBoxAssigned : styles.storeInfoBoxAvailable,
                        ]}
                      >
                        {isAssigned && assignedStore ? (
                          <View>
                            <View style={styles.assignedStoreHeader}>
                              <Store size={14} color={COLORS.purple} />
                              <Text style={styles.assignedStoreName} numberOfLines={1}>
                                {assignedStore.name}
                              </Text>
                            </View>
                            <View style={styles.assignedStoreMeta}>
                              <Text style={styles.assignedStoreMetaText}>
                                ID: {assignedStore.loginId || assignedStore.code} · 1:1 Area Locked
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.availableStorePrompt}>
                            <AlertCircle size={14} color={COLORS.success} />
                            <Text style={styles.availableStoreText}>
                              Ready for store registration. Next store selecting this area gets locked to it.
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Metrics Row: SLA, Radius, Pincodes */}
                      <View style={styles.areaMetricsRow}>
                        <View style={styles.metricItem}>
                          <Clock size={13} color={COLORS.textMuted} />
                          <Text style={styles.metricText}>
                            {area.defaultDeliveryMinutes || 9} min SLA
                          </Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Zap size={13} color={COLORS.textMuted} />
                          <Text style={styles.metricText}>{area.radiusKm || 3.5} km radius</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Layers size={13} color={COLORS.textMuted} />
                          <Text style={styles.metricText}>
                            {area.pincodes && area.pincodes.length > 0 ? area.pincodes[0] : '380015'}
                          </Text>
                        </View>
                      </View>

                      {/* Bottom Actions */}
                      <View style={styles.areaCardFooter}>
                        <TouchableOpacity
                          style={styles.editAreaBtn}
                          onPress={() => handleOpenEditArea(area)}
                          activeOpacity={0.7}
                        >
                          <Edit2 size={13} color={COLORS.textPrimary} />
                          <Text style={styles.editAreaBtnText}>Edit Zone</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.deleteAreaBtn,
                            isAssigned && styles.deleteAreaBtnDisabled,
                          ]}
                          onPress={() => handleDeleteArea(area)}
                          activeOpacity={0.7}
                        >
                          <Trash2
                            size={14}
                            color={isAssigned ? COLORS.secondaryText : COLORS.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL: ADD / EDIT CITY ================= */}
      <Modal
        visible={showCityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Building2 size={20} color={COLORS.hotPink} />
                <Text style={styles.modalTitle}>
                  {editingCity ? `Edit City: ${editingCity.name}` : 'Add New City'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>City Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Surat, Vadodara, Rajkot"
                placeholderTextColor={COLORS.textMuted}
                value={cityName}
                onChangeText={(text) => {
                  setCityName(text);
                  if (!editingCity && !cityCode) {
                    setCityCode(text.substring(0, 3).toUpperCase());
                  }
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>City Code * (Short unique code)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. SUR, BDQ, RAJ"
                placeholderTextColor={COLORS.textMuted}
                value={cityCode}
                onChangeText={(text) => setCityCode(text.toUpperCase())}
                maxLength={6}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>State</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Gujarat"
                placeholderTextColor={COLORS.textMuted}
                value={cityState}
                onChangeText={setCityState}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <View style={styles.statusToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    cityStatus === 'Active' && styles.statusOptionActive,
                  ]}
                  onPress={() => setCityStatus('Active')}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      cityStatus === 'Active' && styles.statusOptionTextActive,
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    cityStatus === 'Inactive' && styles.statusOptionInactive,
                  ]}
                  onPress={() => setCityStatus('Inactive')}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      cityStatus === 'Inactive' && styles.statusOptionTextInactive,
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCityModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitCity}
                disabled={citySubmitting}
              >
                {citySubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingCity ? 'Save Changes' : 'Create City'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: ADD / EDIT AREA ================= */}
      <Modal
        visible={showAreaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAreaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MapPin size={20} color={COLORS.purple} />
                <View>
                  <Text style={styles.modalTitle}>
                    {editingArea ? `Edit Area: ${editingArea.name}` : 'Add New Operational Area'}
                  </Text>
                  <Text style={styles.modalSubtitle}>1 Area = 1 Dark Store Architecture</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAreaModal(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* City Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Belongs to City *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexDirection: 'row', marginTop: 4 }}
              >
                {cities.map((c) => {
                  const cIdStr = c.id || c._id || '';
                  const isSelected = areaCityId === cIdStr;
                  return (
                    <TouchableOpacity
                      key={cIdStr}
                      style={[
                        styles.citySelectChip,
                        isSelected && styles.citySelectChipActive,
                      ]}
                      onPress={() => setAreaCityId(cIdStr)}
                    >
                      <Text
                        style={[
                          styles.citySelectChipText,
                          isSelected && styles.citySelectChipTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Area / Micro-Hub Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Satellite, Vastrapur, Adajan"
                placeholderTextColor={COLORS.textMuted}
                value={areaName}
                onChangeText={(text) => {
                  setAreaName(text);
                  if (!editingArea && !areaCode) {
                    setAreaCode(text.toUpperCase().replace(/\s+/g, '_'));
                  }
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Area Code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. SATELLITE, ADAJAN"
                placeholderTextColor={COLORS.textMuted}
                value={areaCode}
                onChangeText={(text) => setAreaCode(text.toUpperCase())}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Delivery SLA (Mins)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="9"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={areaSla}
                  onChangeText={setAreaSla}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Service Radius (Km)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="3.5"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={areaRadius}
                  onChangeText={setAreaRadius}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Latitude</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="23.0225"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={areaLat}
                  onChangeText={setAreaLat}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Longitude</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="72.5714"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={areaLng}
                  onChangeText={setAreaLng}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pincodes (Comma separated)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="380015, 380054"
                placeholderTextColor={COLORS.textMuted}
                value={areaPincodes}
                onChangeText={setAreaPincodes}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAreaModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitArea}
                disabled={areaSubmitting}
              >
                {areaSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingArea ? 'Save Area' : 'Create Area'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    width: '100%',
  },
  headerBanner: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomLeftRadius: RADIUS.card,
    borderBottomRightRadius: RADIUS.card,
    width: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeftCol: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.hotPink,
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  ruleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 168, 107, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  ruleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.success,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  kpiCardPurple: {
    borderColor: 'rgba(131, 100, 230, 0.3)',
  },
  kpiCardEmerald: {
    borderColor: 'rgba(34, 168, 107, 0.3)',
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
  },
  kpiLabel: {
    fontSize: 9,
    color: COLORS.secondaryText,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tabNavContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: COLORS.cardBackground,
    gap: 8,
  },
  tabNavPills: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
    width: '100%',
  },
  tabNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  tabNavBtnActive: {
    backgroundColor: COLORS.navy,
  },
  tabNavText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tabNavTextActive: {
    color: COLORS.white,
  },
  actionAddBtn: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  actionAddBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  actionAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.cardBackground,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 2,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginRight: 2,
  },
  filterChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  sectionHeadingRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  cityCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cityCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cityTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  cityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cityStateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#E6F9F0',
  },
  statusBadgeInactive: {
    backgroundColor: '#FDE8E8',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: COLORS.success,
  },
  statusDotInactive: {
    backgroundColor: COLORS.error,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: COLORS.success,
  },
  statusBadgeTextInactive: {
    color: COLORS.error,
  },
  cityStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  cityStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  cityStatNum: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cityStatLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cityStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  cityCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0EFF6',
    paddingTop: 10,
  },
  viewAreasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  viewAreasBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  cardIconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F4F4FA',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteBtn: {
    backgroundColor: '#FDE8E8',
    borderColor: '#FCA5A5',
  },
  areaCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  areaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  areaTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 6,
  },
  areaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaIconAssigned: {
    backgroundColor: '#F3F0FA',
  },
  areaIconAvailable: {
    backgroundColor: '#E6F9F0',
  },
  areaNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  areaCityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  areaCityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  areaCodeText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  assignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F0FA',
    borderWidth: 1,
    borderColor: '#E2DCF7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  assignedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.3,
  },
  availablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F9F0',
    borderWidth: 1,
    borderColor: '#B9ECCF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  availablePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.3,
  },
  storeInfoBox: {
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
  },
  storeInfoBoxAssigned: {
    backgroundColor: '#F8F6FF',
    borderColor: '#E9E4F5',
  },
  storeInfoBoxAvailable: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  assignedStoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  assignedStoreName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  assignedStoreMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  assignedStoreMetaText: {
    fontSize: 11,
    color: COLORS.purple,
    fontWeight: '700',
  },
  availableStorePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availableStoreText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    flex: 1,
  },
  areaMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0EFF6',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  areaCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0EFF6',
    paddingTop: 8,
    marginTop: 4,
  },
  editAreaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  editAreaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deleteAreaBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FDE8E8',
  },
  deleteAreaBtnDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  formGroup: {
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  formRow: {
    flexDirection: 'row',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
  },
  statusOptionActive: {
    borderColor: COLORS.success,
    backgroundColor: '#E6F9F0',
  },
  statusOptionInactive: {
    borderColor: COLORS.error,
    backgroundColor: '#FDE8E8',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  statusOptionTextActive: {
    color: COLORS.success,
    fontWeight: '700',
  },
  statusOptionTextInactive: {
    color: COLORS.error,
    fontWeight: '700',
  },
  citySelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
  },
  citySelectChipActive: {
    borderColor: COLORS.purple,
    backgroundColor: '#F3F0FA',
  },
  citySelectChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  citySelectChipTextActive: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.navy,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});
