import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Store,
  Plus,
  KeyRound,
  Trash2,
  Copy,
  RefreshCw,
  Search,
  MapPin,
  Clock,
  Bike,
  Package,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Radio,
  ChevronDown,
  Check,
  Lock,
  Building2,
  Navigation,
  Sliders,
  Users,
  AlertTriangle,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { ApiService } from '../services/api';
import { DarkStoreItem, CityItem, Zone } from '../types/admin';
import { useAdminState } from '../context/AdminStateContext';

export const StoresManagementScreen: React.FC = () => {
  const { refreshFromDb, cities, zones, darkStores } = useAdminState();

  const [stores, setStores] = useState<DarkStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'On Shift' | 'Logged In'>('All');

  // Sync stores from real-time admin context (WebSocket & DB)
  useEffect(() => {
    if (darkStores && darkStores.length > 0) {
      setStores(darkStores);
    }
  }, [darkStores]);

  // Cascading City & Area Filters
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [showCityFilterModal, setShowCityFilterModal] = useState(false);
  const [showAreaFilterModal, setShowAreaFilterModal] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCode, setNewStoreCode] = useState('');
  const [newLoginId, setNewLoginId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCityId, setNewCityId] = useState('');
  const [newCityName, setNewCityName] = useState('Ahmedabad');
  const [newAreaId, setNewAreaId] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newPincode, setNewPincode] = useState('380015');
  const [newLatitude, setNewLatitude] = useState('23.0300');
  const [newLongitude, setNewLongitude] = useState('72.5300');
  const [newRadius, setNewRadius] = useState('4.5');
  const [newDeliveryMins, setNewDeliveryMins] = useState('9');
  const [showCreateCityPicker, setShowCreateCityPicker] = useState(false);
  const [showCreateAreaPicker, setShowCreateAreaPicker] = useState(false);

  // Created Success Banner State
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    loginId: string;
    password: string;
  } | null>(null);

  // Reset Password Modal State
  const [resetModalStore, setResetModalStore] = useState<DarkStoreItem | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Delete Confirm Modal State
  const [deleteConfirmStore, setDeleteConfirmStore] = useState<DarkStoreItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Active Cities from Admin Context
  const activeCities = cities.filter((c) => c.status === 'Active' || !c.status);

  // Filterable Areas for the currently selected city filter
  const filterableAreas = zones.filter((z) => {
    if (selectedCityFilter === 'ALL') return true;
    const matchedCity = activeCities.find(
      (c) => c.id === selectedCityFilter || c._id === selectedCityFilter || c.name.toLowerCase() === selectedCityFilter.toLowerCase()
    );
    if (!matchedCity) return true;
    const cityIdStr = matchedCity.id || matchedCity._id;
    if (z.cityId && cityIdStr && String(z.cityId) === String(cityIdStr)) return true;
    if (z.cityName && matchedCity.name && z.cityName.toLowerCase() === matchedCity.name.toLowerCase()) return true;
    if (z.city && matchedCity.name && z.city.toLowerCase() === matchedCity.name.toLowerCase()) return true;
    return false;
  });

  // Load stores from API
  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ApiService.fetchStores();
      setStores(data);
    } catch (err) {
      console.error('[Stores] Failed to fetch:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStores();
    await refreshFromDb();
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      alert(`${label} copied to clipboard:\n${text}`);
    } catch {
      alert(`${label}:\n${text}`);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = 'Womup@';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const openCreateModal = () => {
    const defaultPwd = generateRandomPassword();
    const defaultCity = activeCities.find((c) => c.code === 'AHM' || c.name.toLowerCase() === 'ahmedabad') || activeCities[0];
    const defaultCityId = defaultCity ? (defaultCity.id || defaultCity._id || '') : '';
    const defaultCityName = defaultCity ? defaultCity.name : 'Ahmedabad';

    setNewStoreName('');
    setNewStoreCode('');
    setNewLoginId('');
    setNewPassword(defaultPwd);
    setNewAddress('');
    setNewCityId(defaultCityId);
    setNewCityName(defaultCityName);
    setNewAreaId('');
    setNewAreaName('');
    setNewPincode('380015');
    setNewLatitude('23.0300');
    setNewLongitude('72.5300');
    setNewRadius('4.5');
    setNewDeliveryMins('9');
    setCreatedCredentials(null);
    setShowCreateModal(true);
  };

  const handleSelectCreateCity = (city: CityItem) => {
    const cityIdStr = city.id || city._id || '';
    setNewCityId(cityIdStr);
    setNewCityName(city.name);
    setNewAreaId('');
    setNewAreaName('');
    setShowCreateCityPicker(false);
  };

  const handleSelectCreateArea = (area: Zone) => {
    const areaIdStr = area.id || area._id || '';
    setNewAreaId(areaIdStr);
    setNewAreaName(area.name);
    setShowCreateAreaPicker(false);

    // Auto-populate store details according to selected area
    const areaCleanName = area.name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    if (!newStoreName || newStoreName.includes('Dark Store')) {
      setNewStoreName(`Wom Up ${areaCleanName} Dark Store`);
    }
    const derivedCode = `STORE-${(area.code || areaCleanName).toUpperCase().replace(/\s+/g, '_')}`;
    setNewStoreCode(derivedCode);

    if (!newLoginId || newLoginId.startsWith('womup')) {
      setNewLoginId(`womup${areaCleanName.replace(/\s+/g, '')}`);
    }

    if (!newAddress || newAddress.includes('Dark Store Hub')) {
      setNewAddress(`Dark Store Hub, ${area.name}, ${newCityName}`);
    }

    if (area.pincodes && area.pincodes.length > 0) {
      setNewPincode(area.pincodes[0]);
    }
    if (area.centerLat) {
      setNewLatitude(String(area.centerLat));
    }
    if (area.centerLng) {
      setNewLongitude(String(area.centerLng));
    }
    if (area.radiusKm) {
      setNewRadius(String(area.radiusKm));
    }
    if (area.defaultDeliveryMinutes) {
      setNewDeliveryMins(String(area.defaultDeliveryMinutes));
    }
  };

  const handleNameOrCodeChange = (name: string, code: string) => {
    setNewStoreName(name);
    setNewStoreCode(code);
    if (!newLoginId || newLoginId.startsWith('womup')) {
      const derived = code
        ? `womup${code.replace(/[^a-zA-Z0-9]/g, '')}`
        : name
        ? `womup${name.replace(/Wom\s*Up|Dark\s*Store|[^a-zA-Z0-9]/gi, '')}`
        : '';
      setNewLoginId(derived);
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim() || !newStoreCode.trim() || !newAddress.trim() || !newCityName.trim()) {
      alert('Please fill in Store Name, Code, Address, and City.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await ApiService.createStore({
        name: newStoreName.trim(),
        code: newStoreCode.trim(),
        loginId: newLoginId.trim() || undefined,
        password: newPassword.trim() || undefined,
        address: newAddress.trim(),
        city: newCityName.trim(),
        cityName: newCityName.trim(),
        cityId: newCityId || undefined,
        areaId: newAreaId || undefined,
        areaName: newAreaName || undefined,
        pincode: newPincode.trim(),
        latitude: parseFloat(newLatitude) || 23.03,
        longitude: parseFloat(newLongitude) || 72.53,
        serviceRadiusKm: parseFloat(newRadius) || 4.5,
        estimatedDeliveryMinutes: parseInt(newDeliveryMins, 10) || 9,
      });

      if (res.success && res.data) {
        setCreatedCredentials({
          name: res.data.name,
          loginId: res.data.loginId,
          password: res.data.plainPassword || newPassword,
        });
        await loadStores();
        await refreshFromDb();
      } else {
        alert(res.error || 'Failed to create dark store.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred creating store.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openResetPasswordModal = (store: DarkStoreItem) => {
    setResetModalStore(store);
    setResetPasswordValue(generateRandomPassword());
    setResetSuccessMessage(null);
    setShowPassword(true);
  };

  const handleResetPassword = async () => {
    if (!resetModalStore) return;
    if (!resetPasswordValue.trim()) {
      alert('Please enter or generate a new password.');
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await ApiService.resetStorePassword(resetModalStore.id, resetPasswordValue.trim());
      if (res.success) {
        setResetSuccessMessage(`Password updated successfully!`);
        await loadStores();
      } else {
        alert(res.error || 'Failed to reset store password.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred resetting password.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!deleteConfirmStore) return;
    setDeleteSubmitting(true);
    try {
      const res = await ApiService.deleteStore(deleteConfirmStore.id);
      if (res.success) {
        alert(`Store "${deleteConfirmStore.name}" deleted successfully.`);
        setDeleteConfirmStore(null);
        await loadStores();
        await refreshFromDb();
      } else {
        alert(res.error || 'Cannot delete store.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting store.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Filtered store list respecting City, Area, Status, and Search
  const filteredStores = stores.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.loginId && s.loginId.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.cityName && s.cityName.toLowerCase().includes(q)) ||
      (s.areaName && s.areaName.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (filterStatus === 'Active' && s.isActive === false) return false;
    if (filterStatus === 'On Shift' && !(Number(s.staffOnShift || 0) > 0 || s.isOnShift)) return false;
    if (filterStatus === 'Logged In' && !s.lastLoginAt) return false;

    // Filter by City
    if (selectedCityFilter !== 'ALL') {
      const matchedCity = activeCities.find(
        (c) => c.id === selectedCityFilter || c._id === selectedCityFilter || c.name.toLowerCase() === selectedCityFilter.toLowerCase()
      );
      const targetCityName = matchedCity ? matchedCity.name.toLowerCase() : selectedCityFilter.toLowerCase();
      const targetCityId = matchedCity ? String(matchedCity.id || matchedCity._id) : '';
      const storeCity = (s.cityName || s.city || '').toLowerCase();
      const storeCityId = s.cityId ? String(s.cityId) : '';

      const matchesCity = (targetCityId && storeCityId === targetCityId) || (storeCity && storeCity === targetCityName);
      if (!matchesCity) return false;
    }

    // Filter by Area
    if (selectedAreaFilter !== 'ALL') {
      const matchedArea = zones.find(
        (z) => z.id === selectedAreaFilter || z._id === selectedAreaFilter || z.name.toLowerCase() === selectedAreaFilter.toLowerCase()
      );
      const targetAreaName = matchedArea ? matchedArea.name.toLowerCase() : selectedAreaFilter.toLowerCase();
      const targetAreaId = matchedArea ? String(matchedArea.id || matchedArea._id) : '';
      const storeAreaId = s.areaId ? String(s.areaId) : '';
      const storeAreaName = (s.areaName || '').toLowerCase();

      const matchesArea = (targetAreaId && storeAreaId === targetAreaId) || (storeAreaName && storeAreaName === targetAreaName);
      if (!matchesArea) return false;
    }

    return true;
  });

  // Group filtered stores by City
  const storesByCity = filteredStores.reduce((acc, store) => {
    const rawCity = (store.cityName || store.city || 'Other').trim();
    const normalizedCity = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);
    if (!acc[normalizedCity]) {
      acc[normalizedCity] = [];
    }
    acc[normalizedCity].push(store);
    return acc;
  }, {} as Record<string, DarkStoreItem[]>);

  // Sort city names so Ahmedabad comes first, followed by others alphabetically
  const cityGroups = Object.keys(storesByCity).sort((a, b) => {
    if (a.toLowerCase() === 'ahmedabad') return -1;
    if (b.toLowerCase() === 'ahmedabad') return 1;
    return a.localeCompare(b);
  });

  // Overall metrics
  const totalStores = stores.length;
  const totalOrders = stores.reduce((sum, s) => sum + (s.orderCount || 0), 0);
  const totalPending = stores.reduce((sum, s) => sum + (s.pendingOrders || 0), 0);
  const totalRiders = stores.reduce((sum, s) => sum + (s.riderCount || 0), 0);

  // Selected filter labels
  const selectedCityObj = activeCities.find(
    (c) => c.id === selectedCityFilter || c._id === selectedCityFilter || c.name.toLowerCase() === selectedCityFilter.toLowerCase()
  );
  const selectedCityLabel = selectedCityFilter === 'ALL' ? 'All Cities' : selectedCityObj ? selectedCityObj.name : selectedCityFilter;

  const selectedAreaObj = zones.find(
    (z) => z.id === selectedAreaFilter || z._id === selectedAreaFilter || z.name.toLowerCase() === selectedAreaFilter.toLowerCase()
  );
  const selectedAreaLabel = selectedAreaFilter === 'ALL' ? 'All Areas' : selectedAreaObj ? selectedAreaObj.name : selectedAreaFilter;

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <LinearGradient colors={GRADIENTS.navyHeader} style={styles.topHeader}>
        <View style={styles.topHeaderRow}>
          <View style={styles.headerTitleCol}>
            <View style={styles.titleIconRow}>
              <View style={styles.iconBadge}>
                <Store size={22} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.screenTitle}>Dark Stores & Hubs</Text>
                <Text style={styles.screenSubtitle}>
                  City → Area → Store (1:1 Architecture) & fulfillment metrics
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActionsRow}>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                color={COLORS.white}
                style={refreshing ? styles.rotating : undefined}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createStoreBtn}
              onPress={openCreateModal}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createBtnGradient}
              >
                <Plus size={16} color={COLORS.white} />
                <Text style={styles.createBtnText}>NEW STORE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Operational Telemetry Summary */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalStores}</Text>
            <Text style={styles.metricLabel}>Total Dark Stores</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: COLORS.hotPink }]}>
              {stores.filter((s) => s.loginId).length} / {totalStores}
            </Text>
            <Text style={styles.metricLabel}>Store IDs Active</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: COLORS.purple }]}>{totalOrders}</Text>
            <Text style={styles.metricLabel}>
              Orders Handled {totalPending > 0 ? `(${totalPending} Active)` : ''}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: COLORS.blue }]}>{totalRiders}</Text>
            <Text style={styles.metricLabel}>Assigned Riders</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ================= CASCADING FILTER CONTROLS & SEARCH BAR ================= */}
      <View style={styles.filterSection}>
        {/* Row 1: Search Box */}
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Store Name, Area, Code, or Store ID..."
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

        {/* Row 2: Cascading City & Area Filter Buttons */}
        <View style={styles.cascadeFilterRow}>
          {/* City Filter Selector */}
          <View style={styles.cascadeDropdownCol}>
            <Text style={styles.cascadeFilterLabel}>CITY HIERARCHY</Text>
            <TouchableOpacity
              style={[
                styles.cascadeDropdownBtn,
                selectedCityFilter !== 'ALL' && styles.cascadeDropdownBtnActive,
              ]}
              onPress={() => setShowCityFilterModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.cascadeBtnContent}>
                <Building2
                  size={14}
                  color={selectedCityFilter !== 'ALL' ? COLORS.hotPink : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.cascadeBtnText,
                    selectedCityFilter !== 'ALL' && styles.cascadeBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {selectedCityLabel}
                </Text>
              </View>
              <ChevronDown size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Area Filter Selector (Cascades from City) */}
          <View style={styles.cascadeDropdownCol}>
            <Text style={styles.cascadeFilterLabel}>AREA (1:1 STORE)</Text>
            <TouchableOpacity
              style={[
                styles.cascadeDropdownBtn,
                selectedAreaFilter !== 'ALL' && styles.cascadeDropdownBtnActive,
              ]}
              onPress={() => setShowAreaFilterModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.cascadeBtnContent}>
                <MapPin
                  size={14}
                  color={selectedAreaFilter !== 'ALL' ? COLORS.purple : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.cascadeBtnText,
                    selectedAreaFilter !== 'ALL' && styles.cascadeBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {selectedAreaLabel}
                </Text>
              </View>
              <ChevronDown size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Reset Filters Pill */}
          {(selectedCityFilter !== 'ALL' || selectedAreaFilter !== 'ALL') && (
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() => {
                setSelectedCityFilter('ALL');
                setSelectedAreaFilter('ALL');
              }}
            >
              <X size={12} color={COLORS.error} />
              <Text style={styles.clearFiltersText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Row 3: Status Filter Chips */}
        <View style={styles.filterChipsRow}>
          {(['All', 'Active', 'On Shift', 'Logged In'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, filterStatus === filter && styles.filterChipActive]}
              onPress={() => setFilterStatus(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === filter && styles.filterChipTextActive,
                ]}
              >
                {filter} {filter === 'All' ? `(${filteredStores.length})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ================= STORES LIST GROUPED BY CITY ================= */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.hotPink} />
          <Text style={styles.loadingText}>Loading Dark Stores from MongoDB Atlas...</Text>
        </View>
      ) : filteredStores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Store size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Dark Stores Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedCityFilter !== 'ALL' || selectedAreaFilter !== 'ALL'
              ? 'No dark store matches the selected city, area, or search query.'
              : 'Create your first dark store to get started.'}
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => {
              setSelectedCityFilter('ALL');
              setSelectedAreaFilter('ALL');
              setSearchQuery('');
            }}
          >
            <Text style={styles.emptyActionText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        >
          {cityGroups.map((cityName) => {
            const cityStores = storesByCity[cityName] || [];
            return (
              <View key={cityName} style={styles.citySectionGroup}>
                {/* 🏙️ City Section Header */}
                <View style={styles.citySectionHeader}>
                  <View style={styles.citySectionHeaderLeft}>
                    <Text style={styles.citySectionEmoji}>🏙️</Text>
                    <Text style={styles.citySectionTitle}>{cityName.toUpperCase()}</Text>
                    <View style={styles.cityStoreCountBadge}>
                      <Text style={styles.cityStoreCountText}>
                        {cityStores.length} {cityStores.length === 1 ? 'Store' : 'Stores'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cityHubStatusTag}>
                    <View style={styles.activeDot} />
                    <Text style={styles.cityHubStatusText}>Active Cluster</Text>
                  </View>
                </View>

                {/* Stores in this city */}
                <View style={styles.cityStoresList}>
                  {cityStores.map((store) => {
                    const hasLogin = !!store.loginId;
                    const hasLoggedIn = !!store.lastLoginAt;
                    const isStoreActive = store.isActive !== false;
                    const staffOnShift = Number(store.staffOnShift ?? (store.isOnShift ? 1 : 0));
                    const staffTotal = Number(store.staffTotal ?? (staffOnShift > 0 ? staffOnShift : 1));
                    const hasPickers = staffOnShift > 0;

                    return (
                      <View key={store.id} style={styles.storeCard}>
                        {/* Store Header Row */}
                        <View style={styles.cardHeader}>
                          <View style={styles.storeMainInfo}>
                            <View style={styles.storeTitleRow}>
                              <Text style={styles.storeName}>{store.name}</Text>
                              {!isStoreActive ? (
                                <View style={[styles.activeTag, styles.statusInactiveTag]}>
                                  <View style={[styles.activeDot, { backgroundColor: COLORS.error }]} />
                                  <Text style={[styles.activeTagText, { color: COLORS.error }]}>STORE INACTIVE</Text>
                                </View>
                              ) : hasPickers ? (
                                <View style={[styles.activeTag, styles.statusOnlineTag]}>
                                  <View style={[styles.activeDot, { backgroundColor: COLORS.success }]} />
                                  <Text style={[styles.activeTagText, { color: COLORS.success }]}>
                                    STORE ACTIVE · {staffOnShift}/{staffTotal} ON SHIFT
                                  </Text>
                                </View>
                              ) : (
                                <View style={[styles.activeTag, styles.statusWarningTag]}>
                                  <View style={[styles.activeDot, { backgroundColor: '#F59E0B' }]} />
                                  <Text style={[styles.activeTagText, { color: '#B45309' }]}>
                                    STORE ACTIVE · NO PICKERS
                                  </Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.storeMetaRow}>
                              <Text style={styles.storeCode}>CODE: {store.code}</Text>
                              {isStoreActive && (
                                <View style={[styles.pickerLiveIndicator, !hasPickers && styles.pickerLiveIndicatorWarning]}>
                                  <Users size={12} color={hasPickers ? COLORS.success : '#B45309'} style={{ marginRight: 5 }} />
                                  <Text style={[styles.pickerLiveText, { color: hasPickers ? COLORS.success : '#B45309' }]}>
                                    {hasPickers ? `${staffOnShift} of ${staffTotal} pickers on shift` : '0 pickers on shift'}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Warning Banner if Store is Active but 0 pickers on shift */}
                            {isStoreActive && !hasPickers && (
                              <View style={styles.unattendedWarningBox}>
                                <AlertTriangle size={13} color="#D97706" style={{ marginRight: 6 }} />
                                <Text style={styles.unattendedWarningText}>
                                  ⚠️ Orders may not be picked — no pickers currently on shift
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* 🔒 1:1 Area Lock and City Identity Banner */}
                        <View style={styles.cardAreaLockBanner}>
                          <View style={styles.cardAreaLockLeft}>
                            <Lock size={12} color={COLORS.purple} />
                            <Text style={styles.cardAreaLockLabel}>1:1 AREA LOCKED:</Text>
                            <Text style={styles.cardAreaLockValue}>
                              {store.areaName || 'Paldi / Central'}
                            </Text>
                          </View>
                          <View style={styles.cardCityBadge}>
                            <MapPin size={11} color={COLORS.hotPink} />
                            <Text style={styles.cardCityBadgeText}>
                              {store.cityName || store.city || cityName}
                            </Text>
                          </View>
                        </View>

                        {/* Authentication Credentials Highlight Box */}
                        <View style={styles.credentialsBox}>
                          <View style={styles.credLeft}>
                            <KeyRound size={16} color={COLORS.purple} style={{ marginRight: 8 }} />
                            <View>
                              <Text style={styles.credLabel}>STORE LOGIN ID</Text>
                              <Text style={styles.credValue}>
                                {hasLogin ? store.loginId : 'No Login ID Assigned'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.credActions}>
                            {hasLogin && (
                              <TouchableOpacity
                                style={styles.copyBtn}
                                onPress={() => copyToClipboard(store.loginId!, 'Store ID')}
                              >
                                <Copy size={13} color={COLORS.textPrimary} />
                                <Text style={styles.copyBtnText}>Copy ID</Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.resetBtn}
                              onPress={() => openResetPasswordModal(store)}
                            >
                              <KeyRound size={13} color={COLORS.purple} />
                              <Text style={styles.resetBtnText}>Reset Password</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Metrics Pill Grid */}
                        <View style={styles.cardMetricsGrid}>
                          <View style={styles.cardMetricItem}>
                            <Package size={14} color={COLORS.hotPink} />
                            <Text style={styles.cardMetricText}>
                              <Text style={styles.cardMetricBold}>{store.orderCount || 0}</Text> Orders
                            </Text>
                          </View>

                          <View style={styles.cardMetricItem}>
                            <Bike size={14} color={COLORS.blue} />
                            <Text style={styles.cardMetricText}>
                              <Text style={styles.cardMetricBold}>{store.riderCount || 0}</Text> Riders
                            </Text>
                          </View>

                          <View style={styles.cardMetricItem}>
                            <Radio size={14} color={COLORS.purple} />
                            <Text style={styles.cardMetricText}>
                              <Text style={styles.cardMetricBold}>{store.serviceRadiusKm || 4.5}</Text> km Radius
                            </Text>
                          </View>

                          <View style={styles.cardMetricItem}>
                            <Clock size={14} color={COLORS.success} />
                            <Text style={styles.cardMetricText}>
                              <Text style={styles.cardMetricBold}>{store.estimatedDeliveryMinutes || 9}</Text> min SLA
                            </Text>
                          </View>
                        </View>

                        {/* Location & Status Footer */}
                        <View style={styles.cardFooter}>
                          <View style={styles.addressRow}>
                            <Navigation size={13} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                            <Text style={styles.addressText} numberOfLines={1}>
                              {store.address
                                ? `${store.address}, ${store.city} - ${store.pincode || ''}`
                                : `${store.city} Hub`}
                            </Text>
                          </View>

                          <View style={styles.footerActions}>
                            <Text style={styles.lastLoginText}>
                              {hasLoggedIn
                                ? `Last Login: ${new Date(store.lastLoginAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : 'Shift: Shared Store Tablet'}
                            </Text>

                            <TouchableOpacity
                              style={styles.deleteBtn}
                              onPress={() => setDeleteConfirmStore(store)}
                            >
                              <Trash2 size={14} color={COLORS.error} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ================= MODAL: CITY FILTER SELECTOR ================= */}
      <Modal
        visible={showCityFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityFilterModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { maxHeight: 420 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Building2 size={20} color={COLORS.hotPink} />
                <Text style={styles.modalTitle}>Filter Stores by City</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCityFilterModal(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Option: All Cities */}
              <TouchableOpacity
                style={[
                  styles.filterOptionItem,
                  selectedCityFilter === 'ALL' && styles.filterOptionItemActive,
                ]}
                onPress={() => {
                  setSelectedCityFilter('ALL');
                  setSelectedAreaFilter('ALL');
                  setShowCityFilterModal(false);
                }}
              >
                <View style={styles.filterOptionLeft}>
                  <Building2 size={16} color={selectedCityFilter === 'ALL' ? COLORS.hotPink : COLORS.textMuted} />
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedCityFilter === 'ALL' && styles.filterOptionTextActive,
                    ]}
                  >
                    All Cities (All Stores)
                  </Text>
                </View>
                {selectedCityFilter === 'ALL' && <Check size={16} color={COLORS.hotPink} />}
              </TouchableOpacity>

              {/* Each Active City */}
              {activeCities.map((city) => {
                const cityIdStr = city.id || city._id || '';
                const isSelected =
                  selectedCityFilter === cityIdStr ||
                  selectedCityFilter.toLowerCase() === city.name.toLowerCase();
                const count = stores.filter(
                  (s) =>
                    (s.cityId && cityIdStr && String(s.cityId) === String(cityIdStr)) ||
                    (s.cityName || s.city || '').toLowerCase() === city.name.toLowerCase()
                ).length;

                return (
                  <TouchableOpacity
                    key={cityIdStr || city.name}
                    style={[
                      styles.filterOptionItem,
                      isSelected && styles.filterOptionItemActive,
                    ]}
                    onPress={() => {
                      setSelectedCityFilter(cityIdStr || city.name);
                      setSelectedAreaFilter('ALL'); // Reset area when city changes
                      setShowCityFilterModal(false);
                    }}
                  >
                    <View style={styles.filterOptionLeft}>
                      <Text style={styles.cityOptionEmoji}>🏙️</Text>
                      <View>
                        <Text
                          style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextActive,
                          ]}
                        >
                          {city.name}
                        </Text>
                        <Text style={styles.filterOptionSubtext}>
                          {count} {count === 1 ? 'Dark Store' : 'Dark Stores'} Assigned
                        </Text>
                      </View>
                    </View>
                    {isSelected && <Check size={16} color={COLORS.hotPink} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: AREA FILTER SELECTOR ================= */}
      <Modal
        visible={showAreaFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAreaFilterModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { maxHeight: 480 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MapPin size={20} color={COLORS.purple} />
                <View>
                  <Text style={styles.modalTitle}>Filter Stores by Area</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedCityFilter === 'ALL'
                      ? 'Showing all areas across all cities'
                      : `Scoped to ${selectedCityLabel} areas`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAreaFilterModal(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Option: All Areas */}
              <TouchableOpacity
                style={[
                  styles.filterOptionItem,
                  selectedAreaFilter === 'ALL' && styles.filterOptionItemActive,
                ]}
                onPress={() => {
                  setSelectedAreaFilter('ALL');
                  setShowAreaFilterModal(false);
                }}
              >
                <View style={styles.filterOptionLeft}>
                  <MapPin size={16} color={selectedAreaFilter === 'ALL' ? COLORS.purple : COLORS.textMuted} />
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedAreaFilter === 'ALL' && styles.filterOptionTextActive,
                    ]}
                  >
                    All Areas
                  </Text>
                </View>
                {selectedAreaFilter === 'ALL' && <Check size={16} color={COLORS.purple} />}
              </TouchableOpacity>

              {/* Each Area */}
              {filterableAreas.map((area) => {
                const areaIdStr = area.id || area._id || '';
                const isSelected =
                  selectedAreaFilter === areaIdStr ||
                  selectedAreaFilter.toLowerCase() === area.name.toLowerCase();

                // Find store assigned to this area
                const assignedStore = stores.find(
                  (s) =>
                    (s.areaId && areaIdStr && String(s.areaId) === String(areaIdStr)) ||
                    (s.areaName && s.areaName.toLowerCase() === area.name.toLowerCase())
                );

                return (
                  <TouchableOpacity
                    key={areaIdStr || area.name}
                    style={[
                      styles.filterOptionItem,
                      isSelected && styles.filterOptionItemActive,
                    ]}
                    onPress={() => {
                      setSelectedAreaFilter(areaIdStr || area.name);
                      setShowAreaFilterModal(false);
                    }}
                  >
                    <View style={styles.filterOptionLeft}>
                      <Lock size={14} color={assignedStore ? COLORS.purple : COLORS.textMuted} />
                      <View>
                        <Text
                          style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextActive,
                          ]}
                        >
                          {area.name}
                        </Text>
                        <Text style={styles.filterOptionSubtext}>
                          {assignedStore
                            ? `Store: ${assignedStore.name}`
                            : 'No Store Currently Assigned'}
                        </Text>
                      </View>
                    </View>
                    {isSelected && <Check size={16} color={COLORS.purple} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: CREATE DARK STORE (WITH CITY & AREA CASCADE) ================= */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Store size={20} color={COLORS.hotPink} />
                <View>
                  <Text style={styles.modalTitle}>Create New Dark Store</Text>
                  <Text style={styles.modalSubtitle}>City → Area → Store 1:1 Architecture</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {createdCredentials ? (
              <View style={styles.successCredBox}>
                <CheckCircle2 size={36} color={COLORS.success} style={{ marginBottom: 12 }} />
                <Text style={styles.successTitle}>Dark Store Created Successfully!</Text>
                <Text style={styles.successDesc}>
                  Share these store credentials with your dark store staff / tablet.
                </Text>

                <View style={styles.credDisplayBox}>
                  <View style={styles.credDisplayRow}>
                    <Text style={styles.credDisplayLabel}>Store Name:</Text>
                    <Text style={styles.credDisplayValue}>{createdCredentials.name}</Text>
                  </View>
                  <View style={styles.credDisplayRow}>
                    <Text style={styles.credDisplayLabel}>Store ID:</Text>
                    <Text style={[styles.credDisplayValue, { color: COLORS.purple, fontWeight: '700' }]}>
                      {createdCredentials.loginId}
                    </Text>
                  </View>
                  <View style={styles.credDisplayRow}>
                    <Text style={styles.credDisplayLabel}>Password:</Text>
                    <Text style={[styles.credDisplayValue, { color: COLORS.hotPink, fontWeight: '700' }]}>
                      {createdCredentials.password}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.copyAllBtn}
                  onPress={() =>
                    copyToClipboard(
                      `🏪 WOMUP STORE LOGIN CREDENTIALS\nStore: ${createdCredentials.name}\nStore ID: ${createdCredentials.loginId}\nPassword: ${createdCredentials.password}\nLogin at: http://localhost:8084`,
                      'Full Credentials'
                    )
                  }
                >
                  <Copy size={16} color={COLORS.white} />
                  <Text style={styles.copyAllBtnText}>Copy Full Credentials</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.doneBtnText}>Close & Return</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Section 1: City & Area Cascading Selectors */}
                <Text style={styles.inputSectionTitle}>1. City & Area Assignment (1:1 Lock)</Text>
                <Text style={styles.helperText}>
                  Each dark store must belong to a verified City and strictly lock to ONE Area.
                </Text>

                {/* City Picker in Modal */}
                <Text style={styles.inputLabel}>Select City *</Text>
                <TouchableOpacity
                  style={styles.modalSelectorBtn}
                  onPress={() => setShowCreateCityPicker(true)}
                >
                  <View style={styles.cascadeBtnContent}>
                    <Building2 size={16} color={COLORS.hotPink} />
                    <Text style={styles.modalSelectorText}>{newCityName}</Text>
                  </View>
                  <ChevronDown size={16} color={COLORS.textMuted} />
                </TouchableOpacity>

                {/* Area Picker in Modal */}
                <Text style={styles.inputLabel}>Select Area (Locks 1:1) *</Text>
                <TouchableOpacity
                  style={[
                    styles.modalSelectorBtn,
                    !newAreaName && styles.modalSelectorBtnPlaceholder,
                  ]}
                  onPress={() => setShowCreateAreaPicker(true)}
                >
                  <View style={styles.cascadeBtnContent}>
                    <MapPin size={16} color={newAreaName ? COLORS.purple : COLORS.textMuted} />
                    <Text
                      style={[
                        styles.modalSelectorText,
                        !newAreaName && { color: COLORS.textMuted },
                      ]}
                    >
                      {newAreaName ? newAreaName : 'Select an unassigned area...'}
                    </Text>
                  </View>
                  <ChevronDown size={16} color={COLORS.textMuted} />
                </TouchableOpacity>

                {/* Section 2: Basic Store Identity */}
                <Text style={[styles.inputSectionTitle, { marginTop: 14 }]}>2. Store Details</Text>

                <Text style={styles.inputLabel}>Store Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Wom Up Satellite Dark Store"
                  value={newStoreName}
                  onChangeText={(v) => handleNameOrCodeChange(v, newStoreCode)}
                />

                <Text style={styles.inputLabel}>Store Code * (Used in order prefixes)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. STORE-SATELLITE"
                  value={newStoreCode}
                  onChangeText={(v) => handleNameOrCodeChange(newStoreName, v)}
                  autoCapitalize="characters"
                />

                {/* Section 3: Credentials */}
                <Text style={styles.inputSectionTitle}>3. Store Login Credentials</Text>
                <Text style={styles.helperText}>
                  All pickers & tablets at this dark store will use this Store ID and Password.
                </Text>

                <Text style={styles.inputLabel}>Store Login ID *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. womupSatellite"
                  value={newLoginId}
                  onChangeText={setNewLoginId}
                  autoCapitalize="none"
                />

                <View style={styles.labelWithAction}>
                  <Text style={styles.inputLabel}>Store Password *</Text>
                  <TouchableOpacity
                    onPress={() => setNewPassword(generateRandomPassword())}
                  >
                    <Text style={styles.generateText}>Generate Random</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Womup@2026"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />

                {/* Section 4: Physical Address & SLA */}
                <Text style={styles.inputSectionTitle}>4. Location & Delivery SLA</Text>

                <Text style={styles.inputLabel}>Physical Address *</Text>
                <TextInput
                  style={[styles.textInput, { height: 50 }]}
                  placeholder="Shop No, Building, Road, Area"
                  value={newAddress}
                  onChangeText={setNewAddress}
                  multiline
                />

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Pincode</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newPincode}
                      onChangeText={setNewPincode}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Service Radius (km)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newRadius}
                      onChangeText={setNewRadius}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Est. Delivery (mins)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newDeliveryMins}
                      onChangeText={setNewDeliveryMins}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Latitude</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newLatitude}
                      onChangeText={setNewLatitude}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitCreateBtn}
                  onPress={handleCreateStore}
                  disabled={createSubmitting}
                >
                  <LinearGradient colors={GRADIENTS.primary} style={styles.submitGradient}>
                    {createSubmitting ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Plus size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                        <Text style={styles.submitBtnText}>Create & Link 1:1 Area Store</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Picker Modal for City in Create Flow */}
      <Modal
        visible={showCreateCityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateCityPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { maxHeight: 380 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Building2 size={18} color={COLORS.hotPink} />
                <Text style={styles.modalTitle}>Choose City for Store</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateCityPicker(false)}>
                <X size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {activeCities.map((c) => (
                <TouchableOpacity
                  key={c.id || c._id || c.name}
                  style={[
                    styles.filterOptionItem,
                    newCityName === c.name && styles.filterOptionItemActive,
                  ]}
                  onPress={() => handleSelectCreateCity(c)}
                >
                  <View style={styles.filterOptionLeft}>
                    <Text style={styles.cityOptionEmoji}>🏙️</Text>
                    <Text style={styles.filterOptionText}>{c.name}</Text>
                  </View>
                  {newCityName === c.name && <Check size={16} color={COLORS.hotPink} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Picker Modal for Area in Create Flow */}
      <Modal
        visible={showCreateAreaPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateAreaPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { maxHeight: 460 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MapPin size={18} color={COLORS.purple} />
                <View>
                  <Text style={styles.modalTitle}>Choose Area for Store</Text>
                  <Text style={styles.modalSubtitle}>1 Area = 1 Dark Store Rule</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCreateAreaPicker(false)}>
                <X size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {zones
                .filter((z) => {
                  if (!newCityName) return true;
                  if (z.cityName && z.cityName.toLowerCase() === newCityName.toLowerCase()) return true;
                  if (z.city && z.city.toLowerCase() === newCityName.toLowerCase()) return true;
                  if (z.cityId && newCityId && String(z.cityId) === String(newCityId)) return true;
                  return false;
                })
                .map((a) => {
                  const areaIdStr = a.id || a._id || '';
                  const assignedStore = stores.find(
                    (s) =>
                      (s.areaId && areaIdStr && String(s.areaId) === String(areaIdStr)) ||
                      (s.areaName && s.areaName.toLowerCase() === a.name.toLowerCase())
                  );

                  return (
                    <TouchableOpacity
                      key={areaIdStr || a.name}
                      style={[
                        styles.filterOptionItem,
                        newAreaName === a.name && styles.filterOptionItemActive,
                      ]}
                      onPress={() => handleSelectCreateArea(a)}
                    >
                      <View style={styles.filterOptionLeft}>
                        <Lock size={14} color={assignedStore ? COLORS.error : COLORS.success} />
                        <View>
                          <Text style={styles.filterOptionText}>{a.name}</Text>
                          <Text
                            style={[
                              styles.filterOptionSubtext,
                              assignedStore && { color: COLORS.error },
                            ]}
                          >
                            {assignedStore
                              ? `⚠️ Already has store: ${assignedStore.name}`
                              : '🟢 Available for new Dark Store'}
                          </Text>
                        </View>
                      </View>
                      {newAreaName === a.name && <Check size={16} color={COLORS.purple} />}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: RESET STORE PASSWORD ================= */}
      <Modal
        visible={!!resetModalStore}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalStore(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { maxHeight: 420 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <KeyRound size={20} color={COLORS.purple} />
                <Text style={styles.modalTitle}>Reset Store Password</Text>
              </View>
              <TouchableOpacity onPress={() => setResetModalStore(null)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.resetStoreName}>{resetModalStore?.name}</Text>
              <Text style={styles.resetStoreCode}>
                Store ID: <Text style={{ color: COLORS.purple, fontWeight: '700' }}>{resetModalStore?.loginId}</Text>
              </Text>

              {resetSuccessMessage ? (
                <View style={styles.successResetBox}>
                  <CheckCircle2 size={24} color={COLORS.success} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.successResetTitle}>{resetSuccessMessage}</Text>
                    <Text style={styles.successResetPwd}>New Password: {resetPasswordValue}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copySmallBtn}
                    onPress={() => copyToClipboard(resetPasswordValue, 'New Password')}
                  >
                    <Copy size={14} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.labelWithAction}>
                    <Text style={styles.inputLabel}>New Password *</Text>
                    <TouchableOpacity
                      onPress={() => setResetPasswordValue(generateRandomPassword())}
                    >
                      <Text style={styles.generateText}>Generate Random</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.passwordInputRow}>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                      value={resetPasswordValue}
                      onChangeText={setResetPasswordValue}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={COLORS.textMuted} />
                      ) : (
                        <Eye size={18} color={COLORS.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitCreateBtn, { marginTop: SPACING.md }]}
                    onPress={handleResetPassword}
                    disabled={resetSubmitting}
                  >
                    <LinearGradient colors={GRADIENTS.cardBadge} style={styles.submitGradient}>
                      {resetSubmitting ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={styles.submitBtnText}>Update Store Password</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      <Modal
        visible={!!deleteConfirmStore}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmStore(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { maxHeight: 320 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Trash2 size={20} color={COLORS.error} />
                <Text style={[styles.modalTitle, { color: COLORS.error }]}>Delete Dark Store</Text>
              </View>
              <TouchableOpacity onPress={() => setDeleteConfirmStore(null)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.deleteConfirmText}>
                Are you sure you want to permanently delete:
              </Text>
              <Text style={styles.deleteTargetStore}>{deleteConfirmStore?.name}</Text>
              <Text style={styles.deleteWarning}>
                This action is irreversible. Stores with active in-flight orders cannot be deleted.
              </Text>

              <View style={styles.deleteActionRow}>
                <TouchableOpacity
                  style={styles.cancelDeleteBtn}
                  onPress={() => setDeleteConfirmStore(null)}
                >
                  <Text style={styles.cancelDeleteText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmDeleteBtn}
                  onPress={handleDeleteStore}
                  disabled={deleteSubmitting}
                >
                  {deleteSubmitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.confirmDeleteText}>Delete Hub</Text>
                  )}
                </TouchableOpacity>
              </View>
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
  },
  topHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: RADIUS.card,
    borderBottomRightRadius: RADIUS.card,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerTitleCol: {
    flex: 1,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  createStoreBtn: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
  },
  createBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.secondaryText,
    marginTop: 2,
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBackground,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  cascadeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cascadeDropdownCol: {
    flex: 1,
  },
  cascadeFilterLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cascadeDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cascadeDropdownBtnActive: {
    borderColor: COLORS.purple,
    backgroundColor: '#F8F6FF',
  },
  cascadeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 4,
  },
  cascadeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cascadeBtnTextActive: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignSelf: 'flex-end',
  },
  clearFiltersText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  emptyActionBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  emptyActionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: 16,
  },
  citySectionGroup: {
    marginBottom: 8,
  },
  citySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.hotPink,
    borderWidth: 1,
    borderColor: '#ECEAF3',
    marginBottom: 10,
  },
  citySectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  citySectionEmoji: {
    fontSize: 18,
  },
  citySectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  cityStoreCountBadge: {
    backgroundColor: '#F3F0FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  cityStoreCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  cityHubStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F9F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  cityHubStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  cityStoresList: {
    gap: 12,
  },
  storeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeMainInfo: {
    flex: 1,
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F9F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },
  statusOnlineTag: {
    backgroundColor: '#E6F9F0',
    borderWidth: 1,
    borderColor: '#B7F0D0',
  },
  statusWarningTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusInactiveTag: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F9F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  pickerLiveIndicatorWarning: {
    backgroundColor: '#FEF3C7',
  },
  pickerLiveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unattendedWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  unattendedWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
    flex: 1,
  },
  storeCode: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  cardAreaLockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F6FF',
    borderWidth: 1,
    borderColor: '#E9E4F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  cardAreaLockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardAreaLockLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.5,
  },
  cardAreaLockValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardCityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBF3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  cardCityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  credentialsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F6FD',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E7E4F9',
    marginBottom: 12,
  },
  credLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  credLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.5,
  },
  credValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  credActions: {
    flexDirection: 'row',
    gap: 6,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.purple,
    gap: 4,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  cardMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  cardMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardMetricText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cardMetricBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0EFF6',
    paddingTop: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  addressText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastLoginText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 5,
    borderRadius: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  modalBody: {
    padding: SPACING.md,
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#ECEAF3',
  },
  filterOptionItemActive: {
    backgroundColor: '#F3F0FA',
    borderColor: COLORS.purple,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cityOptionEmoji: {
    fontSize: 16,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  filterOptionTextActive: {
    color: COLORS.purple,
  },
  filterOptionSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  inputSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.purple,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    marginTop: 6,
  },
  modalSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  modalSelectorBtnPlaceholder: {
    borderColor: '#D4CEE8',
    backgroundColor: '#FAF9FE',
  },
  modalSelectorText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  labelWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  textInput: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: {
    flex: 1,
  },
  submitCreateBtn: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  successCredBox: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  credDisplayBox: {
    width: '100%',
    backgroundColor: '#F7F6FD',
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E7E4F9',
    gap: 8,
    marginBottom: SPACING.md,
  },
  credDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  credDisplayLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  credDisplayValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  copyAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10,
  },
  copyAllBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  doneBtn: {
    paddingVertical: 8,
  },
  doneBtnText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  resetStoreName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  resetStoreCode: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  successResetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F9F0',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  successResetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.success,
  },
  successResetPwd: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  copySmallBtn: {
    backgroundColor: COLORS.success,
    padding: 6,
    borderRadius: 6,
  },
  deleteConfirmText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  deleteTargetStore: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.error,
    marginBottom: 10,
  },
  deleteWarning: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  deleteActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelDeleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
  },
  cancelDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  confirmDeleteBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.error,
  },
  confirmDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});
