import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import {
  ShieldCheck,
  Clock,
  UserCheck,
  MapPin,
  Navigation,
  ChevronDown,
  Search,
  X,
  Check,
  Building,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const AuditLogsScreen: React.FC = () => {
  const { auditLogs, cities, zones, darkStores } = useAdminState();

  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

  const activeCities = cities.filter((c) => c.status === 'Active' || !c.status);
  const currentCity = activeCities.find(
    (c) => (c.id && c.id === selectedCityId) || (c._id && c._id === selectedCityId)
  );

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

  // Helper: Resolve City, Area, Store for a log entry
  const resolveLogContext = (log: any) => {
    let areaName = log.areaName || 'Chandlodiya-Tragad';
    let matchedZone = zones.find(
      (z) =>
        (log.target && log.target.toLowerCase().includes(z.name.toLowerCase())) ||
        (log.details && log.details.toLowerCase().includes(z.name.toLowerCase()))
    );
    if (matchedZone) areaName = matchedZone.name;

    let cityName = matchedZone?.cityName || matchedZone?.city || 'Ahmedabad';
    let storeName = matchedZone?.assignedStore?.name || matchedZone?.darkStore || `Wom Up ${areaName} Store`;

    return { cityName, areaName, storeName };
  };

  const filteredLogs = auditLogs.filter((log) => {
    const { cityName, areaName } = resolveLogContext(log);

    if (selectedCityId !== 'ALL' && currentCity) {
      if (cityName.toLowerCase() !== currentCity.name.toLowerCase()) return false;
    }

    if (selectedAreaId !== 'ALL' && currentArea) {
      if (areaName.toLowerCase() !== currentArea.name.toLowerCase()) return false;
    }

    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <ShieldCheck size={24} color={COLORS.purple} style={{ marginRight: 8 }} />
        <View>
          <Text style={styles.title}>System Security & Audit Log</Text>
          <Text style={styles.subtitle}>Immutable operational record with City → Area scoping</Text>
        </View>
      </View>

      {/* Cascading Filter Bar */}
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

      {filteredLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No audit logs found for the selected scope</Text>
        </View>
      ) : (
        filteredLogs.map((log) => {
          const context = resolveLogContext(log);

          return (
            <View key={log.id} style={styles.logCard}>
              {/* Breadcrumb Row */}
              <View style={styles.breadcrumbBadge}>
                <Text style={styles.breadcrumbText}>
                  🏙️ {context.cityName} → 📍 {context.areaName}
                </Text>
              </View>

              <View style={styles.storeBadge}>
                <Building size={11} color={COLORS.purple} style={{ marginRight: 4 }} />
                <Text style={styles.storeText}>{context.storeName}</Text>
              </View>

              <View style={styles.cardHeader}>
                <Text style={styles.actionName}>{log.action}</Text>
                <View style={styles.timeTag}>
                  <Clock size={11} color={COLORS.secondaryText} style={{ marginRight: 3 }} />
                  <Text style={styles.timeText}>{log.timestamp}</Text>
                </View>
              </View>

              <View style={styles.adminRow}>
                <UserCheck size={12} color={COLORS.purple} style={{ marginRight: 4 }} />
                <Text style={styles.adminName}>{log.adminName}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.targetText}>{log.target}</Text>
              </View>

              <Text style={styles.detailsText}>{log.details}</Text>
            </View>
          );
        })
      )}

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
                  <Text style={styles.modalTitle}>Filter Audit Logs by City</Text>
                  <Text style={styles.modalSubtitle}>Scope audit trails to a specific city</Text>
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
                    Filter by Area {currentCity ? `(${currentCity.name})` : ''}
                  </Text>
                  <Text style={styles.modalSubtitle}>Scope audit trails to an area</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  filtersBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.md,
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  logCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  breadcrumbBadge: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  breadcrumbText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  storeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  adminName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },
  dot: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 6,
  },
  targetText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailsText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 4,
    lineHeight: 16,
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
