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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DollarSign,
  Globe,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Edit2,
  Trash2,
  Calculator,
  ChevronDown,
  Check,
  X,
  Store,
  RefreshCw,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { PayoutRateItem, PayoutScope } from '../types/admin';
import { ApiService } from '../services/api';

export const PayoutRatesScreen: React.FC = () => {
  const { cities, zones } = useAdminState();

  // 100% Website Parity Default Live Rates (Matching localhost:5175)
  const initialRates: PayoutRateItem[] = [
    {
      id: 'global_default',
      scope: 'GLOBAL',
      ratePerKm: 12,
      minimumPayout: 35,
      maximumPayout: 160,
      isActive: true,
      description: 'Universal fallback payout rate for all standard deliveries',
    },
    {
      id: 'city_amd',
      scope: 'CITY',
      cityName: 'Ahmedabad',
      ratePerKm: 14,
      minimumPayout: 40,
      maximumPayout: 180,
      isActive: true,
      description: 'Metropolitan express rate for Ahmedabad city limits',
    },
    {
      id: 'area_prahlad',
      scope: 'AREA',
      cityName: 'Ahmedabad',
      areaName: 'Prahlad Nagar',
      ratePerKm: 16,
      minimumPayout: 45,
      maximumPayout: 200,
      isActive: true,
      description: 'High-density premium delivery incentive zone',
    },
  ];

  // Primary list state
  const [rates, setRates] = useState<PayoutRateItem[]>(initialRates);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Dark Store Selector Dropdown
  const [selectedDarkStore, setSelectedDarkStore] = useState<string>('All Dark Stores & Shops (12)');
  const [showDarkStoreModal, setShowDarkStoreModal] = useState<boolean>(false);
  const darkStoresList = [
    'All Dark Stores & Shops (12)',
    'Satellite Hub Dark Store',
    'Chandlodiya - Tragad Dark Store',
    'Prahlad Nagar Express Store',
    'Vastrapur - Bodakdev Hub',
    'Navrangpura Quick Hub',
  ];

  // Global Rate Inline Editing
  const [isEditingGlobal, setIsEditingGlobal] = useState<boolean>(false);
  const [globalRateInput, setGlobalRateInput] = useState<string>('12');
  const [globalMinInput, setGlobalMinInput] = useState<string>('35');
  const [globalMaxInput, setGlobalMaxInput] = useState<string>('160');
  const [savingGlobal, setSavingGlobal] = useState<boolean>(false);

  // Filters
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'CITY' | 'AREA'>('ALL');
  const [search, setSearch] = useState<string>('');

  // Simulator State
  const [simCityName, setSimCityName] = useState<string>('Ahmedabad');
  const [simAreaName, setSimAreaName] = useState<string>('Prahlad Nagar');
  const [simDistanceKm, setSimDistanceKm] = useState<string>('4.5');
  const [showSimCityModal, setShowSimCityModal] = useState<boolean>(false);
  const [showSimAreaModal, setShowSimAreaModal] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PayoutRateItem | null>(null);
  const [modalScope, setModalScope] = useState<'CITY' | 'AREA'>('AREA');
  const [modalCityName, setModalCityName] = useState<string>('Ahmedabad');
  const [modalAreaName, setModalAreaName] = useState<string>('Prahlad Nagar');
  const [modalRatePerKm, setModalRatePerKm] = useState<string>('15');
  const [modalMinPayout, setModalMinPayout] = useState<string>('40');
  const [modalMaxPayout, setModalMaxPayout] = useState<string>('180');
  const [modalDescription, setModalDescription] = useState<string>('');
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [showModalCityPicker, setShowModalCityPicker] = useState<boolean>(false);
  const [showModalAreaPicker, setShowModalAreaPicker] = useState<boolean>(false);

  // Initial load from backend (keeps live sync if backend returns data, otherwise maintains website parity default)
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await ApiService.fetchPayoutRates();
      if (res?.success && res.data && res.data.length > 0) {
        setRates(res.data);
        if (res.globalRate) {
          setGlobalRateInput(String(res.globalRate.ratePerKm || 12));
          setGlobalMinInput(String(res.globalRate.minimumPayout || 35));
          setGlobalMaxInput(String(res.globalRate.maximumPayout || 160));
        }
      }
    } catch {
      // Keep initialRates as fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Run simulation on input changes (100% same algorithm as website)
  useEffect(() => {
    const dist = parseFloat(simDistanceKm) || 4.5;
    const areaMatch = rates.find(
      (r) => r.scope === 'AREA' && r.areaName?.toLowerCase() === simAreaName.toLowerCase() && r.isActive
    );
    const cityMatch = rates.find(
      (r) => r.scope === 'CITY' && r.cityName?.toLowerCase() === simCityName.toLowerCase() && r.isActive
    );
    const globalMatch = rates.find((r) => r.scope === 'GLOBAL') || {
      scope: 'GLOBAL' as const,
      ratePerKm: parseFloat(globalRateInput) || 12,
      minimumPayout: parseFloat(globalMinInput) || 35,
      maximumPayout: parseFloat(globalMaxInput) || 160,
    };

    const effective = areaMatch || cityMatch || globalMatch;
    const rawEarning = dist * (effective.ratePerKm || 12);
    const minCap = effective.minimumPayout || 35;
    const maxCap = effective.maximumPayout || 160;
    const capped = Math.max(minCap, Math.min(maxCap, rawEarning));

    setSimResult({
      scope: effective.scope,
      ratePerKm: effective.ratePerKm || 12,
      distance: dist,
      baseEarning: Math.round(rawEarning),
      finalPayout: Math.round(capped),
      minCap,
      maxCap,
    });
  }, [simCityName, simAreaName, simDistanceKm, rates, globalRateInput, globalMinInput, globalMaxInput]);

  // Filtered rates matching search & scope
  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      if (scopeFilter !== 'ALL' && r.scope !== scopeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchScope = r.scope?.toLowerCase().includes(q);
        const matchCity = r.cityName?.toLowerCase().includes(q);
        const matchArea = r.areaName?.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q);
        if (!matchScope && !matchCity && !matchArea && !matchDesc) return false;
      }
      return true;
    });
  }, [rates, scopeFilter, search]);

  // Save Global Fallback Rate
  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    const updated: PayoutRateItem = {
      id: 'global_default',
      scope: 'GLOBAL',
      ratePerKm: parseFloat(globalRateInput) || 12,
      minimumPayout: parseFloat(globalMinInput) || 35,
      maximumPayout: parseFloat(globalMaxInput) || 160,
      isActive: true,
      description: 'Universal fallback payout rate for all standard deliveries',
    };
    setRates((prev) => prev.map((r) => (r.scope === 'GLOBAL' ? updated : r)));
    try {
      await ApiService.createPayoutRate(updated);
    } catch {
      // non-blocking
    }
    setSavingGlobal(false);
    setIsEditingGlobal(false);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    setModalScope('AREA');
    setModalCityName(cities[0]?.name || 'Ahmedabad');
    setModalAreaName(zones[0]?.name || 'Prahlad Nagar');
    setModalRatePerKm('15');
    setModalMinPayout('40');
    setModalMaxPayout('180');
    setModalDescription('');
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (item: PayoutRateItem) => {
    setEditingItem(item);
    setModalScope((item.scope as 'CITY' | 'AREA') || 'AREA');
    setModalCityName(item.cityName || 'Ahmedabad');
    setModalAreaName(item.areaName || 'Prahlad Nagar');
    setModalRatePerKm(String(item.ratePerKm || 15));
    setModalMinPayout(String(item.minimumPayout || 40));
    setModalMaxPayout(String(item.maximumPayout || 180));
    setModalDescription(item.description || '');
    setShowModal(true);
  };

  // Delete Rate
  const handleDelete = async (rateId: string) => {
    const executeDelete = async () => {
      setRates((prev) => prev.filter((r) => r.id !== rateId));
      try {
        await ApiService.deletePayoutRate(rateId);
      } catch {
        // non-blocking
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this payout rate override? Delivery calculations will fallback to city or global rate.')) {
        await executeDelete();
      }
    } else {
      Alert.alert(
        'Delete Override',
        'Delete this payout rate override? Delivery calculations will fallback to city or global rate.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  };

  // Submit Add / Edit Modal
  const handleModalSubmit = async () => {
    setModalSubmitting(true);
    const payload: PayoutRateItem = {
      id: editingItem ? editingItem.id : `pr_${Date.now()}`,
      scope: modalScope,
      cityName: modalCityName,
      areaName: modalScope === 'AREA' ? modalAreaName : undefined,
      ratePerKm: parseFloat(modalRatePerKm) || 15,
      minimumPayout: parseFloat(modalMinPayout) || 40,
      maximumPayout: parseFloat(modalMaxPayout) || 180,
      description: modalDescription || `${modalScope} override rate`,
      isActive: true,
    };

    if (editingItem) {
      setRates((prev) => prev.map((r) => (r.id === editingItem.id ? payload : r)));
    } else {
      setRates((prev) => [...prev, payload]);
    }

    try {
      if (editingItem) {
        await ApiService.updatePayoutRate(editingItem.id, payload);
      } else {
        await ApiService.createPayoutRate(payload);
      }
    } catch {
      // non-blocking
    }

    setModalSubmitting(false);
    setShowModal(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Top Breadcrumb & Store Filter (100% Website Header Alignment) */}
      <View style={styles.topBar}>
        <View style={styles.breadcrumbRow}>
          <Text style={styles.breadcrumbPortal}>Portal</Text>
          <Text style={styles.breadcrumbSlash}> / </Text>
          <Text style={styles.breadcrumbActive}>Rider Payout Rates</Text>
        </View>

        <TouchableOpacity
          style={styles.storeSelectorBtn}
          onPress={() => setShowDarkStoreModal(true)}
          activeOpacity={0.8}
        >
          <Store size={14} color="#071B52" />
          <Text style={styles.storeSelectorText} numberOfLines={1}>
            {selectedDarkStore}
          </Text>
          <ChevronDown size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* 2. Main Page Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.mainTitle}>Rider Payout Rates & Earnings Engine</Text>
          <Text style={styles.mainSubtitle}>
            Base per-km rates, min/max guarantees, regional surge incentives, and live simulator
          </Text>
        </View>

        <TouchableOpacity style={styles.addOverrideBtn} onPress={openAddModal} activeOpacity={0.85}>
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addOverrideGradient}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addOverrideText}>+ Add Payout Override</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 3. Universal Global Fallback Payout Card (Indigo left border) */}
      <View style={styles.globalCard}>
        <View style={styles.globalCardTop}>
          <View style={styles.globalIconCircle}>
            <Globe size={22} color="#4F46E5" />
          </View>
          <View style={styles.globalTextCol}>
            <View style={styles.globalTitleRow}>
              <Text style={styles.globalTitle}>Universal Global Fallback Payout</Text>
              <View style={styles.activeDefaultBadge}>
                <Text style={styles.activeDefaultText}>ACTIVE DEFAULT</Text>
              </View>
            </View>
            <Text style={styles.globalSubtitle}>
              Applies across all cities & zones when no specific local override is present
            </Text>
          </View>
        </View>

        {!isEditingGlobal ? (
          <View style={styles.globalMetricsRow}>
            <View style={styles.globalMetricBox}>
              <Text style={styles.metricLabel}>PER KM RATE</Text>
              <Text style={styles.metricRateValue}>₹{globalRateInput} / km</Text>
            </View>

            <View style={styles.globalMetricBox}>
              <Text style={styles.metricLabel}>MIN – MAX GUARANTEE</Text>
              <Text style={styles.metricGuaranteeValue}>
                ₹{globalMinInput} – ₹{globalMaxInput}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editGlobalBtn}
              onPress={() => setIsEditingGlobal(true)}
              activeOpacity={0.8}
            >
              <Edit2 size={13} color="#071B52" />
              <Text style={styles.editGlobalBtnText}>Edit Global Rate</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.globalEditRow}>
            <View style={styles.globalEditInputCol}>
              <Text style={styles.editInputLabel}>₹/KM</Text>
              <TextInput
                style={styles.globalTextInput}
                keyboardType="numeric"
                value={globalRateInput}
                onChangeText={setGlobalRateInput}
              />
            </View>

            <View style={styles.globalEditInputCol}>
              <Text style={styles.editInputLabel}>MIN (₹)</Text>
              <TextInput
                style={styles.globalTextInput}
                keyboardType="numeric"
                value={globalMinInput}
                onChangeText={setGlobalMinInput}
              />
            </View>

            <View style={styles.globalEditInputCol}>
              <Text style={styles.editInputLabel}>MAX (₹)</Text>
              <TextInput
                style={styles.globalTextInput}
                keyboardType="numeric"
                value={globalMaxInput}
                onChangeText={setGlobalMaxInput}
              />
            </View>

            <View style={styles.globalEditActions}>
              <TouchableOpacity
                style={styles.saveGlobalBtn}
                onPress={handleSaveGlobal}
                disabled={savingGlobal}
              >
                <Text style={styles.saveGlobalText}>{savingGlobal ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelGlobalBtn}
                onPress={() => setIsEditingGlobal(false)}
              >
                <Text style={styles.cancelGlobalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 4. Interactive Delivery Payout Simulator Box (Website Pink Gradient Parity) */}
      <View style={styles.simulatorCard}>
        <View style={styles.simulatorTitleRow}>
          <Calculator size={18} color="#C026D3" />
          <Text style={styles.simulatorTitle}>Interactive Delivery Payout Simulator</Text>
        </View>

        <View style={styles.simulatorFormContainer}>
          {/* Select City */}
          <View style={styles.simInputCol}>
            <Text style={styles.simLabel}>SELECT CITY</Text>
            <TouchableOpacity
              style={styles.simDropdown}
              onPress={() => setShowSimCityModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.simDropdownText}>{simCityName}</Text>
              <ChevronDown size={14} color="#701A75" />
            </TouchableOpacity>
          </View>

          {/* Select Service Area */}
          <View style={styles.simInputCol}>
            <Text style={styles.simLabel}>SELECT SERVICE AREA</Text>
            <TouchableOpacity
              style={styles.simDropdown}
              onPress={() => setShowSimAreaModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.simDropdownText} numberOfLines={1}>
                {simAreaName}
              </Text>
              <ChevronDown size={14} color="#701A75" />
            </TouchableOpacity>
          </View>

          {/* Trip Distance (KM) */}
          <View style={styles.simInputCol}>
            <Text style={styles.simLabel}>DELIVERY TRIP DISTANCE (KM)</Text>
            <TextInput
              style={styles.simTextInput}
              keyboardType="numeric"
              value={simDistanceKm}
              onChangeText={setSimDistanceKm}
              placeholder="4.5"
            />
          </View>

          {/* Calculation Result Box */}
          {simResult && (
            <View style={styles.simResultCard}>
              <View>
                <Text style={styles.appliedRuleText}>
                  APPLIED RULE: <Text style={{ color: '#C026D3' }}>{simResult.scope} OVERRIDE</Text>
                </Text>
                <Text style={styles.simFormulaText}>
                  {simResult.distance} km × ₹{simResult.ratePerKm}/km
                </Text>
              </View>
              <View style={styles.simResultRight}>
                <Text style={styles.simPayoutAmount}>₹{simResult.finalPayout}</Text>
                <Text style={styles.guaranteedPayoutLabel}>Guaranteed Payout</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 5. Search & Scope Filter Toolbar */}
      <View style={styles.toolbarCard}>
        <View style={styles.searchBox}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rate overrides by scope, city, or territory..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.scopePillsRow}>
          <Text style={styles.scopeLabel}>SCOPE:</Text>
          {(['ALL', 'CITY', 'AREA'] as const).map((sc) => {
            const isSelected = scopeFilter === sc;
            return (
              <TouchableOpacity
                key={sc}
                style={[styles.scopePill, isSelected && styles.scopePillActive]}
                onPress={() => setScopeFilter(sc)}
                activeOpacity={0.8}
              >
                <Text style={[styles.scopePillText, isSelected && styles.scopePillTextActive]}>
                  {sc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 6. Overrides Master List — Mobile Responsive & Table View */}
      <View style={styles.tableCard}>
        <View style={styles.tableCardHeader}>
          <Text style={styles.tableCardTitle}>Configured Payout Rates ({filteredRates.length})</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshIconBtn}>
            <RefreshCw size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        {filteredRates.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No payout rate rules matching your filters.</Text>
          </View>
        ) : (
          filteredRates.map((r) => {
            const isGlobal = r.scope === 'GLOBAL';
            const territoryName =
              r.scope === 'GLOBAL'
                ? 'Universal Platform Fallback'
                : r.scope === 'CITY'
                ? `${r.cityName} Metro Region`
                : `${r.areaName}, ${r.cityName}`;

            return (
              <View key={r.id} style={styles.overrideItemCard}>
                {/* Top Badge & Actions Row */}
                <View style={styles.overrideItemTop}>
                  <View style={styles.badgesGroup}>
                    <View
                      style={[
                        styles.scopeBadge,
                        r.scope === 'GLOBAL'
                          ? styles.badgeNavy
                          : r.scope === 'CITY'
                          ? styles.badgeBlue
                          : styles.badgePink,
                      ]}
                    >
                      <Text
                        style={[
                          styles.scopeBadgeText,
                          r.scope === 'GLOBAL'
                            ? styles.badgeNavyText
                            : r.scope === 'CITY'
                            ? styles.badgeBlueText
                            : styles.badgePinkText,
                        ]}
                      >
                        {r.scope} RULE
                      </Text>
                    </View>

                    <View style={styles.activeRuleBadge}>
                      <Text style={styles.activeRuleText}>ACTIVE RULE</Text>
                    </View>
                  </View>

                  {!isGlobal && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openEditModal(r)}
                        activeOpacity={0.7}
                      >
                        <Edit2 size={13} color="#071B52" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#FCA5A5' }]}
                        onPress={() => handleDelete(r.id)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={13} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Territory Title */}
                <Text style={styles.overrideTerritory}>{territoryName}</Text>

                {/* Key Numbers Strip */}
                <View style={styles.overrideMetricsStrip}>
                  <View style={styles.metricCol}>
                    <Text style={styles.stripLabel}>RATE / KM</Text>
                    <Text style={styles.stripRateValue}>₹{r.ratePerKm} / km</Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={styles.stripLabel}>MIN PAYOUT</Text>
                    <Text style={styles.stripMinValue}>₹{r.minimumPayout}</Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={styles.stripLabel}>MAX PAYOUT</Text>
                    <Text style={styles.stripMaxValue}>₹{r.maximumPayout}</Text>
                  </View>
                </View>

                {/* Description / Notes */}
                <Text style={styles.overrideDesc}>
                  {r.description || 'Standard compensation schedule'}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* ========================================================================= */}
      {/* ADD / EDIT PAYOUT OVERRIDE MODAL (100% Website Parity)                    */}
      {/* ========================================================================= */}
      <Modal visible={showModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <DollarSign size={20} color="#FF3B98" />
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Edit Payout Override' : 'New Payout Rate Override'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              {/* Override Scope */}
              <Text style={styles.formLabel}>Override Scope *</Text>
              <View style={styles.scopeSelectorRow}>
                <TouchableOpacity
                  style={[styles.scopeBtn, modalScope === 'AREA' && styles.scopeBtnActive]}
                  onPress={() => setModalScope('AREA')}
                >
                  <Text style={[styles.scopeBtnText, modalScope === 'AREA' && styles.scopeBtnTextActive]}>
                    AREA (Service Zone)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.scopeBtn, modalScope === 'CITY' && styles.scopeBtnActive]}
                  onPress={() => setModalScope('CITY')}
                >
                  <Text style={[styles.scopeBtnText, modalScope === 'CITY' && styles.scopeBtnTextActive]}>
                    CITY (All Zones)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Target City Market */}
              <Text style={[styles.formLabel, { marginTop: 14 }]}>Target City Market *</Text>
              <TouchableOpacity
                style={styles.modalPickerBtn}
                onPress={() => setShowModalCityPicker(true)}
              >
                <Text style={styles.modalPickerBtnText}>{modalCityName}</Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>

              {/* Target Service Area (if AREA scope) */}
              {modalScope === 'AREA' && (
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.formLabel}>Target Service Area *</Text>
                  <TouchableOpacity
                    style={styles.modalPickerBtn}
                    onPress={() => setShowModalAreaPicker(true)}
                  >
                    <Text style={styles.modalPickerBtnText}>{modalAreaName}</Text>
                    <ChevronDown size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Rates 3-column input row */}
              <View style={styles.modalRatesGrid}>
                <View style={styles.modalRateCol}>
                  <Text style={styles.formLabel}>Rate / Km (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={modalRatePerKm}
                    onChangeText={setModalRatePerKm}
                  />
                </View>

                <View style={styles.modalRateCol}>
                  <Text style={styles.formLabel}>Min Pay (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={modalMinPayout}
                    onChangeText={setModalMinPayout}
                  />
                </View>

                <View style={styles.modalRateCol}>
                  <Text style={styles.formLabel}>Max Pay (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={modalMaxPayout}
                    onChangeText={setModalMaxPayout}
                  />
                </View>
              </View>

              {/* Description */}
              <Text style={[styles.formLabel, { marginTop: 14 }]}>Description / Internal Notes</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Monsoon surge compensation in Prahlad Nagar"
                placeholderTextColor="#94A3B8"
                value={modalDescription}
                onChangeText={setModalDescription}
              />
            </ScrollView>

            {/* Modal Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowModal(false)}
                disabled={modalSubmitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleModalSubmit}
                disabled={modalSubmitting}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>
                    {modalSubmitting ? 'Saving...' : 'Commit Rate Override'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dark Store Filter Modal */}
      <Modal visible={showDarkStoreModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Dark Store / Shop</Text>
              <TouchableOpacity onPress={() => setShowDarkStoreModal(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {darkStoresList.map((storeName) => (
                <TouchableOpacity
                  key={storeName}
                  style={[
                    styles.pickerItem,
                    selectedDarkStore === storeName && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedDarkStore(storeName);
                    setShowDarkStoreModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDarkStore === storeName && styles.pickerItemTextActive,
                    ]}
                  >
                    {storeName}
                  </Text>
                  {selectedDarkStore === storeName && <Check size={16} color="#FF3B98" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Simulator City Modal */}
      <Modal visible={showSimCityModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setShowSimCityModal(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'].map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.pickerItem, simCityName === city && styles.pickerItemActive]}
                  onPress={() => {
                    setSimCityName(city);
                    setShowSimCityModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      simCityName === city && styles.pickerItemTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                  {simCityName === city && <Check size={16} color="#FF3B98" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Simulator Area Modal */}
      <Modal visible={showSimAreaModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Service Area</Text>
              <TouchableOpacity onPress={() => setShowSimAreaModal(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {['Prahlad Nagar', 'Chandlodiya - Tragad', 'Satellite Hub', 'Vastrapur - Bodakdev', 'Navrangpura - C.G. Road'].map((area) => (
                <TouchableOpacity
                  key={area}
                  style={[styles.pickerItem, simAreaName === area && styles.pickerItemActive]}
                  onPress={() => {
                    setSimAreaName(area);
                    setShowSimAreaModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      simAreaName === area && styles.pickerItemTextActive,
                    ]}
                  >
                    {area}
                  </Text>
                  {simAreaName === area && <Check size={16} color="#FF3B98" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal City Picker */}
      <Modal visible={showModalCityPicker} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Target City Market</Text>
              <TouchableOpacity onPress={() => setShowModalCityPicker(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'].map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.pickerItem, modalCityName === city && styles.pickerItemActive]}
                  onPress={() => {
                    setModalCityName(city);
                    setShowModalCityPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, modalCityName === city && styles.pickerItemTextActive]}>
                    {city}
                  </Text>
                  {modalCityName === city && <Check size={16} color="#FF3B98" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Area Picker */}
      <Modal visible={showModalAreaPicker} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Target Service Area</Text>
              <TouchableOpacity onPress={() => setShowModalAreaPicker(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {['Prahlad Nagar', 'Chandlodiya - Tragad', 'Satellite Hub', 'Vastrapur - Bodakdev', 'Navrangpura - C.G. Road'].map((area) => (
                <TouchableOpacity
                  key={area}
                  style={[styles.pickerItem, modalAreaName === area && styles.pickerItemActive]}
                  onPress={() => {
                    setModalAreaName(area);
                    setShowModalAreaPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, modalAreaName === area && styles.pickerItemTextActive]}>
                    {area}
                  </Text>
                  {modalAreaName === area && <Check size={16} color="#FF3B98" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },

  // 1. Top Breadcrumb & Store Selector
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbPortal: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbSlash: {
    fontSize: 13,
    color: '#94A3B8',
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071B52',
  },
  storeSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...Platform.select({
      web: { filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.05))' },
      default: { elevation: 1 },
    }),
  },
  storeSelectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071B52',
    maxWidth: 180,
  },

  // 2. Main Page Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 220,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#071B52',
    letterSpacing: -0.3,
  },
  mainSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  addOverrideBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addOverrideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addOverrideText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // 3. Universal Global Fallback Payout Card
  globalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { filter: 'drop-shadow(0px 2px 6px rgba(15,23,42,0.04))' },
      default: { elevation: 2 },
    }),
  },
  globalCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  globalIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  globalTextCol: {
    flex: 1,
  },
  globalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  globalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
  },
  activeDefaultBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  activeDefaultText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  globalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  globalMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 10,
  },
  globalMetricBox: {
    minWidth: 90,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricRateValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
    marginTop: 2,
  },
  metricGuaranteeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  editGlobalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editGlobalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071B52',
  },
  globalEditRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
    flexWrap: 'wrap',
  },
  globalEditInputCol: {
    width: 68,
  },
  editInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  globalTextInput: {
    height: 36,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#071B52',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  globalEditActions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
  saveGlobalBtn: {
    backgroundColor: '#071B52',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveGlobalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelGlobalBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cancelGlobalText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },

  // 4. Interactive Delivery Payout Simulator Box
  simulatorCard: {
    backgroundColor: '#FDF4FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5D0FE',
  },
  simulatorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  simulatorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#701A75',
  },
  simulatorFormContainer: {
    gap: 10,
  },
  simInputCol: {
    width: '100%',
  },
  simLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#701A75',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  simDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0ABFC',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
  },
  simDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#071B52',
  },
  simTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0ABFC',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#071B52',
  },
  simResultCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E879F9',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    ...Platform.select({
      web: { filter: 'drop-shadow(0px 2px 6px rgba(192,38,211,0.08))' },
      default: { elevation: 2 },
    }),
  },
  appliedRuleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#701A75',
    textTransform: 'uppercase',
  },
  simFormulaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  simResultRight: {
    alignItems: 'flex-end',
  },
  simPayoutAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#071B52',
  },
  guaranteedPayoutLabel: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
  },

  // 5. Search & Scope Toolbar
  toolbarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 12,
    fontWeight: '600',
    color: '#071B52',
  },
  scopePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scopeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginRight: 2,
  },
  scopePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  scopePillActive: {
    borderColor: '#071B52',
    backgroundColor: '#071B52',
  },
  scopePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  scopePillTextActive: {
    color: '#FFFFFF',
  },

  // 6. Master Table & Mobile Cards
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { filter: 'drop-shadow(0px 2px 6px rgba(15,23,42,0.04))' },
      default: { elevation: 1 },
    }),
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
  },
  refreshIconBtn: {
    padding: 4,
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
  },
  overrideItemCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  overrideItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scopeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeNavy: {
    backgroundColor: '#E2E8F0',
  },
  badgeBlue: {
    backgroundColor: '#DBEAFE',
  },
  badgePink: {
    backgroundColor: '#FCE7F3',
  },
  scopeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeNavyText: {
    color: '#071B52',
  },
  badgeBlueText: {
    color: '#1D4ED8',
  },
  badgePinkText: {
    color: '#BE185D',
  },
  activeRuleBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeRuleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overrideTerritory: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 8,
  },
  overrideMetricsStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricCol: {
    alignItems: 'flex-start',
  },
  stripLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  stripRateValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071B52',
    marginTop: 2,
  },
  stripMinValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  stripMaxValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6D28D9',
    marginTop: 2,
  },
  overrideDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 14,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
  },
  modalCloseBtn: {
    padding: 4,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 6,
  },
  scopeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scopeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scopeBtnActive: {
    borderColor: '#071B52',
    backgroundColor: '#071B52',
  },
  scopeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  scopeBtnTextActive: {
    color: '#FFFFFF',
  },
  modalPickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
  },
  modalPickerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#071B52',
  },
  modalRatesGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  modalRateCol: {
    flex: 1,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#071B52',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Picker Modal Sub-items
  pickerModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 8,
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(255, 59, 152, 0.06)',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#071B52',
  },
  pickerItemTextActive: {
    color: '#FF3B98',
    fontWeight: '800',
  },
});
