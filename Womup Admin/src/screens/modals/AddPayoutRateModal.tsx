import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
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
  Info,
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

  // Field refs & focus tracking for seamless input interaction
  const rateInputRef = useRef<TextInput>(null);
  const minInputRef = useRef<TextInput>(null);
  const maxInputRef = useRef<TextInput>(null);
  const [focusedRateField, setFocusedRateField] = useState<'rate' | 'min' | 'max' | null>(null);

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
            <View style={styles.headerLeftContainer}>
              <View style={styles.headerIcon}>
                <DollarSign size={20} color={COLORS.hotPink} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {editingItem ? 'Edit Payout Rate' : 'Add New Payout Rate'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={2}>
                  Configure distance-based rider compensation rules
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
              <View style={styles.colItem}>
                <Text style={styles.fieldLabel} numberOfLines={1}>
                  Rate / km (₹) <Text style={{ color: COLORS.hotPink }}>*</Text>
                </Text>
                <Pressable
                  style={[
                    styles.rateFieldBox,
                    focusedRateField === 'rate' && styles.rateFieldBoxFocused,
                  ]}
                  onPress={() => rateInputRef.current?.focus()}
                >
                  <Text
                    style={[
                      styles.rateCurrencyPrefix,
                      focusedRateField === 'rate' && styles.rateCurrencyPrefixFocused,
                    ]}
                    selectable={false}
                  >
                    ₹
                  </Text>
                  <TextInput
                    ref={rateInputRef}
                    style={[
                      styles.rateTextInput,
                      Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                    ]}
                    value={ratePerKm}
                    onChangeText={(val) => setRatePerKm(val.replace(/[^0-9.]/g, ''))}
                    onFocus={() => setFocusedRateField('rate')}
                    onBlur={() => setFocusedRateField(null)}
                    keyboardType="decimal-pad"
                    placeholder="15"
                    placeholderTextColor="#94A3B8"
                    selectTextOnFocus
                  />
                  <View style={styles.rateUnitBadge}>
                    <Text style={styles.rateUnitBadgeText} selectable={false}>
                      /km
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Minimum Payout Floor */}
              <View style={styles.colItem}>
                <Text style={styles.fieldLabel} numberOfLines={1}>
                  Min Floor (₹)
                </Text>
                <Pressable
                  style={[
                    styles.rateFieldBox,
                    focusedRateField === 'min' && styles.rateFieldBoxFocused,
                  ]}
                  onPress={() => minInputRef.current?.focus()}
                >
                  <Text
                    style={[
                      styles.rateCurrencyPrefix,
                      focusedRateField === 'min' && styles.rateCurrencyPrefixFocused,
                    ]}
                    selectable={false}
                  >
                    ₹
                  </Text>
                  <TextInput
                    ref={minInputRef}
                    style={[
                      styles.rateTextInput,
                      Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                    ]}
                    value={minPayout}
                    onChangeText={(val) => setMinPayout(val.replace(/[^0-9]/g, ''))}
                    onFocus={() => setFocusedRateField('min')}
                    onBlur={() => setFocusedRateField(null)}
                    keyboardType="numeric"
                    placeholder="35"
                    placeholderTextColor="#94A3B8"
                    selectTextOnFocus
                  />
                </Pressable>
              </View>

              {/* Maximum Payout Cap */}
              <View style={styles.colItem}>
                <Text style={styles.fieldLabel} numberOfLines={1}>
                  Max Cap (₹)
                </Text>
                <Pressable
                  style={[
                    styles.rateFieldBox,
                    focusedRateField === 'max' && styles.rateFieldBoxFocused,
                  ]}
                  onPress={() => maxInputRef.current?.focus()}
                >
                  <Text
                    style={[
                      styles.rateCurrencyPrefix,
                      focusedRateField === 'max' && styles.rateCurrencyPrefixFocused,
                    ]}
                    selectable={false}
                  >
                    ₹
                  </Text>
                  <TextInput
                    ref={maxInputRef}
                    style={[
                      styles.rateTextInput,
                      Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                    ]}
                    value={maxPayout}
                    onChangeText={(val) => setMaxPayout(val.replace(/[^0-9]/g, ''))}
                    onFocus={() => setFocusedRateField('max')}
                    onBlur={() => setFocusedRateField(null)}
                    keyboardType="numeric"
                    placeholder="180"
                    placeholderTextColor="#94A3B8"
                    selectTextOnFocus
                  />
                </Pressable>
              </View>
            </View>

            {/* Live Pricing Math & Floor Explanation Helper */}
            <View style={styles.floorHelperBanner}>
              <Info size={14} color="#6366F1" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.floorHelperTitle}>
                  Dynamic Cart & Rider Pricing Formula:
                </Text>
                <Text style={styles.floorHelperText}>
                  • Customer Cart Fee: max(Distance × ₹{ratePerKm || '11'}, ₹{minPayout || '40'}) min floor guaranteed.
                  {'\n'}• Example (3.26 km trip): 3.26 × ₹{ratePerKm || '11'} = ₹{(3.26 * (Number(ratePerKm) || 11)).toFixed(2)} → { (3.26 * (Number(ratePerKm) || 11)) < (Number(minPayout) || 40) ? `Floor applied: Customer pays ₹${minPayout || 40}` : `Customer pays ₹${Math.round(3.26 * (Number(ratePerKm) || 11))}` }.
                  {'\n'}• 100% of this delivery fee is paid directly to your rider.
                </Text>
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
    padding: 12,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    width: '100%',
    maxWidth: 500,
    maxHeight: '92%',
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1FA',
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightPink,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#F5F6FA',
    flexShrink: 0,
  },
  modalBody: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  scopeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  scopeOption: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
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
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
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
    gap: 10,
    marginBottom: 16,
  },
  colItem: {
    flex: 1,
    minWidth: 0,
  },
  rateFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.input,
    paddingHorizontal: 10,
    height: 48,
    cursor: 'text' as any,
  },
  rateFieldBoxFocused: {
    borderColor: COLORS.purple,
    backgroundColor: '#FFFFFF',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  rateCurrencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 6,
    userSelect: 'none' as any,
    pointerEvents: 'none' as any,
  },
  rateCurrencyPrefixFocused: {
    color: COLORS.purple,
  },
  rateTextInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    paddingVertical: 0,
    paddingHorizontal: 2,
    margin: 0,
  },
  rateUnitBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 4,
    pointerEvents: 'none' as any,
  },
  rateUnitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    userSelect: 'none' as any,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
    borderColor: '#ECEEF8',
    borderRadius: RADIUS.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputControl: {
    flex: 1,
    minWidth: 0,
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.navy,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F1FA',
    gap: 10,
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
  floorHelperBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: RADIUS.input,
    padding: 12,
    marginBottom: 16,
  },
  floorHelperTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
    marginBottom: 4,
  },
  floorHelperText: {
    fontSize: 11,
    color: '#4338CA',
    lineHeight: 16,
  },
});
