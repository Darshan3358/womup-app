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
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Truck,
  DollarSign,
  ArrowRight,
  Zap,
  Store,
  MapPin,
  Navigation,
  Calendar,
  ChevronDown,
  Search,
  X,
  Check,
  Building2,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { KpiCard } from '../components/common/KpiCard';
import { useAdminState } from '../context/AdminStateContext';

export const DashboardScreen: React.FC = () => {
  const {
    cities,
    zones,
    darkStores,
    setActiveTab,
    setSubView,
    orders,
    customers,
    staff,
    syncStatus,
    refreshFromDb,
  } = useAdminState();

  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'Today' | 'All Time'>('All Time');

  // Modals for filters
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

  // Filter Orders by City + Area + Date
  const filteredOrders = orders.filter((o) => {
    if (dateFilter === 'Today') {
      const orderDate = new Date(o.timestamp);
      const today = new Date();
      if (orderDate.toDateString() !== today.toDateString()) return false;
    }

    // Match zone
    const matchedZone = zones.find(
      (z) =>
        (o.areaId && (z.id === o.areaId || z._id === o.areaId)) ||
        (o.zoneName && z.name.toLowerCase() === o.zoneName.toLowerCase()) ||
        (o.address && o.address.toLowerCase().includes(z.name.toLowerCase()))
    );

    const orderCityName = o.cityName || matchedZone?.cityName || matchedZone?.city;

    if (selectedCityId !== 'ALL' && currentCity) {
      const matchCity =
        (o.cityId && String(o.cityId) === String(currentCity.id || currentCity._id)) ||
        (orderCityName && orderCityName.toLowerCase() === currentCity.name.toLowerCase());
      if (!matchCity) return false;
    }

    if (selectedAreaId !== 'ALL' && currentArea) {
      const matchArea =
        (o.areaId && String(o.areaId) === String(currentArea.id || currentArea._id)) ||
        (o.zoneName && o.zoneName.toLowerCase() === currentArea.name.toLowerCase()) ||
        (matchedZone && matchedZone.name.toLowerCase() === currentArea.name.toLowerCase());
      if (!matchArea) return false;
    }

    return true;
  });

  // Filter Staff by City + Area
  const filteredStaff = staff.filter((s) => {
    const matchedZone = zones.find(
      (z) =>
        (s.areaId && (z.id === s.areaId || z._id === s.areaId)) ||
        (s.zone && z.name.toLowerCase() === s.zone.toLowerCase())
    );
    const staffCityName = s.cityName || matchedZone?.cityName || matchedZone?.city;

    if (selectedCityId !== 'ALL' && currentCity) {
      const matchCity =
        (s.cityId && String(s.cityId) === String(currentCity.id || currentCity._id)) ||
        (staffCityName && staffCityName.toLowerCase() === currentCity.name.toLowerCase());
      if (!matchCity) return false;
    }

    if (selectedAreaId !== 'ALL' && currentArea) {
      const matchArea =
        (s.areaId && String(s.areaId) === String(currentArea.id || currentArea._id)) ||
        (s.zone && s.zone.toLowerCase() === currentArea.name.toLowerCase()) ||
        (matchedZone && matchedZone.name.toLowerCase() === currentArea.name.toLowerCase());
      if (!matchArea) return false;
    }

    return true;
  });

  // Filter Customers by City + Area
  const filteredCustomers = customers.filter((c) => {
    const matchedZone = zones.find(
      (z) =>
        z.name.toLowerCase() === (c.zoneName || '').toLowerCase() ||
        (c.address && c.address.toLowerCase().includes(z.name.toLowerCase()))
    );
    const custCityName = matchedZone?.cityName || matchedZone?.city;

    if (selectedCityId !== 'ALL' && currentCity) {
      const matchCity = custCityName && custCityName.toLowerCase() === currentCity.name.toLowerCase();
      if (!matchCity) return false;
    }

    if (selectedAreaId !== 'ALL' && currentArea) {
      const matchArea =
        (c.zoneName && c.zoneName.toLowerCase() === currentArea.name.toLowerCase()) ||
        (matchedZone && matchedZone.name.toLowerCase() === currentArea.name.toLowerCase());
      if (!matchArea) return false;
    }

    return true;
  });

  // Computed KPIs based on active filters
  const totalGmv = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOrdersCount = filteredOrders.filter(
    (o) => o.status !== 'Delivered' && o.status !== 'Cancelled'
  ).length;
  const pickersCount = filteredStaff.filter((s) => s.role === 'Picker' && s.status === 'On Duty').length;
  const ridersCount = filteredStaff.filter((s) => s.role === 'Rider' && s.status === 'On Duty').length;
  const liveFleetCount = pickersCount + ridersCount;

  // Group zones by City for Zone GMV Share & Demand
  const citiesToDisplay =
    selectedCityId !== 'ALL' && currentCity
      ? [currentCity]
      : activeCities.length > 0
      ? activeCities
      : [{ id: 'AHM', name: 'Ahmedabad', code: 'AHM', status: 'Active' as const }];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting Banner */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.banner}>
        <View style={styles.bannerContent}>
          <Image
            source={require('../../assets/womup_logo.png')}
            style={styles.bannerLogo}
            resizeMode="contain"
          />
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerGreeting}>Good Morning, Admin</Text>
            <Text style={styles.bannerSubtitle}>{syncStatus}</Text>
          </View>
          <TouchableOpacity style={styles.liveIndicator} onPress={refreshFromDb} activeOpacity={0.8}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveText}>DB LIVE</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ========================================================================= */}
      {/* FILTERS (New — added above KPIs as per SRS)                                */}
      {/* ========================================================================= */}
      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterHeaderTitle}>📊 TELEMETRY FILTERS</Text>
          {(selectedCityId !== 'ALL' || selectedAreaId !== 'ALL' || dateFilter !== 'All Time') && (
            <TouchableOpacity
              onPress={() => {
                setSelectedCityId('ALL');
                setSelectedAreaId('ALL');
                setDateFilter('All Time');
              }}
            >
              <Text style={styles.resetFilterText}>Reset All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {/* City Filter */}
          <TouchableOpacity
            style={[styles.filterDropdownBtn, selectedCityId !== 'ALL' && styles.activeFilterDropdown]}
            onPress={() => setShowCityPicker(true)}
            activeOpacity={0.8}
          >
            <MapPin size={13} color={selectedCityId !== 'ALL' ? COLORS.purple : COLORS.textMuted} />
            <Text style={[styles.filterDropdownText, selectedCityId !== 'ALL' && styles.activeFilterText]} numberOfLines={1}>
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
            <Text style={[styles.filterDropdownText, selectedAreaId !== 'ALL' && styles.activeFilterText]} numberOfLines={1}>
              Area: {currentArea ? currentArea.name : 'All'}
            </Text>
            <ChevronDown size={14} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Date Filter */}
          <TouchableOpacity
            style={[styles.filterDropdownBtn, dateFilter !== 'All Time' && styles.activeFilterDropdown]}
            onPress={() => setDateFilter((prev) => (prev === 'Today' ? 'All Time' : 'Today'))}
            activeOpacity={0.8}
          >
            <Calendar size={13} color={dateFilter !== 'All Time' ? COLORS.hotPink : COLORS.textMuted} />
            <Text style={[styles.filterDropdownText, dateFilter !== 'All Time' && styles.activeFilterText]} numberOfLines={1}>
              Date: {dateFilter}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top 4 Telemetry KPI Cards (Scoped by City / Area / Date) */}
      <Text style={styles.sectionTitle}>
        Real-time Telemetry {currentCity ? `(${currentCity.name}${currentArea ? ` → ${currentArea.name}` : ''})` : '(National)'}
      </Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiRow}>
          <KpiCard
            title="Total GMV"
            value={totalGmv > 0 ? `₹${totalGmv.toLocaleString()}` : '₹0'}
            trend="0.0%"
            isPositive={true}
            subLabel={dateFilter === 'Today' ? 'today' : 'all-time'}
            accentColor={COLORS.hotPink}
            onPress={() => setActiveTab('Orders')}
          />
          <KpiCard
            title="Active Orders"
            value={String(activeOrdersCount)}
            trend="0.0%"
            isPositive={true}
            subLabel="in fulfillment"
            accentColor={COLORS.purple}
            onPress={() => setActiveTab('Orders')}
          />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard
            title="Live Fleet"
            value={String(liveFleetCount)}
            subLabel={`On Duty (${pickersCount} Pickers / ${ridersCount} Riders)`}
            accentColor={COLORS.blue}
            onPress={() => setActiveTab('Staff')}
          />
          <KpiCard
            title="Total Customers"
            value={String(filteredCustomers.length)}
            trend="0.0%"
            isPositive={true}
            subLabel="in selected scope"
            accentColor={COLORS.deepPurple}
            onPress={() => setActiveTab('Users')}
          />
        </View>
      </View>

      {/* ========================================================================= */}
      {/* ZONE GMV SHARE & DEMAND (Grouped by City as specified in SRS)              */}
      {/* ========================================================================= */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Zone GMV Share & Demand</Text>
            <Text style={styles.cardSubTitle}>Grouped by Operational City</Text>
          </View>
          <TouchableOpacity onPress={() => setActiveTab('Prices')}>
            <Text style={styles.linkText}>View Prices</Text>
          </TouchableOpacity>
        </View>

        {citiesToDisplay.map((city) => {
          // Get areas for this city
          const cityIdStr = city.id || (city as any)._id;
          const cityZones = zones.filter((z) => {
            if (z.cityId && cityIdStr && String(z.cityId) === String(cityIdStr)) return true;
            if (z.cityName && city.name && z.cityName.toLowerCase() === city.name.toLowerCase()) return true;
            if (z.city && city.name && z.city.toLowerCase() === city.name.toLowerCase()) return true;
            return false;
          });

          // Further filter if an area is selected
          const displayedCityZones =
            selectedAreaId !== 'ALL' && currentArea
              ? cityZones.filter((z) => z.id === currentArea.id || z.name === currentArea.name)
              : cityZones;

          if (displayedCityZones.length === 0) return null;

          return (
            <View key={cityIdStr || city.name} style={styles.cityCluster}>
              {/* City Group Header */}
              <View style={styles.cityClusterHeader}>
                <Building2 size={15} color={COLORS.purple} />
                <Text style={styles.cityClusterTitle}>
                  🏙️ {city.name.toUpperCase()} ({cityZones.length} {cityZones.length === 1 ? 'area' : 'areas'})
                </Text>
              </View>

              {/* Area Progress Rows */}
              {displayedCityZones.map((zone) => {
                const zoneOrders = filteredOrders.filter((o) => {
                  if (!o) return false;
                  if (o.zoneName === zone.name) return true;
                  const zLower = (zone.name || '').toLowerCase();
                  const oZoneLower = (o.zoneName || '').toLowerCase();
                  const oStoreLower = (o.darkStore || '').toLowerCase();
                  const oAddrLower = (o.address || '').toLowerCase();

                  if (oZoneLower && (zLower.includes(oZoneLower) || oZoneLower.includes(zLower))) return true;
                  if (oStoreLower && (oStoreLower.includes(zLower) || zLower.split(/[\s-]+/).some((p) => p.length > 3 && oStoreLower.includes(p)))) return true;
                  if (oAddrLower && zLower.split(/[\s-]+/).some((p) => p.length > 3 && oAddrLower.includes(p))) return true;

                  return false;
                });

                const zoneActiveOrders = zoneOrders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
                const zoneGmv = zoneOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                const percent = totalGmv > 0 ? Math.round((zoneGmv / totalGmv) * 100) : 0;

                return (
                  <View key={zone.id} style={styles.zoneRow}>
                    <View style={styles.zoneLabelCol}>
                      <Text style={styles.zoneName} numberOfLines={1}>{zone.name}</Text>
                      <Text style={styles.zoneMeta}>
                        {zoneOrders.length} {zoneOrders.length === 1 ? 'order' : 'orders'} ({zoneActiveOrders} active)
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <LinearGradient
                        colors={GRADIENTS.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBar, { width: `${Math.min(100, Math.max(percent, percent > 0 ? 12 : 0))}%` }]}
                      />
                    </View>
                    <Text style={styles.percentText}>{percent}%</Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* Quick Action Shortcuts */}
      <Text style={styles.sectionTitle}>Operational Shortcuts</Text>
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => setActiveTab('Prices')}
        >
          <LinearGradient colors={['#FCE1F5', '#F562AF']} style={styles.shortcutIcon}>
            <DollarSign size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.shortcutText}>Adjust Prices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => setActiveTab('Inventory')}
        >
          <LinearGradient colors={['#E2E6F9', '#8364E6']} style={styles.shortcutIcon}>
            <Zap size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.shortcutText}>Stock Loss</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => setActiveTab('Orders')}
        >
          <LinearGradient colors={['#8364E6', '#515FEA']} style={styles.shortcutIcon}>
            <ShoppingBag size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.shortcutText}>Live Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => {
            setSubView('none');
            setActiveTab('Stores');
          }}
        >
          <LinearGradient colors={['#FCE1F5', '#BF54D0']} style={styles.shortcutIcon}>
            <Store size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.shortcutText}>Dark Stores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => setSubView('ShoppingCoin')}
        >
          <LinearGradient colors={['#F1A4CD', '#BF54D0']} style={styles.shortcutIcon}>
            <TrendingUp size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.shortcutText}>Shopping Coin</Text>
        </TouchableOpacity>
      </View>

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
                  <Text style={styles.modalTitle}>Filter Dashboard by City</Text>
                  <Text style={styles.modalSubtitle}>Scope telemetry and KPIs by city</Text>
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
                      All Cities (National)
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
                    const isSelected = selectedCityId === (city.id || (city as any)._id);
                    return (
                      <TouchableOpacity
                        key={city.id || (city as any)._id}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedCityId(city.id || (city as any)._id || '');
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
                  <Text style={styles.modalSubtitle}>Scope dashboard to a specific area</Text>
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
                    const isSelected = selectedAreaId === (area.id || (area as any)._id);
                    return (
                      <TouchableOpacity
                        key={area.id || (area as any)._id}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedAreaId(area.id || (area as any)._id || '');
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
  },
  banner: {
    borderRadius: RADIUS.banner,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerLogo: {
    width: 44,
    height: 44,
    marginRight: SPACING.sm,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerGreeting: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  filterCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  resetFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
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
  activeFilterText: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: SPACING.sm,
  },
  kpiGrid: {
    marginBottom: SPACING.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  cardSubTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },
  cityCluster: {
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: SPACING.sm,
  },
  cityClusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    marginBottom: 8,
  },
  cityClusterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.5,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  zoneLabelCol: {
    width: 120,
    marginRight: 8,
  },
  zoneName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  zoneMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    width: 32,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  shortcutBtn: {
    alignItems: 'center',
    flex: 1,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  shortcutText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
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
