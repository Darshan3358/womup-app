import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import {
  UserCheck,
  Star,
  RefreshCw,
  Phone,
  MapPin,
  Navigation,
  ChevronDown,
  Search,
  X,
  Check,
  Building,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { StaffMember } from '../types/admin';

export const StaffScreen: React.FC = () => {
  const { staff, cities, zones, darkStores, setActiveModal } = useAdminState();

  const [activeRole, setActiveRole] = useState<'Picker' | 'Rider'>('Picker');
  const [dutyFilter, setDutyFilter] = useState<'All' | 'On Duty' | 'Off Duty'>('All');
  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');

  // Modal pickers
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

  // 1. Resolve Active Cities
  const activeCities = cities.filter((c) => c.status === 'Active' || !c.status);
  const currentCity = activeCities.find(
    (c) => (c.id && c.id === selectedCityId) || (c._id && c._id === selectedCityId)
  );

  // 2. Resolve Available Areas for Selected City
  const availableAreas = zones.filter((z) => {
    if (selectedCityId === 'ALL') return true;
    if (!currentCity) return true;
    const currentCityIdStr = currentCity.id || currentCity._id;
    if (z.cityId && currentCityIdStr && String(z.cityId) === String(currentCityIdStr)) return true;
    if (z.cityName && currentCity.name && z.cityName.toLowerCase() === currentCity.name.toLowerCase()) return true;
    if (z.city && currentCity.name && z.city.toLowerCase() === currentCity.name.toLowerCase()) return true;
    return false;
  });

  const currentArea = availableAreas.find(
    (a) => (a.id && a.id === selectedAreaId) || (a._id && a._id === selectedAreaId)
  );

  // Resolve staff member hierarchy (City, Area, Store)
  const resolveStaffHierarchy = (member: StaffMember) => {
    let areaName = member.areaName || member.zone || 'Central Area';
    let matchedZone = zones.find(
      (z) =>
        (member.areaId && (z.id === member.areaId || z._id === member.areaId)) ||
        (member.zone && z.name.toLowerCase() === member.zone.toLowerCase())
    );

    if (matchedZone) {
      areaName = matchedZone.name;
    }

    let cityName = member.cityName || matchedZone?.cityName || matchedZone?.city;
    if (!cityName && matchedZone?.cityId) {
      const c = cities.find((ct) => ct.id === matchedZone.cityId || ct._id === matchedZone.cityId);
      if (c) cityName = c.name;
    }
    if (!cityName) cityName = 'Ahmedabad';

    let storeName = member.darkStore || matchedZone?.assignedStore?.name || matchedZone?.darkStore;
    if (!storeName) {
      const foundStore = darkStores.find((s) => {
        if (matchedZone && s.areaId && (s.areaId === matchedZone.id || s.areaId === matchedZone._id)) return true;
        if (matchedZone && s.areaName && s.areaName.toLowerCase() === matchedZone.name.toLowerCase()) return true;
        return false;
      });
      storeName = foundStore?.name || `Wom Up ${areaName} Dark Store`;
    }

    return { cityName, areaName, storeName };
  };

  const filteredStaff = staff.filter((s) => {
    const matchesRole = s.role === activeRole;
    const matchesDuty = dutyFilter === 'All' || s.status === dutyFilter;
    if (!matchesRole || !matchesDuty) return false;

    const { cityName, areaName } = resolveStaffHierarchy(s);

    // City Filter
    if (selectedCityId !== 'ALL' && currentCity) {
      const matchCity =
        (s.cityId && String(s.cityId) === String(currentCity.id || currentCity._id)) ||
        cityName.toLowerCase() === currentCity.name.toLowerCase();
      if (!matchCity) return false;
    }

    // Area Filter
    if (selectedAreaId !== 'ALL' && currentArea) {
      const matchArea =
        (s.areaId && String(s.areaId) === String(currentArea.id || currentArea._id)) ||
        areaName.toLowerCase() === currentArea.name.toLowerCase() ||
        (s.zone && s.zone.toLowerCase() === currentArea.name.toLowerCase());
      if (!matchArea) return false;
    }

    return true;
  });

  const onDutyCount = filteredStaff.filter((s) => s.status === 'On Duty').length;
  const offDutyCount = filteredStaff.filter((s) => s.status === 'Off Duty').length;

  return (
    <View style={styles.container}>
      {/* Top Segmented Controls & Cascading Filters */}
      <View style={styles.topSection}>
        {/* Role Tabs */}
        <View style={styles.roleTabRow}>
          <TouchableOpacity
            style={[styles.roleTab, activeRole === 'Picker' && styles.activeRoleTab]}
            onPress={() => setActiveRole('Picker')}
          >
            <Text
              style={[styles.roleTabText, activeRole === 'Picker' && styles.activeRoleTabText]}
            >
              Pickers ({staff.filter((s) => s.role === 'Picker').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, activeRole === 'Rider' && styles.activeRoleTab]}
            onPress={() => setActiveRole('Rider')}
          >
            <Text
              style={[styles.roleTabText, activeRole === 'Rider' && styles.activeRoleTabText]}
            >
              Riders ({staff.filter((s) => s.role === 'Rider').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cascading Filter Bar: City + Area + Duty Status */}
        <View style={styles.filtersBar}>
          {/* City Filter */}
          <TouchableOpacity
            style={[styles.filterDropdownBtn, selectedCityId !== 'ALL' && styles.activeFilterDropdown]}
            onPress={() => setShowCityPicker(true)}
            activeOpacity={0.8}
          >
            <MapPin size={13} color={selectedCityId !== 'ALL' ? COLORS.purple : COLORS.textMuted} />
            <Text style={[styles.filterDropdownText, selectedCityId !== 'ALL' && styles.activeDropdownText]} numberOfLines={1}>
              City: {currentCity ? currentCity.name : 'All'}
            </Text>
            <ChevronDown size={14} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Area Filter */}
          <TouchableOpacity
            style={[
              styles.filterDropdownBtn,
              selectedAreaId !== 'ALL' && styles.activeFilterDropdown,
              selectedCityId === 'ALL' && availableAreas.length === 0 && styles.disabledFilterBtn,
            ]}
            onPress={() => {
              if (selectedCityId === 'ALL' && availableAreas.length === 0) return;
              setShowAreaPicker(true);
            }}
            activeOpacity={0.8}
          >
            <Navigation size={13} color={selectedAreaId !== 'ALL' ? COLORS.blue : COLORS.textMuted} />
            <Text style={[styles.filterDropdownText, selectedAreaId !== 'ALL' && styles.activeDropdownText]} numberOfLines={1}>
              Area: {currentArea ? currentArea.name : 'All'}
            </Text>
            <ChevronDown size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Fleet KPI Summary Row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total</Text>
            <Text style={styles.kpiValue}>{filteredStaff.length}</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#E8F8F0' }]}>
            <Text style={styles.kpiLabel}>On Duty</Text>
            <Text style={[styles.kpiValue, { color: COLORS.success }]}>{onDutyCount}</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#FCECEE' }]}>
            <Text style={styles.kpiLabel}>Off Duty</Text>
            <Text style={[styles.kpiValue, { color: COLORS.error }]}>{offDutyCount}</Text>
          </View>
        </View>

        {/* Duty Status Filter Pills */}
        <View style={styles.filterRow}>
          {(['All', 'On Duty', 'Off Duty'] as const).map((filter) => {
            const isSelected = dutyFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isSelected && styles.activeFilterPill]}
                onPress={() => setDutyFilter(filter)}
              >
                <Text style={[styles.filterText, isSelected && styles.activeFilterText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Staff List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredStaff.length === 0 ? (
          <View style={styles.emptyState}>
            <UserCheck size={40} color={COLORS.border} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No staff members found</Text>
            <Text style={styles.emptySubTitle}>
              No {activeRole.toLowerCase()}s found matching the selected filters ({currentCity ? currentCity.name : 'All Cities'}, {currentArea ? currentArea.name : 'All Areas'}).
            </Text>
          </View>
        ) : (
          filteredStaff.map((member) => {
            const hierarchy = resolveStaffHierarchy(member);
            const isOnDuty = member.status === 'On Duty';

            return (
              <View key={member.id} style={styles.staffCard}>
                <Image source={{ uri: member.avatar }} style={styles.avatar} />

                <View style={styles.infoCol}>
                  <Text style={styles.staffName}>{member.name}</Text>
                  <Text style={styles.staffRoleMeta}>
                    {member.role} • {hierarchy.storeName}
                  </Text>

                  {/* City + Area Location Tag */}
                  <View style={styles.locationTagRow}>
                    <Text style={styles.locationTagText}>
                      🏙️ {hierarchy.cityName} • 📍 {hierarchy.areaName}
                    </Text>
                  </View>

                  <View style={styles.phoneRow}>
                    <Phone size={11} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                    <Text style={styles.phoneText}>{member.phone}</Text>
                  </View>

                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.dutyDot,
                        { backgroundColor: isOnDuty ? COLORS.success : COLORS.error },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dutyStatusText,
                        { color: isOnDuty ? COLORS.success : COLORS.error },
                      ]}
                    >
                      {member.status}
                    </Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.workloadText}>{member.activeOrdersCount} active orders</Text>
                  </View>
                </View>

                <View style={styles.rightCol}>
                  <View style={styles.ratingBadge}>
                    <Star size={11} color="#EAB308" fill="#EAB308" style={{ marginRight: 2 }} />
                    <Text style={styles.ratingText}>{member.rating || '5.0'}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.reassignBtn}
                    onPress={() => setActiveModal('StaffReassignment')}
                  >
                    <RefreshCw size={12} color={COLORS.purple} />
                    <Text style={styles.reassignText}>Reassign</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ================= MODAL: SELECT CITY ================= */}
      <Modal
        visible={showCityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <MapPin size={20} color={COLORS.purple} />
                <View>
                  <Text style={styles.modalTitle}>Filter Staff by City</Text>
                  <Text style={styles.modalSubtitle}>Scope pickers and fleet by city</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.searchInnerRow}>
                <Search size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInnerInput}
                  placeholder="Search city by name or code..."
                  placeholderTextColor={COLORS.textMuted}
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
                {citySearch ? (
                  <TouchableOpacity onPress={() => setCitySearch('')}>
                    <X size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                <TouchableOpacity
                  style={[styles.modalItem, selectedCityId === 'ALL' && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedCityId('ALL');
                    setSelectedAreaId('ALL');
                    setShowCityPicker(false);
                    setCitySearch('');
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <View style={[styles.cityMiniBadge, { backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.cityMiniBadgeText, { color: COLORS.textMuted }]}>ALL</Text>
                    </View>
                    <Text style={[styles.modalItemText, selectedCityId === 'ALL' && styles.modalItemTextActive]}>
                      All Cities
                    </Text>
                  </View>
                  {selectedCityId === 'ALL' && <Check size={18} color={COLORS.purple} />}
                </TouchableOpacity>

                {activeCities
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                      c.code.toLowerCase().includes(citySearch.toLowerCase())
                  )
                  .map((city) => {
                    const isSelected = selectedCityId === (city.id || city._id);
                    return (
                      <TouchableOpacity
                        key={city.id || city._id}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedCityId(city.id || city._id || '');
                          setSelectedAreaId('ALL');
                          setShowCityPicker(false);
                          setCitySearch('');
                        }}
                      >
                        <View style={styles.modalItemLeft}>
                          <View style={styles.cityMiniBadge}>
                            <Text style={styles.cityMiniBadgeText}>{city.code}</Text>
                          </View>
                          <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                            {city.name}
                          </Text>
                        </View>
                        {isSelected && <Check size={18} color={COLORS.purple} />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: SELECT AREA ================= */}
      <Modal
        visible={showAreaPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAreaPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Navigation size={20} color={COLORS.blue} />
                <View>
                  <Text style={styles.modalTitle}>
                    Filter Staff by Area {currentCity ? `(${currentCity.name})` : ''}
                  </Text>
                  <Text style={styles.modalSubtitle}>Scope fleet to a specific area/hub</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAreaPicker(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.searchInnerRow}>
                <Search size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInnerInput}
                  placeholder="Search area name or code..."
                  placeholderTextColor={COLORS.textMuted}
                  value={areaSearch}
                  onChangeText={setAreaSearch}
                />
                {areaSearch ? (
                  <TouchableOpacity onPress={() => setAreaSearch('')}>
                    <X size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                <TouchableOpacity
                  style={[styles.modalItem, selectedAreaId === 'ALL' && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedAreaId('ALL');
                    setShowAreaPicker(false);
                    setAreaSearch('');
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <View style={[styles.areaMiniDot, { backgroundColor: COLORS.textMuted }]} />
                    <Text style={[styles.modalItemText, selectedAreaId === 'ALL' && styles.modalItemTextActive]}>
                      All Areas {currentCity ? `in ${currentCity.name}` : ''}
                    </Text>
                  </View>
                  {selectedAreaId === 'ALL' && <Check size={18} color={COLORS.purple} />}
                </TouchableOpacity>

                {availableAreas
                  .filter(
                    (a) =>
                      a.name.toLowerCase().includes(areaSearch.toLowerCase()) ||
                      (a.code && a.code.toLowerCase().includes(areaSearch.toLowerCase()))
                  )
                  .map((area) => {
                    const isSelected = selectedAreaId === (area.id || area._id);
                    return (
                      <TouchableOpacity
                        key={area.id || area._id}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedAreaId(area.id || area._id || '');
                          setShowAreaPicker(false);
                          setAreaSearch('');
                        }}
                      >
                        <View style={styles.modalItemLeft}>
                          <View style={styles.areaMiniDot} />
                          <View>
                            <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                              {area.name}
                            </Text>
                            <Text style={styles.modalItemSub}>
                              {area.darkStore || 'Dark Store Hub'}
                            </Text>
                          </View>
                        </View>
                        {isSelected && <Check size={18} color={COLORS.purple} />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
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
    backgroundColor: COLORS.background,
  },
  topSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  roleTabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  activeRoleTab: {
    backgroundColor: COLORS.purple,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeRoleTabText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  filtersBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    flex: 1,
  },
  activeFilterDropdown: {
    backgroundColor: '#FAF5FF',
    borderColor: COLORS.purple,
  },
  disabledFilterBtn: {
    opacity: 0.6,
  },
  filterDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  activeDropdownText: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: 6,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
  },
  activeFilterPill: {
    backgroundColor: COLORS.purple,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeFilterText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 24,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    marginTop: SPACING.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySubTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  staffCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: SPACING.md,
    backgroundColor: '#F3F4F6',
  },
  infoCol: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  staffRoleMeta: {
    fontSize: 11,
    color: COLORS.purple,
    fontWeight: '600',
    marginTop: 1,
  },
  locationTagRow: {
    marginVertical: 3,
  },
  locationTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  phoneText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dutyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  dutyStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dotSeparator: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginHorizontal: 4,
  },
  workloadText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 52,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  reassignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 3,
  },
  reassignText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  modalBody: {
    padding: SPACING.md,
  },
  searchInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  searchInnerInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    padding: 0,
  },
  modalScroll: {
    maxHeight: 280,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemActive: {
    backgroundColor: '#FAF5FF',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cityMiniBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cityMiniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.purple,
  },
  areaMiniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blue,
  },
  modalItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalItemTextActive: {
    color: COLORS.purple,
    fontWeight: '800',
  },
  modalItemSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
