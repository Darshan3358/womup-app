import React, { useState, useEffect, useMemo } from 'react';
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
  FlatList,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DollarSign,
  TrendingUp,
  MapPin,
  Building2,
  Globe,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  ShieldCheck,
  Zap,
  Layers,
  X,
  RefreshCw,
  Calculator,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { PayoutRateItem, PayoutScope, PayoutStats, CityItem, Zone } from '../types/admin';
import { ApiService } from '../services/api';
import { AddPayoutRateModal } from './modals/AddPayoutRateModal';

export const PayoutRatesScreen: React.FC = () => {
  const { cities, zones } = useAdminState();

  // Primary list state
  const [rates, setRates] = useState<PayoutRateItem[]>([]);
  const [globalRate, setGlobalRate] = useState<PayoutRateItem>({
    id: 'global_default',
    scope: 'GLOBAL',
    ratePerKm: 10,
    minimumPayout: 30,
    maximumPayout: 150,
    isActive: true,
    description: 'Universal fallback payout rate',
  });
  const [stats, setStats] = useState<PayoutStats>({
    totalRates: 1,
    activeOverridesCount: 0,
    globalRatePerKm: 10,
    rateRangeText: '₹10 - ₹10',
    minRate: 10,
    maxRate: 10,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Global Rate Inline Editing
  const [editingGlobal, setEditingGlobal] = useState<boolean>(false);
  const [globalRateInput, setGlobalRateInput] = useState<string>('10');
  const [globalMinInput, setGlobalMinInput] = useState<string>('30');
  const [globalMaxInput, setGlobalMaxInput] = useState<string>('150');
  const [globalSaving, setGlobalSaving] = useState<boolean>(false);

  // Filters
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'CITY' | 'AREA'>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PayoutRateItem | null>(null);
  const [modalScope, setModalScope] = useState<PayoutScope>('AREA');

  // Simulator State
  const [simCity, setSimCity] = useState<CityItem | null>(null);
  const [simArea, setSimArea] = useState<Zone | null>(null);
  const [simDistance, setSimDistance] = useState<string>('5.0');
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Simulator Dropdown Pickers
  const [showSimCityPicker, setShowSimCityPicker] = useState<boolean>(false);
  const [simCitySearch, setSimCitySearch] = useState<string>('');
  const [showSimAreaPicker, setShowSimAreaPicker] = useState<boolean>(false);
  const [simAreaSearch, setSimAreaSearch] = useState<string>('');

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Update simulator defaults when cities/zones load
  useEffect(() => {
    if (!simCity && cities.length > 0) {
      const firstCity = cities[0];
      setSimCity(firstCity);
      const cId = String(firstCity.id || firstCity._id || '');
      const cName = firstCity.name.toLowerCase().trim();
      const firstZone = zones.find(
        (z) =>
          (z.cityId && String(z.cityId) === cId) ||
          (z.cityName && z.cityName.toLowerCase().trim() === cName) ||
          (z.city && z.city.toLowerCase().trim() === cName)
      );
      setSimArea(firstZone || zones[0] || null);
    }
  }, [cities, zones, simCity]);

  // Run initial simulation
  useEffect(() => {
    if (simCity) {
      runSimulation();
    }
  }, [simCity, simArea, simDistance, rates, globalRate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await ApiService.fetchPayoutRates();
      if (res.success) {
        setRates(res.data);
        if (res.globalRate) {
          setGlobalRate(res.globalRate);
          setGlobalRateInput(String(res.globalRate.ratePerKm || 10));
          setGlobalMinInput(String(res.globalRate.minimumPayout || 30));
          setGlobalMaxInput(String(res.globalRate.maximumPayout || 150));
        }
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.warn('Failed loading payout rates:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Update Global Default Rate
  const handleSaveGlobalRate = async () => {
    const rateVal = parseFloat(globalRateInput);
    const minVal = parseFloat(globalMinInput);
    const maxVal = parseFloat(globalMaxInput);

    if (isNaN(rateVal) || rateVal <= 0) {
      Alert.alert('Validation Error', 'Rate per kilometer must be a positive number');
      return;
    }
    if (minVal > maxVal) {
      Alert.alert('Validation Error', 'Minimum payout cannot exceed maximum payout');
      return;
    }

    try {
      setGlobalSaving(true);
      const res = await ApiService.createPayoutRate({
        id: globalRate.id || globalRate._id,
        scope: 'GLOBAL',
        ratePerKm: rateVal,
        minimumPayout: isNaN(minVal) ? 30 : minVal,
        maximumPayout: isNaN(maxVal) ? 150 : maxVal,
        isActive: true,
        description: 'Universal fallback payout rate',
      });

      if (res.success) {
        setEditingGlobal(false);
        await loadData();
        Alert.alert('Success', 'Global default payout rate updated successfully.');
      } else {
        Alert.alert('Error', res.error || 'Failed updating global rate');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error');
    } finally {
      setGlobalSaving(false);
    }
  };

  // Open Modal for Add
  const handleOpenAddModal = (presetScope: PayoutScope = 'AREA') => {
    setEditingItem(null);
    setModalScope(presetScope);
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: PayoutRateItem) => {
    setEditingItem(item);
    setModalScope(item.scope);
    setShowModal(true);
  };

  // Toggle active status
  const handleToggleActive = async (item: PayoutRateItem) => {
    const id = item.id || item._id;
    if (!id) return;
    try {
      const res = await ApiService.togglePayoutRate(id);
      if (res.success) {
        setRates((prev) =>
          prev.map((r) => ((r.id || r._id) === id ? { ...r, isActive: res.isActive ?? !r.isActive } : r))
        );
      } else {
        Alert.alert('Error', res.error || 'Failed toggling rate');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  // Delete rate
  const handleDeleteRate = (item: PayoutRateItem) => {
    const id = item.id || item._id;
    if (!id) return;

    const label =
      item.scope === 'AREA'
        ? `${item.cityName} → ${item.areaName}`
        : `${item.cityName} (City-wide)`;

    const executeDelete = async () => {
      try {
        const res = await ApiService.deletePayoutRate(id);
        if (res.success) {
          setRates((prev) => prev.filter((r) => (r.id || r._id) !== id));
          Alert.alert('Deleted', `Rate for ${label} has been removed.`);
          loadData();
        } else {
          Alert.alert('Error', res.error || 'Failed deleting rate');
        }
      } catch (err: any) {
        Alert.alert('Error', err.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete rate for ${label}?`)) {
        executeDelete();
      }
    } else {
      Alert.alert('Delete Rate', `Are you sure you want to delete payout rate for ${label}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  // Run resolution simulation
  const runSimulation = async () => {
    const dist = parseFloat(simDistance) || 5.0;
    try {
      setSimulating(true);
      const res = await ApiService.resolvePayoutRatePreview({
        cityId: simCity ? simCity.id || simCity._id : undefined,
        cityName: simCity ? simCity.name : undefined,
        areaId: simArea ? simArea.id || simArea._id : undefined,
        areaName: simArea ? simArea.name : undefined,
        distanceKm: dist,
      });
      if (res && res.success) {
        setSimResult(res);
      }
    } catch (err) {
      console.warn('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Simulator Areas for Selected Simulator City
  const simCityAreas = useMemo(() => {
    if (!simCity) return zones;
    const cId = String(simCity.id || simCity._id || '');
    const cName = simCity.name.toLowerCase().trim();
    const matched = zones.filter((z) => {
      if (z.cityId && String(z.cityId) === cId) return true;
      if (z.cityName && z.cityName.toLowerCase().trim() === cName) return true;
      if (z.city && z.city.toLowerCase().trim() === cName) return true;
      return false;
    });
    return matched.length > 0 ? matched : zones;
  }, [zones, simCity]);

  // Filtered simulator cities
  const filteredSimCities = useMemo(() => {
    if (!simCitySearch.trim()) return cities;
    const q = simCitySearch.toLowerCase();
    return cities.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q))
    );
  }, [cities, simCitySearch]);

  // Filtered simulator areas
  const filteredSimAreas = useMemo(() => {
    if (!simAreaSearch.trim()) return simCityAreas;
    const q = simAreaSearch.toLowerCase();
    return simCityAreas.filter((a) => a.name.toLowerCase().includes(q));
  }, [simCityAreas, simAreaSearch]);

  // Filtered overrides list
  const filteredOverrides = useMemo(() => {
    return rates.filter((r) => {
      if (r.scope === 'GLOBAL') return false;
      if (scopeFilter !== 'ALL' && r.scope !== scopeFilter) return false;
      if (cityFilter !== 'ALL' && r.cityName?.toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cMatch = r.cityName?.toLowerCase().includes(q);
        const aMatch = r.areaName?.toLowerCase().includes(q);
        const dMatch = r.description?.toLowerCase().includes(q);
        const rMatch = String(r.ratePerKm).includes(q);
        if (!cMatch && !aMatch && !dMatch && !rMatch) return false;
      }
      return true;
    });
  }, [rates, scopeFilter, cityFilter, searchQuery]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <DollarSign size={24} color={COLORS.hotPink} />
          </View>
          <View>
            <Text style={styles.title}>Rider Payout Rate Management</Text>
            <Text style={styles.subtitle}>
              Configure per-km earning rates with City & Area overrides
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} color={COLORS.textPrimary} />
            <Text style={styles.refreshBtnText}>{refreshing ? 'Updating...' : 'Refresh'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleOpenAddModal('AREA')}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addBtnGradient}
            >
              <Plus size={18} color="#FFF" />
              <Text style={styles.addBtnText}>+ ADD NEW RATE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. KPI Summary Strip */}
      <View style={styles.kpiContainer}>
        {/* Global Rate Card */}
        <View style={[styles.kpiCard, styles.kpiBorderPrimary]}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>GLOBAL BASE RATE</Text>
            <Globe size={18} color={COLORS.hotPink} />
          </View>
          <Text style={styles.kpiValue}>₹{globalRate.ratePerKm || 10}</Text>
          <Text style={styles.kpiNote}>
            Floor ₹{globalRate.minimumPayout || 30} · Cap ₹{globalRate.maximumPayout || 150}
          </Text>
        </View>

        {/* Active Overrides Card */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>ACTIVE OVERRIDES</Text>
            <Layers size={18} color={COLORS.purple} />
          </View>
          <Text style={styles.kpiValue}>
            {stats.activeOverridesCount || rates.filter((r) => r.scope !== 'GLOBAL' && r.isActive).length}
          </Text>
          <Text style={styles.kpiNote}>City & Area specific rules</Text>
        </View>

        {/* Rate Range Card */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>RATE RANGE</Text>
            <TrendingUp size={18} color={COLORS.blue} />
          </View>
          <Text style={styles.kpiValue}>{stats.rateRangeText || '₹8 - ₹18'}</Text>
          <Text style={styles.kpiNote}>Lowest to highest per-km</Text>
        </View>

        {/* Hierarchy Indicator */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>PRIORITY ORDER</Text>
            <ShieldCheck size={18} color={COLORS.success} />
          </View>
          <Text style={[styles.kpiValue, { fontSize: 16, marginTop: 4 }]}>
            Area → City → Global
          </Text>
          <Text style={styles.kpiNote}>Granular wins over default</Text>
        </View>
      </View>

      {/* 3. Global Default Rate Box */}
      <View style={styles.globalCard}>
        <View style={styles.globalCardHeader}>
          <View style={styles.globalTitleRow}>
            <View style={styles.globalBadge}>
              <Globe size={16} color="#FFF" />
              <Text style={styles.globalBadgeText}>GLOBAL DEFAULT RATE</Text>
            </View>
            <Text style={styles.globalCardSub}>
              Applies to all rider deliveries across all cities unless overridden
            </Text>
          </View>

          {!editingGlobal ? (
            <TouchableOpacity
              style={styles.editGlobalBtn}
              onPress={() => setEditingGlobal(true)}
            >
              <Edit2 size={15} color={COLORS.blue} />
              <Text style={styles.editGlobalBtnText}>Edit Global Rate</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActionsRow}>
              <TouchableOpacity
                style={styles.cancelGlobalBtn}
                onPress={() => setEditingGlobal(false)}
              >
                <Text style={styles.cancelGlobalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveGlobalBtn}
                onPress={handleSaveGlobalRate}
                disabled={globalSaving}
              >
                <Text style={styles.saveGlobalBtnText}>
                  {globalSaving ? 'Saving...' : 'Save Global'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.globalParamsRow}>
          {/* Rate per KM */}
          <View style={styles.paramBox}>
            <Text style={styles.paramLabel}>Rate Per Kilometer</Text>
            {editingGlobal ? (
              <View style={styles.paramInputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.paramInput}
                  value={globalRateInput}
                  onChangeText={setGlobalRateInput}
                  keyboardType="numeric"
                  placeholder="10"
                />
                <Text style={styles.unitSuffix}>/ km</Text>
              </View>
            ) : (
              <View style={styles.paramDisplay}>
                <Text style={styles.paramValueText}>₹{globalRate.ratePerKm || 10}</Text>
                <Text style={styles.paramUnitText}>/ km</Text>
              </View>
            )}
            <Text style={styles.paramHint}>Formula: Distance × Rate</Text>
          </View>

          {/* Min Floor */}
          <View style={styles.paramBox}>
            <Text style={styles.paramLabel}>Minimum Payout Floor</Text>
            {editingGlobal ? (
              <View style={styles.paramInputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.paramInput}
                  value={globalMinInput}
                  onChangeText={setGlobalMinInput}
                  keyboardType="numeric"
                  placeholder="30"
                />
              </View>
            ) : (
              <View style={styles.paramDisplay}>
                <Text style={styles.paramValueText}>₹{globalRate.minimumPayout || 30}</Text>
              </View>
            )}
            <Text style={styles.paramHint}>Guaranteed even for &lt; 3 km</Text>
          </View>

          {/* Max Cap */}
          <View style={styles.paramBox}>
            <Text style={styles.paramLabel}>Maximum Payout Cap</Text>
            {editingGlobal ? (
              <View style={styles.paramInputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.paramInput}
                  value={globalMaxInput}
                  onChangeText={setGlobalMaxInput}
                  keyboardType="numeric"
                  placeholder="150"
                />
              </View>
            ) : (
              <View style={styles.paramDisplay}>
                <Text style={styles.paramValueText}>₹{globalRate.maximumPayout || 150}</Text>
              </View>
            )}
            <Text style={styles.paramHint}>Cap for long distance deliveries</Text>
          </View>
        </View>
      </View>

      {/* 4. Live Resolution Simulator / Calculator */}
      <View style={styles.simCard}>
        <View style={styles.simHeader}>
          <View style={styles.simIconWrap}>
            <Calculator size={20} color={COLORS.purple} />
          </View>
          <View>
            <Text style={styles.simTitle}>Live Rate Resolution Simulator</Text>
            <Text style={styles.simSub}>
              Verify which rate wins and test payout calculations in real-time
            </Text>
          </View>
        </View>

        <View style={styles.simBody}>
          <View style={styles.simInputsRow}>
            {/* City Dropdown */}
            <View style={styles.simField}>
              <Text style={styles.simFieldLabel}>City</Text>
              <TouchableOpacity
                style={styles.simSelectWrap}
                onPress={() => setShowSimCityPicker(true)}
                activeOpacity={0.7}
              >
                <Building2 size={16} color={COLORS.blue} style={{ marginRight: 8 }} />
                <Text style={styles.simSelectText}>
                  {simCity ? simCity.name : 'Select City'}
                </Text>
                <ChevronDown size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Area Dropdown */}
            <View style={styles.simField}>
              <Text style={styles.simFieldLabel}>Area / Zone</Text>
              <TouchableOpacity
                style={styles.simSelectWrap}
                onPress={() => setShowSimAreaPicker(true)}
                activeOpacity={0.7}
              >
                <MapPin size={16} color={COLORS.hotPink} style={{ marginRight: 8 }} />
                <Text style={styles.simSelectText}>
                  {simArea ? simArea.name : 'Select Area'}
                </Text>
                <ChevronDown size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Distance Input */}
            <View style={[styles.simField, { flex: 0.8 }]}>
              <Text style={styles.simFieldLabel}>Total Distance (km)</Text>
              <View style={styles.simSelectWrap}>
                <Zap size={16} color={COLORS.hotPink} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.simInputText}
                  value={simDistance}
                  onChangeText={setSimDistance}
                  keyboardType="numeric"
                  placeholder="5.0"
                />
                <Text style={{ fontSize: 13, color: COLORS.textMuted }}>km</Text>
              </View>
            </View>
          </View>

          {/* Simulation Output Result Box */}
          {simResult && simResult.success && (
            <View style={styles.simResultBox}>
              <View style={styles.simResultLeft}>
                <View style={styles.winningBadgeRow}>
                  <Text style={styles.winningBadgeLabel}>Winning Rate:</Text>
                  <View
                    style={[
                      styles.scopeBadgeSmall,
                      simResult.winningScope === 'AREA'
                        ? styles.badgeArea
                        : simResult.winningScope === 'CITY'
                        ? styles.badgeCity
                        : styles.badgeGlobal,
                    ]}
                  >
                    <Text style={styles.scopeBadgeSmallText}>
                      {simResult.winningScope} PRIORITY
                    </Text>
                  </View>
                  <Text style={styles.rateUsedText}>
                    ₹{simResult.calculation?.ratePerKm}/km
                  </Text>
                </View>
                <Text style={styles.simBreakdownText}>
                  {simResult.calculation?.distanceKm} km × ₹{simResult.calculation?.ratePerKm}/km = ₹
                  {simResult.calculation?.rawPayout}
                  {simResult.calculation?.minimumFloorApplied
                    ? ` → Floor applied (₹${simResult.calculation?.finalPayout})`
                    : simResult.calculation?.maximumCapApplied
                    ? ` → Cap applied (₹${simResult.calculation?.finalPayout})`
                    : ''}
                </Text>
              </View>

              <View style={styles.simResultRight}>
                <Text style={styles.simTotalLabel}>Calculated Rider Payout</Text>
                <Text style={styles.simTotalValue}>
                  ₹{simResult.calculation?.finalPayout || 0}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 5. City & Area Overrides Section */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>City & Area Overrides</Text>
          <Text style={styles.sectionSubtitle}>
            Specific rates taking precedence over the global default
          </Text>
        </View>
      </View>

      {/* Filter and Search Bar */}
      <View style={styles.filterBar}>
        {/* Scope Pill Selector */}
        <View style={styles.scopeTabs}>
          {(['ALL', 'AREA', 'CITY'] as const).map((sc) => (
            <TouchableOpacity
              key={sc}
              style={[styles.scopeTabBtn, scopeFilter === sc && styles.scopeTabBtnActive]}
              onPress={() => setScopeFilter(sc)}
            >
              <Text
                style={[
                  styles.scopeTabText,
                  scopeFilter === sc && styles.scopeTabTextActive,
                ]}
              >
                {sc === 'ALL'
                  ? 'All Scopes'
                  : sc === 'AREA'
                  ? 'Area Specific'
                  : 'City Wide'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by city, area or rate..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Overrides Cards List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.hotPink} />
          <Text style={styles.loadingText}>Loading payout rates...</Text>
        </View>
      ) : filteredOverrides.length === 0 ? (
        <View style={styles.emptyCard}>
          <Layers size={36} color={COLORS.secondaryText} />
          <Text style={styles.emptyTitle}>No Override Rates Found</Text>
          <Text style={styles.emptySub}>
            {rates.length === 0 || rates.length === 1
              ? 'Currently only the Global Default rate is active. Add city or area overrides to offer targeted rates.'
              : 'No rates matched your search/filter criteria.'}
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => handleOpenAddModal('AREA')}
          >
            <Text style={styles.emptyBtnText}>+ Add New Rate</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardsGrid}>
          {filteredOverrides.map((item) => {
            const isArea = item.scope === 'AREA';
            const id = item.id || item._id || '';

            return (
              <View
                key={id}
                style={[
                  styles.rateCard,
                  !item.isActive && styles.rateCardInactive,
                ]}
              >
                {/* Top Badge & Rate */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.scopeBadge,
                        isArea ? styles.badgeArea : styles.badgeCity,
                      ]}
                    >
                      {isArea ? (
                        <MapPin size={12} color="#FFF" style={{ marginRight: 4 }} />
                      ) : (
                        <Building2 size={12} color="#FFF" style={{ marginRight: 4 }} />
                      )}
                      <Text style={styles.scopeBadgeText}>
                        {isArea ? 'AREA OVERRIDE' : 'CITY WIDE'}
                      </Text>
                    </View>

                    <Text style={styles.cardLocationTitle}>
                      {isArea
                        ? `${item.cityName} → ${item.areaName}`
                        : item.cityName}
                    </Text>
                  </View>

                  <View style={styles.ratePill}>
                    <Text style={styles.ratePillValue}>₹{item.ratePerKm}</Text>
                    <Text style={styles.ratePillSuffix}>/km</Text>
                  </View>
                </View>

                {/* Sub details */}
                <Text style={styles.cardSubText}>
                  {isArea
                    ? `Highest priority override for ${item.areaName}`
                    : `Default rate for all areas in ${item.cityName}`}
                </Text>

                {/* Min / Max bounds */}
                <View style={styles.boundsRow}>
                  <View style={styles.boundItem}>
                    <Text style={styles.boundLabel}>Floor (Min)</Text>
                    <Text style={styles.boundValue}>₹{item.minimumPayout || 30}</Text>
                  </View>
                  <View style={styles.boundDivider} />
                  <View style={styles.boundItem}>
                    <Text style={styles.boundLabel}>Cap (Max)</Text>
                    <Text style={styles.boundValue}>₹{item.maximumPayout || 150}</Text>
                  </View>
                  <View style={styles.boundDivider} />
                  <View style={styles.boundItem}>
                    <Text style={styles.boundLabel}>Status</Text>
                    <Text
                      style={[
                        styles.boundValue,
                        { color: item.isActive ? COLORS.success : COLORS.error },
                      ]}
                    >
                      {item.isActive ? 'Active' : 'Paused'}
                    </Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    "{item.description}"
                  </Text>
                ) : null}

                {/* Bottom Actions */}
                <View style={styles.cardBottomRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      item.isActive ? styles.toggleBtnActive : styles.toggleBtnInactive,
                    ]}
                    onPress={() => handleToggleActive(item)}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        item.isActive
                          ? styles.toggleBtnTextActive
                          : styles.toggleBtnTextInactive,
                      ]}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.cardActionBtns}>
                    <TouchableOpacity
                      style={styles.cardIconBtn}
                      onPress={() => handleOpenEditModal(item)}
                    >
                      <Edit2 size={16} color={COLORS.blue} />
                      <Text style={styles.cardIconBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cardIconBtn, { marginLeft: 12 }]}
                      onPress={() => handleDeleteRate(item)}
                    >
                      <Trash2 size={16} color={COLORS.error} />
                      <Text style={[styles.cardIconBtnText, { color: COLORS.error }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 6. Modular Add/Edit Rate Modal with Proper Dropdowns */}
      <AddPayoutRateModal
        visible={showModal}
        editingItem={editingItem}
        initialScope={modalScope}
        onClose={() => setShowModal(false)}
        onSaved={loadData}
      />

      {/* 7. Simulator City Picker Modal */}
      <Modal
        visible={showSimCityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSimCityPicker(false)}
      >
        <View style={styles.simPickerOverlay}>
          <View style={styles.simPickerSheet}>
            <View style={styles.simPickerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} color={COLORS.navy} />
                <Text style={styles.simPickerTitle}>Select Simulator City</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSimCityPicker(false)}>
                <X size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.simPickerSearch}>
              <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 13, color: COLORS.navy }}
                placeholder="Search city..."
                value={simCitySearch}
                onChangeText={setSimCitySearch}
              />
            </View>

            <FlatList
              data={filteredSimCities}
              keyExtractor={(item) => item.id || item._id || item.name}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isChosen = simCity && (simCity.id === item.id || simCity.name === item.name);
                return (
                  <TouchableOpacity
                    style={[styles.simPickerItem, isChosen && styles.simPickerItemActive]}
                    onPress={() => {
                      setSimCity(item);
                      // Update area to first matching area
                      const cId = String(item.id || item._id || '');
                      const cName = item.name.toLowerCase().trim();
                      const matched = zones.find(
                        (z) =>
                          (z.cityId && String(z.cityId) === cId) ||
                          (z.cityName && z.cityName.toLowerCase().trim() === cName) ||
                          (z.city && z.city.toLowerCase().trim() === cName)
                      );
                      setSimArea(matched || zones[0] || null);
                      setShowSimCityPicker(false);
                    }}
                  >
                    <Text style={[styles.simPickerItemText, isChosen && { color: COLORS.hotPink, fontWeight: '700' }]}>
                      {item.name}
                    </Text>
                    {isChosen && <Check size={16} color={COLORS.hotPink} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* 8. Simulator Area Picker Modal */}
      <Modal
        visible={showSimAreaPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSimAreaPicker(false)}
      >
        <View style={styles.simPickerOverlay}>
          <View style={styles.simPickerSheet}>
            <View style={styles.simPickerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} color={COLORS.hotPink} />
                <Text style={styles.simPickerTitle}>
                  Select Area in {simCity?.name || 'City'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSimAreaPicker(false)}>
                <X size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.simPickerSearch}>
              <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 13, color: COLORS.navy }}
                placeholder="Search area..."
                value={simAreaSearch}
                onChangeText={setSimAreaSearch}
              />
            </View>

            <FlatList
              data={filteredSimAreas}
              keyExtractor={(item) => item.id || item._id || item.name}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isChosen = simArea && (simArea.id === item.id || simArea.name === item.name);
                return (
                  <TouchableOpacity
                    style={[styles.simPickerItem, isChosen && styles.simPickerItemActive]}
                    onPress={() => {
                      setSimArea(item);
                      setShowSimAreaPicker(false);
                    }}
                  >
                    <Text style={[styles.simPickerItemText, isChosen && { color: COLORS.hotPink, fontWeight: '700' }]}>
                      {item.name}
                    </Text>
                    {isChosen && <Check size={16} color={COLORS.hotPink} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.button,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addBtn: {
    borderRadius: RADIUS.button,
    overflow: 'hidden',
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 6,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E9F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiBorderPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.hotPink,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 6,
  },
  kpiNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  globalCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E3E5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  globalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1FA',
    flexWrap: 'wrap',
    gap: 10,
  },
  globalTitleRow: {
    flex: 1,
    minWidth: 180,
  },
  globalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  globalBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  globalCardSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  editGlobalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.lightBlueLavender,
    gap: 6,
  },
  editGlobalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.blue,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelGlobalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.button,
    backgroundColor: '#F0F1FA',
  },
  cancelGlobalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  saveGlobalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.hotPink,
  },
  saveGlobalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  globalParamsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  paramBox: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#FAFBFD',
    borderRadius: RADIUS.input,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF8',
  },
  paramLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  paramDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  paramValueText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.navy,
  },
  paramUnitText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  paramInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.hotPink,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.hotPink,
    marginRight: 4,
  },
  paramInput: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
    minWidth: 60,
  },
  unitSuffix: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  paramHint: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 6,
  },
  simCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E0FA',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  simIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3EDFD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  simSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  simBody: {
    gap: 14,
  },
  simInputsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  simField: {
    flex: 1,
    minWidth: 130,
  },
  simFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  simSelectWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
    borderColor: '#ECEEF8',
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  simSelectText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  simInputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  simResultBox: {
    backgroundColor: '#F8F6FD',
    borderRadius: RADIUS.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E7DCF8',
    gap: 10,
  },
  simResultLeft: {
    width: '100%',
    gap: 4,
  },
  winningBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  winningBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
  },
  rateUsedText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  simBreakdownText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  simResultRight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E7DCF8',
  },
  simTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  simTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.hotPink,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 12,
  },
  scopeTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.button,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E8E9F3',
    gap: 4,
  },
  scopeTabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
  },
  scopeTabBtnActive: {
    backgroundColor: COLORS.navy,
  },
  scopeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  scopeTabTextActive: {
    color: '#FFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8E9F3',
    borderRadius: RADIUS.button,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 260,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  rateCard: {
    flex: 1,
    minWidth: 320,
    maxWidth: 520,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E9F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rateCardInactive: {
    opacity: 0.65,
    backgroundColor: '#FCFCFD',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  scopeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  scopeBadgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
  },
  scopeBadgeSmallText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeArea: {
    backgroundColor: COLORS.hotPink,
  },
  badgeCity: {
    backgroundColor: COLORS.blue,
  },
  badgeGlobal: {
    backgroundColor: COLORS.navy,
  },
  scopeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardLocationTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  ratePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EADCF7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
  },
  ratePillValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.purple,
  },
  ratePillSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  cardSubText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  boundsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FE',
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  boundItem: {
    flex: 1,
    alignItems: 'center',
  },
  boundDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E4E6F3',
  },
  boundLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  boundValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    marginBottom: 14,
    backgroundColor: '#FFFDF9',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F1FA',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
  },
  toggleBtnActive: {
    backgroundColor: '#E6F8EE',
  },
  toggleBtnInactive: {
    backgroundColor: '#FDEEEF',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: COLORS.success,
  },
  toggleBtnTextInactive: {
    color: COLORS.error,
  },
  cardActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cardIconBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.blue,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E9F3',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 400,
    marginTop: 6,
    marginBottom: 18,
  },
  emptyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.hotPink,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  simPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  simPickerSheet: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  simPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1FA',
  },
  simPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  simPickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#ECEEF8',
    borderRadius: RADIUS.input,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  simPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  simPickerItemActive: {
    backgroundColor: '#FDF0F7',
  },
  simPickerItemText: {
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '600',
  },
});
