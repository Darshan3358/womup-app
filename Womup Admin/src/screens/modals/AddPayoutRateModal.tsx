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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DollarSign,
  Building2,
  MapPin,
  Globe,
  ChevronDown,
  Search,
  Check,
  Lock,
  X,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { CityItem, Zone, PayoutRateItem, PayoutScope } from '../../types/admin';
import { ApiService } from '../../services/api';

interface AddPayoutRateModalProps {
  visible: boolean;
  editingItem: PayoutRateItem | null;
  initialScope?: PayoutScope;
  onClose: () => void;
  onSaved: () => void;
}

export const AddPayoutRateModal: React.FC<AddPayoutRateModalProps> = ({
  visible,
  editingItem,
  initialScope = 'AREA',
  onClose,
  onSaved,
}) => {
  const { cities, zones } = useAdminState();

  // Form State
  const [scope, setScope] = useState<PayoutScope>('AREA');
  const [selectedCity, setSelectedCity] = useState<CityItem | null>(null);
  const [selectedArea, setSelectedArea] = useState<Zone | null>(null);
  const [ratePerKm, setRatePerKm] = useState<string>('15');
  const [minPayout, setMinPayout] = useState<string>('35');
  const [maxPayout, setMaxPayout] = useState<string>('180');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sub-Picker Modals
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [citySearch, setCitySearch] = useState<string>('');

  const [showAreaPicker, setShowAreaPicker] = useState<boolean>(false);
  const [areaSearch, setAreaSearch] = useState<string>('');

  // Active cities
  const activeCities = useMemo(() => {
    const list = cities.filter((c) => c.status === 'Active' || !c.status);
    return list.length > 0 ? list : cities;
  }, [cities]);

  // Areas belonging to selected city
  const cityAreas = useMemo(() => {
    if (!selectedCity) return [];
    const cId = String(selectedCity.id || selectedCity._id || '');
    const cName = (selectedCity.name || '').toLowerCase().trim();

    const matched = zones.filter((z) => {
      if (z.cityId && String(z.cityId) === cId) return true;
      if (z.cityName && z.cityName.toLowerCase().trim() === cName) return true;
      if (z.city && z.city.toLowerCase().trim() === cName) return true;
      return false;
    });

    // If city has no specifically tagged zones yet, offer all available zones
    return matched.length > 0 ? matched : zones;
  }, [zones, selectedCity]);

  // Search filtered cities
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return activeCities;
    const q = citySearch.toLowerCase();
    return activeCities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q))
    );
  }, [activeCities, citySearch]);

  // Search filtered areas
  const filteredAreas = useMemo(() => {
    if (!areaSearch.trim()) return cityAreas;
    const q = areaSearch.toLowerCase();
    return cityAreas.filter((a) => a.name.toLowerCase().includes(q));
  }, [cityAreas, areaSearch]);

  // Sync state on open/edit
  useEffect(() => {
    if (!visible) return;

    if (editingItem) {
      setScope(editingItem.scope || 'AREA');
      setRatePerKm(String(editingItem.ratePerKm || 10));
      setMinPayout(String(editingItem.minimumPayout || 30));
      setMaxPayout(String(editingItem.maximumPayout || 150));
      setDescription(editingItem.description || '');
      setIsActive(editingItem.isActive !== false);

      // Find matching city
      if (editingItem.cityName) {
        const foundCity =
          cities.find(
            (c) =>
              (editingItem.cityId && (c.id === editingItem.cityId || c._id === editingItem.cityId)) ||
              c.name.toLowerCase() === editingItem.cityName?.toLowerCase()
          ) || {
            id: editingItem.cityId || 'custom_city',
            name: editingItem.cityName,
            code: 'CTY',
            status: 'Active',
          };
        setSelectedCity(foundCity);
      } else {
        setSelectedCity(activeCities[0] || null);
      }

      // Find matching area
      if (editingItem.areaName) {
        const foundArea =
          zones.find(
            (z) =>
              (editingItem.areaId && (z.id === editingItem.areaId || z._id === editingItem.areaId)) ||
              z.name.toLowerCase() === editingItem.areaName?.toLowerCase()
          ) || ({
            id: editingItem.areaId || 'custom_area',
            name: editingItem.areaName,
            darkStore: 'Default Store',
            activeOrders: 0,
            gmvSharePercent: 0,
          } as Zone);
        setSelectedArea(foundArea);
      } else {
        setSelectedArea(null);
      }
    } else {
      // Add mode defaults
      setScope(initialScope);
      const defaultCity = activeCities[0] || null;
      setSelectedCity(defaultCity);

      if (defaultCity) {
        const defaultAreas = zones.filter((z) => {
          const cId = String(defaultCity.id || defaultCity._id || '');
          const cName = defaultCity.name.toLowerCase().trim();
          return (
            (z.cityId && String(z.cityId) === cId) ||
            (z.cityName && z.cityName.toLowerCase().trim() === cName)
          );
        });
        setSelectedArea(defaultAreas[0] || zones[0] || null);
      } else {
        setSelectedArea(null);
      }

      setRatePerKm(initialScope === 'AREA' ? '15' : initialScope === 'CITY' ? '12' : '10');
      setMinPayout('35');
      setMaxPayout('180');
      setDescription('');
      setIsActive(true);
    }

    setCitySearch('');
    setAreaSearch('');
    setShowCityPicker(false);
    setShowAreaPicker(false);
  }, [visible, editingItem, initialScope, activeCities, zones]);

  // Handle City Select
  const handleSelectCity = (city: CityItem) => {
    setSelectedCity(city);
    // Find default area for this city
    const cId = String(city.id || city._id || '');
    const cName = city.name.toLowerCase().trim();
    const cityZones = zones.filter(
      (z) =>
        (z.cityId && String(z.cityId) === cId) ||
        (z.cityName && z.cityName.toLowerCase().trim() === cName) ||
        (z.city && z.city.toLowerCase().trim() === cName)
    );
    setSelectedArea(cityZones[0] || null);
    setShowCityPicker(false);
  };

  // Handle Area Select
  const handleSelectArea = (area: Zone) => {
    setSelectedArea(area);
    setShowAreaPicker(false);
  };

  // Submit Handler
  const handleSave = async () => {
    const rateVal = parseFloat(ratePerKm);
    const minVal = parseFloat(minPayout);
    const maxVal = parseFloat(maxPayout);

    if (isNaN(rateVal) || rateVal <= 0) {
      Alert.alert('Validation Error', 'Rate per kilometer must be a positive number');
      return;
    }
    if (minVal > maxVal) {
      Alert.alert('Validation Error', 'Minimum payout cannot exceed maximum payout');
      return;
    }

    if ((scope === 'CITY' || scope === 'AREA') && !selectedCity) {
      Alert.alert('Validation Error', 'Please select a City');
      return;
    }

    if (scope === 'AREA' && !selectedArea) {
      Alert.alert('Validation Error', 'Please select an Area / Delivery Zone');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<PayoutRateItem> = {
        scope,
        ratePerKm: rateVal,
        minimumPayout: isNaN(minVal) ? 30 : minVal,
        maximumPayout: isNaN(maxVal) ? 150 : maxVal,
        description: description.trim(),
        isActive,
      };

      if (scope === 'CITY' || scope === 'AREA') {
        payload.cityId = selectedCity ? selectedCity.id || selectedCity._id : undefined;
        payload.cityName = selectedCity ? selectedCity.name : undefined;
      }

      if (scope === 'AREA') {
        payload.areaId = selectedArea ? selectedArea.id || selectedArea._id : undefined;
        payload.areaName = selectedArea ? selectedArea.name : undefined;
      }

      let res;
      if (editingItem && (editingItem.id || editingItem._id)) {
        res = await ApiService.updatePayoutRate(editingItem.id || editingItem._id!, payload);
      } else {
        res = await ApiService.createPayoutRate(payload);
      }

      if (res.success) {
        onSaved();
        onClose();
      } else {
        Alert.alert('Error', res.error || 'Failed saving payout rate');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIcon}>
                <DollarSign size={20} color={COLORS.hotPink} />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Edit Payout Rate' : 'Add New Payout Rate'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Configure distance-based rider compensation rules
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* 1. Scope Selector */}
            <Text style={styles.fieldLabel}>Apply Rate To (Scope) *</Text>
            <View style={styles.scopeSelector}>
              <TouchableOpacity
                style={[
                  styles.scopeOption,
                  scope === 'AREA' && styles.scopeOptionActive,
                ]}
                onPress={() => setScope('AREA')}
              >
                <MapPin
                  size={16}
                  color={scope === 'AREA' ? '#FFF' : COLORS.textPrimary}
                />
                <Text
                  style={[
                    styles.scopeOptionText,
                    scope === 'AREA' && styles.scopeOptionTextActive,
                  ]}
                >
                  Area Specific
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scopeOption,
                  scope === 'CITY' && styles.scopeOptionActive,
                ]}
                onPress={() => setScope('CITY')}
              >
                <Building2
                  size={16}
                  color={scope === 'CITY' ? '#FFF' : COLORS.textPrimary}
                />
                <Text
                  style={[
                    styles.scopeOptionText,
                    scope === 'CITY' && styles.scopeOptionTextActive,
                  ]}
                >
                  City Wide
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scopeOption,
                  scope === 'GLOBAL' && styles.scopeOptionActive,
                ]}
                onPress={() => setScope('GLOBAL')}
              >
                <Globe
                  size={16}
                  color={scope === 'GLOBAL' ? '#FFF' : COLORS.textPrimary}
                />
                <Text
                  style={[
                    styles.scopeOptionText,
                    scope === 'GLOBAL' && styles.scopeOptionTextActive,
                  ]}
                >
                  Global
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scope Explanation Banner */}
            {scope === 'GLOBAL' && (
              <View style={styles.globalInfoBanner}>
                <Globe size={18} color={COLORS.navy} />
                <Text style={styles.globalInfoText}>
                  This rate applies universally to all orders and dark stores across all cities unless overridden by a city or area rule.
                </Text>
              </View>
            )}

            {/* 2. City Dropdown (Shown for CITY and AREA) */}
            {(scope === 'CITY' || scope === 'AREA') && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>City *</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setShowCityPicker(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownLeft}>
                    <Building2 size={18} color={COLORS.blue} style={{ marginRight: 10 }} />
                    <Text
                      style={[
                        styles.dropdownValueText,
                        !selectedCity && styles.dropdownPlaceholder,
                      ]}
                    >
                      {selectedCity ? (
                        <>
                          <Text style={{ fontWeight: '700', color: COLORS.navy }}>
                            {selectedCity.name}
                          </Text>
                          {selectedCity.code ? (
                            <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>
                              {' '}
                              ({selectedCity.code})
                            </Text>
                          ) : null}
                        </>
                      ) : (
                        'Select City'
                      )}
                    </Text>
                  </View>
                  <ChevronDown size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* 3. Area Dropdown (Shown for AREA only) */}
            {scope === 'AREA' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Area / Delivery Zone *</Text>
                {!selectedCity ? (
                  // Disabled state: No city chosen yet
                  <View style={[styles.dropdownBtn, styles.dropdownDisabled]}>
                    <View style={styles.dropdownLeft}>
                      <Lock size={16} color={COLORS.secondaryText} style={{ marginRight: 10 }} />
                      <Text style={styles.dropdownDisabledText}>
                        Select city first to choose an area
                      </Text>
                    </View>
                  </View>
                ) : (
                  // Enabled state: City chosen
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setShowAreaPicker(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownLeft}>
                      <MapPin size={18} color={COLORS.hotPink} style={{ marginRight: 10 }} />
                      <Text
                        style={[
                          styles.dropdownValueText,
                          !selectedArea && styles.dropdownPlaceholder,
                        ]}
                      >
                        {selectedArea ? selectedArea.name : 'Select Area'}
                      </Text>
                    </View>
                    <ChevronDown size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 4. Rates & Bounds Configuration */}
            <View style={styles.threeCols}>
              {/* Rate / km */}
              <View style={[styles.colItem, { marginRight: 10 }]}>
                <Text style={styles.fieldLabel}>Rate / km (₹) *</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputCurrency}>₹</Text>
                  <TextInput
                    style={styles.inputControl}
                    value={ratePerKm}
                    onChangeText={setRatePerKm}
                    keyboardType="numeric"
                    placeholder="15"
                  />
                  <Text style={styles.inputUnit}>/km</Text>
                </View>
              </View>

              {/* Minimum Payout Floor */}
              <View style={[styles.colItem, { marginRight: 10 }]}>
                <Text style={styles.fieldLabel}>Min Floor (₹)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputCurrencyMuted}>₹</Text>
                  <TextInput
                    style={styles.inputControl}
                    value={minPayout}
                    onChangeText={setMinPayout}
                    keyboardType="numeric"
                    placeholder="35"
                  />
                </View>
              </View>

              {/* Maximum Payout Cap */}
              <View style={styles.colItem}>
                <Text style={styles.fieldLabel}>Max Cap (₹)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputCurrencyMuted}>₹</Text>
                  <TextInput
                    style={styles.inputControl}
                    value={maxPayout}
                    onChangeText={setMaxPayout}
                    keyboardType="numeric"
                    placeholder="180"
                  />
                </View>
              </View>
            </View>

            {/* 5. Internal Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Internal Description / Notes</Text>
              <View style={[styles.inputWrapper, { height: 68 }]}>
                <TextInput
                  style={[styles.inputControl, { textAlignVertical: 'top', height: 60 }]}
                  placeholder="e.g. Premium rate for long routes and high customer demand"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>
            </View>

            {/* 6. Active Toggle */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Rate Status</Text>
                <Text style={styles.toggleSubtitle}>
                  When active, this rate takes immediate effect on rider payouts
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleBadge,
                  isActive ? styles.toggleBadgeActive : styles.toggleBadgeInactive,
                ]}
                onPress={() => setIsActive(!isActive)}
              >
                <Text
                  style={[
                    styles.toggleBadgeText,
                    isActive ? styles.toggleBadgeTextActive : styles.toggleBadgeTextInactive,
                  ]}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer CTAs */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSave}
              disabled={submitting}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Saving...' : 'Save Rate'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ----------------- SUB-MODAL: CITY PICKER ----------------- */}
        <Modal
          visible={showCityPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCityPicker(false)}
        >
          <View style={styles.subModalOverlay}>
            <View style={styles.subModalSheet}>
              {/* Sheet Header */}
              <View style={styles.subModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Building2 size={18} color={COLORS.navy} />
                  <Text style={styles.subModalTitle}>Select City</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowCityPicker(false)}
                  style={styles.subModalCloseBtn}
                >
                  <X size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.subModalSearch}>
                <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.subModalSearchInput}
                  placeholder="Search cities..."
                  value={citySearch}
                  onChangeText={setCitySearch}
                  autoFocus
                />
                {citySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCitySearch('')}>
                    <X size={14} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* City List */}
              <FlatList
                data={filteredCities}
                keyExtractor={(item) => item.id || item._id || item.name}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                renderItem={({ item }) => {
                  const isChosen =
                    selectedCity &&
                    (selectedCity.id === item.id ||
                      selectedCity.name.toLowerCase() === item.name.toLowerCase());

                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isChosen && styles.pickerItemActive]}
                      onPress={() => handleSelectCity(item)}
                    >
                      <View style={styles.pickerItemLeft}>
                        <Building2
                          size={18}
                          color={isChosen ? COLORS.hotPink : COLORS.textMuted}
                          style={{ marginRight: 12 }}
                        />
                        <View>
                          <Text
                            style={[
                              styles.pickerItemName,
                              isChosen && styles.pickerItemNameActive,
                            ]}
                          >
                            {item.name}
                          </Text>
                          {item.code ? (
                            <Text style={styles.pickerItemSub}>Code: {item.code}</Text>
                          ) : null}
                        </View>
                      </View>
                      {isChosen && <Check size={18} color={COLORS.hotPink} />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.pickerEmpty}>
                    <AlertCircle size={28} color={COLORS.secondaryText} />
                    <Text style={styles.pickerEmptyText}>No cities matched</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>

        {/* ----------------- SUB-MODAL: AREA PICKER ----------------- */}
        <Modal
          visible={showAreaPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAreaPicker(false)}
        >
          <View style={styles.subModalOverlay}>
            <View style={styles.subModalSheet}>
              {/* Sheet Header */}
              <View style={styles.subModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MapPin size={18} color={COLORS.hotPink} />
                  <Text style={styles.subModalTitle}>
                    Select Area in {selectedCity?.name || 'City'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAreaPicker(false)}
                  style={styles.subModalCloseBtn}
                >
                  <X size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.subModalSearch}>
                <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.subModalSearchInput}
                  placeholder="Search areas / delivery zones..."
                  value={areaSearch}
                  onChangeText={setAreaSearch}
                  autoFocus
                />
                {areaSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setAreaSearch('')}>
                    <X size={14} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Area List */}
              <FlatList
                data={filteredAreas}
                keyExtractor={(item) => item.id || item._id || item.name}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                renderItem={({ item }) => {
                  const isChosen =
                    selectedArea &&
                    (selectedArea.id === item.id ||
                      selectedArea.name.toLowerCase() === item.name.toLowerCase());

                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isChosen && styles.pickerItemActive]}
                      onPress={() => handleSelectArea(item)}
                    >
                      <View style={styles.pickerItemLeft}>
                        <MapPin
                          size={18}
                          color={isChosen ? COLORS.hotPink : COLORS.textMuted}
                          style={{ marginRight: 12 }}
                        />
                        <View>
                          <Text
                            style={[
                              styles.pickerItemName,
                              isChosen && styles.pickerItemNameActive,
                            ]}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.pickerItemSub}>
                            {item.darkStore
                              ? item.darkStore
                              : item.hasActiveStore
                              ? 'Active Dark Store'
                              : 'Standard Zone'}
                          </Text>
                        </View>
                      </View>
                      {isChosen && <Check size={18} color={COLORS.hotPink} />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.pickerEmpty}>
                    <AlertCircle size={28} color={COLORS.secondaryText} />
                    <Text style={styles.pickerEmptyText}>No areas found for this city</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1FA',
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.lightPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#F5F6FA',
  },
  modalBody: {
    padding: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  scopeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  scopeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#E8E9F3',
  },
  scopeOptionActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  scopeOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scopeOptionTextActive: {
    color: '#FFF',
  },
  globalInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EDF2FE',
    borderWidth: 1,
    borderColor: '#D4E2FC',
    borderRadius: RADIUS.input,
    padding: 14,
    marginBottom: 16,
  },
  globalInfoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.navy,
    lineHeight: 18,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
    borderColor: '#ECEEF8',
    borderRadius: RADIUS.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownDisabled: {
    backgroundColor: '#F3F4F8',
    borderColor: '#E2E4EE',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownValueText: {
    fontSize: 14,
    color: COLORS.navy,
  },
  dropdownPlaceholder: {
    color: COLORS.secondaryText,
    fontStyle: 'italic',
  },
  dropdownDisabledText: {
    fontSize: 13,
    color: COLORS.secondaryText,
    fontStyle: 'italic',
  },
  threeCols: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  colItem: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
    borderColor: '#ECEEF8',
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputCurrency: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.hotPink,
    marginRight: 4,
  },
  inputCurrencyMuted: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginRight: 4,
  },
  inputControl: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  inputUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    padding: 14,
    borderRadius: RADIUS.input,
    marginBottom: 16,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    maxWidth: 320,
  },
  toggleBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
  },
  toggleBadgeActive: {
    backgroundColor: '#E6F8EE',
  },
  toggleBadgeInactive: {
    backgroundColor: '#FDEEEF',
  },
  toggleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBadgeTextActive: {
    color: COLORS.success,
  },
  toggleBadgeTextInactive: {
    color: COLORS.error,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F1FA',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.button,
    backgroundColor: '#F0F1FA',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  submitBtn: {
    borderRadius: RADIUS.button,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModalSheet: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1FA',
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  subModalCloseBtn: {
    padding: 4,
  },
  subModalSearch: {
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
  subModalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.navy,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: '#FDF0F7',
  },
  pickerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  pickerItemNameActive: {
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  pickerItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  pickerEmpty: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  pickerEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
