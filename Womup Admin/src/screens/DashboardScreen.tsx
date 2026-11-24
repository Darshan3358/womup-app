import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import {
  MapPin,
  Search,
  X,
  Check,
  Users,
  Store,
  ShoppingBag,
  Bike,
  ChevronRight,
  TrendingUp,
  Layers,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { AdminWelcomeCard } from '../components/dashboard/AdminWelcomeCard';
import { MetricGrid } from '../components/dashboard/MetricGrid';
import { SalesOverviewCard } from '../components/dashboard/SalesOverviewCard';
import { ZoneGmvShareCard, ZoneShareItem } from '../components/dashboard/ZoneGmvShareCard';
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard';
import { SystemStatusCard } from '../components/dashboard/SystemStatusCard';
import { DashboardKpiSkeleton } from '../components/common/Skeleton';
import { ApiService } from '../services/api';

export const DashboardScreen: React.FC = () => {
  const {
    cities,
    zones,
    setActiveTab,
    setSubView,
    orders,
    customers,
    staff,
    syncStatus,
    isLoading,
    refreshFromDb,
    adminUser,
  } = useAdminState();

  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'Today' | 'All Time'>('All Time');
  const [vendorsList, setVendorsList] = useState<any[]>([]);

  useEffect(() => {
    ApiService.getVendors().then((res) => {
      if (res.success && res.data) setVendorsList(res.data);
    }).catch(() => {});
  }, []);

  // Modals for filters
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

  // 1. Resolve Active Cities
  const activeCities = useMemo(
    () => cities.filter((c) => c.status === 'Active' || !c.status),
    [cities]
  );
  const currentCity = useMemo(
    () =>
      activeCities.find(
        (c) => (c.id && c.id === selectedCityId) || (c._id && c._id === selectedCityId)
      ),
    [activeCities, selectedCityId]
  );

  // 2. Resolve Available Areas for Selected City
  const availableAreas = useMemo(
    () =>
      zones.filter((z) => {
        if (selectedCityId === 'ALL') return true;
        if (!currentCity) return true;
        const currentCityIdStr = currentCity.id || currentCity._id;
        if (z.cityId && currentCityIdStr && String(z.cityId) === String(currentCityIdStr)) return true;
        if (z.cityName && currentCity.name && z.cityName.toLowerCase() === currentCity.name.toLowerCase()) return true;
        if (z.city && currentCity.name && z.city.toLowerCase() === currentCity.name.toLowerCase()) return true;
        return false;
      }),
    [zones, selectedCityId, currentCity]
  );

  const currentArea = useMemo(
    () =>
      availableAreas.find(
        (a) => (a.id && a.id === selectedAreaId) || (a._id && a._id === selectedAreaId)
      ),
    [availableAreas, selectedAreaId]
  );

  // Filter Orders by City + Area + Date
  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (dateFilter === 'Today') {
          const orderDate = new Date(o.timestamp);
          const today = new Date();
          if (orderDate.toDateString() !== today.toDateString()) return false;
        }

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
      }),
    [orders, dateFilter, zones, selectedCityId, currentCity, selectedAreaId, currentArea]
  );

  // Filter Staff by City + Area
  const filteredStaff = useMemo(
    () =>
      staff.filter((s) => {
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
      }),
    [staff, zones, selectedCityId, currentCity, selectedAreaId, currentArea]
  );

  // Filter Customers by City + Area
  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) => {
        const matchedZone = zones.find(
          (z) =>
            z.name.toLowerCase() === (c.zoneName || '').toLowerCase() ||
            (c.address && c.address.toLowerCase().includes(z.name.toLowerCase()))
        );
        const custCityName = matchedZone?.cityName || matchedZone?.city;

        if (selectedCityId !== 'ALL' && currentCity) {
          const matchCity =
            custCityName && custCityName.toLowerCase() === currentCity.name.toLowerCase();
          if (!matchCity) return false;
        }

        if (selectedAreaId !== 'ALL' && currentArea) {
          const matchArea =
            (c.zoneName && c.zoneName.toLowerCase() === currentArea.name.toLowerCase()) ||
            (matchedZone && matchedZone.name.toLowerCase() === currentArea.name.toLowerCase());
          if (!matchArea) return false;
        }

        return true;
      }),
    [customers, zones, selectedCityId, currentCity, selectedAreaId, currentArea]
  );

  // Computed Real-Time KPIs
  const totalGmv = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [filteredOrders]
  );
  const activeOrdersCount = useMemo(
    () =>
      filteredOrders.filter(
        (o) => o.status !== 'Delivered' && o.status !== 'Cancelled'
      ).length,
    [filteredOrders]
  );
  const pickersCount = useMemo(
    () => filteredStaff.filter((s) => s.role === 'Picker' && s.status === 'On Duty').length,
    [filteredStaff]
  );
  const ridersCount = useMemo(
    () => filteredStaff.filter((s) => s.role === 'Rider' && s.status === 'On Duty').length,
    [filteredStaff]
  );
  const liveFleetCount = useMemo(
    () => pickersCount + ridersCount,
    [pickersCount, ridersCount]
  );

  // Real-Time 7-Day GMV Breakdown for Sales Overview
  const last7DaysGmv = useMemo(() => {
    const days = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
    const now = new Date();

    filteredOrders.forEach((o) => {
      const orderDate = new Date(o.timestamp);
      const diffDays = Math.floor(
        (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 0 && diffDays < 7) {
        const oDay = (orderDate.getDay() + 6) % 7;
        days[oDay] += o.total || 0;
      }
    });

    return days;
  }, [filteredOrders]);

  const sales7DaysTotal = useMemo(() => {
    return last7DaysGmv.reduce((a, b) => a + b, 0);
  }, [last7DaysGmv]);

  // Real-Time Zone GMV Share Calculation
  const zoneGmvShares: ZoneShareItem[] = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;

    filteredOrders.forEach((o) => {
      const matchedZone = zones.find(
        (z) =>
          (o.areaId && (z.id === o.areaId || z._id === o.areaId)) ||
          (o.zoneName && z.name.toLowerCase() === o.zoneName.toLowerCase())
      );
      const name =
        o.cityName || matchedZone?.cityName || matchedZone?.city || o.zoneName || 'Ahmedabad';
      const amt = o.total || 0;
      map[name] = (map[name] || 0) + amt;
      total += amt;
    });

    const colors = ['#762DEB', '#268BFA', '#FF922E', '#13C783'];
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0 || total === 0) {
      return [];
    }

    return entries.slice(0, 3).map(([name, amt], idx) => ({
      name,
      percentage: Math.max(1, Math.round((amt / total) * 100)),
      color: colors[idx % colors.length],
    }));
  }, [filteredOrders, zones]);

  // Item 4: Real-Time Area Telemetry Breakdown (Vendors & Customers by Area)
  const areaBreakdownData = useMemo(() => {
    const sourceAreas = availableAreas.length > 0 ? availableAreas : zones;
    const computed = sourceAreas.map((zone) => {
      const zName = (zone.name || '').toLowerCase();
      const zoneCusts = customers.filter(
        (c) =>
          (c.zoneName && c.zoneName.toLowerCase() === zName) ||
          (c.address && c.address.toLowerCase().includes(zName))
      );
      const activeCusts = zoneCusts.filter(
        (c) =>
          (c as any).personalStatus === 'ACTIVE' ||
          (c.spend || (c as any).currentMonthShoppingGmv || 0) >= 2000
      );
      const zoneVendors = vendorsList.filter(
        (v) =>
          (v.address && v.address.toLowerCase().includes(zName)) ||
          (v.city && v.city.toLowerCase().includes(zName)) ||
          ((zone as any).pincode && v.pincode === (zone as any).pincode) ||
          (zone.pincodes && zone.pincodes.includes(v.pincode))
      );
      const zoneOrders = filteredOrders.filter(
        (o) =>
          (o.areaId && (zone.id === o.areaId || zone._id === o.areaId)) ||
          (o.zoneName && zone.name.toLowerCase() === (zone.name || '').toLowerCase()) ||
          (o.address && o.address.toLowerCase().includes(zName))
      );
      const gmv = zoneOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const hasRealStore = Boolean(zone.hasActiveStore || (zone.currentStoreCount && zone.currentStoreCount > 0));

      return {
        areaId: zone.id || zone._id,
        areaName: zone.name,
        cityName: zone.cityName || zone.city || 'Ahmedabad',
        pincode: (zone as any).pincode || zone.pincodes?.[0] || '',
        totalCustomers: zoneCusts.length,
        activeCustomers: activeCusts.length,
        totalVendors: zoneVendors.length,
        hasRealStore,
        gmv,
      };
    });

    if (selectedAreaId !== 'ALL') {
      return computed.filter(
        (item) => String(item.areaId) === String(selectedAreaId)
      );
    }

    // Only display real areas from DB that have actual registered stores, vendors, customers, or GMV
    const activeAreas = computed.filter(
      (item) => item.totalVendors > 0 || item.totalCustomers > 0 || item.gmv > 0 || item.hasRealStore
    );

    return activeAreas;
  }, [availableAreas, zones, customers, vendorsList, filteredOrders, selectedAreaId]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Admin Welcome Card */}
      <AdminWelcomeCard
        adminName={adminUser?.name || 'Admin Darshan'}
        dateLabel={dateFilter === 'Today' ? 'Today' : undefined}
        onPressDate={() =>
          setDateFilter((prev) => (prev === 'Today' ? 'All Time' : 'Today'))
        }
      />

      {/* 2. 2x2 KPI Metric Grid */}
      {isLoading ? (
        <DashboardKpiSkeleton />
      ) : (
        <MetricGrid
          totalGmv={totalGmv}
          activeOrdersCount={activeOrdersCount}
          totalCustomers={filteredCustomers.length}
          liveFleetCount={liveFleetCount}
          onPressGmv={() => setActiveTab('Orders')}
          onPressOrders={() => setActiveTab('Orders')}
          onPressCustomers={() => setActiveTab('Users')}
          onPressFleet={() => setActiveTab('Staff')}
        />
      )}

      {/* 3. Sales Overview Panel (Dark Violet Card with 7-Day Chart) */}
      <SalesOverviewCard
        totalSales={sales7DaysTotal}
        dailyData={last7DaysGmv}
        selectedRange={dateFilter === 'Today' ? 'Today' : 'Last 7 Days'}
        onPressRange={() =>
          setDateFilter((prev) => (prev === 'Today' ? 'All Time' : 'Today'))
        }
      />

      {/* 4. Zone GMV Share Panel (Donut Chart + Legend + Skyline) */}
      <ZoneGmvShareCard
        shares={zoneGmvShares}
        onViewAll={() => setActiveTab('Prices')}
      />

      {/* 5. Quick Actions Panel (4 Pastel Shortcut Tiles) */}
      <QuickActionsCard
        onAdjustPrices={() => setActiveTab('Prices')}
        onManageStock={() => setActiveTab('Inventory')}
        onViewStores={() => {
          setSubView('none');
          setActiveTab('Stores');
        }}
        onLiveOrders={() => setActiveTab('Orders')}
      />

      {/* Item 9: 4 Core Operation Consoles (Customer, Vendor, Purchase/Orders, Agent/Fleet) */}
      <View style={styles.consoleSection}>
        <Text style={styles.sectionHeading}>CORE OPERATION HUBS</Text>
        <View style={styles.consoleGrid}>
          {/* Customer Console */}
          <TouchableOpacity
            style={[styles.consoleCard, { borderTopColor: '#7C3AED' }]}
            onPress={() => setActiveTab('Users')}
            activeOpacity={0.8}
          >
            <View style={styles.consoleHeader}>
              <View style={[styles.consoleIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Users size={16} color="#7C3AED" />
              </View>
              <Text style={styles.consoleTitle}>Customer Hub</Text>
            </View>
            <Text style={styles.consoleCount}>{customers.length} Customers</Text>
            <Text style={styles.consoleSub}>KYC, Downline MLM & Profiles</Text>
            <View style={styles.consoleAction}>
              <Text style={[styles.consoleActionText, { color: '#7C3AED' }]}>Manage Users</Text>
              <ChevronRight size={12} color="#7C3AED" />
            </View>
          </TouchableOpacity>

          {/* Vendor Console */}
          <TouchableOpacity
            style={[styles.consoleCard, { borderTopColor: '#059669' }]}
            onPress={() => setActiveTab('Vendors')}
            activeOpacity={0.8}
          >
            <View style={styles.consoleHeader}>
              <View style={[styles.consoleIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Store size={16} color="#059669" />
              </View>
              <Text style={styles.consoleTitle}>Vendor Hub</Text>
            </View>
            <Text style={styles.consoleCount}>{vendorsList.length} Merchants</Text>
            <Text style={styles.consoleSub}>QR Collections & Commission</Text>
            <View style={styles.consoleAction}>
              <Text style={[styles.consoleActionText, { color: '#059669' }]}>Manage Vendors</Text>
              <ChevronRight size={12} color="#059669" />
            </View>
          </TouchableOpacity>

          {/* Purchase & Orders Console */}
          <TouchableOpacity
            style={[styles.consoleCard, { borderTopColor: '#DB2777' }]}
            onPress={() => setActiveTab('Orders')}
            activeOpacity={0.8}
          >
            <View style={styles.consoleHeader}>
              <View style={[styles.consoleIconBox, { backgroundColor: '#FCE7F3' }]}>
                <ShoppingBag size={16} color="#DB2777" />
              </View>
              <Text style={styles.consoleTitle}>Purchase Hub</Text>
            </View>
            <Text style={styles.consoleCount}>{filteredOrders.length} Orders</Text>
            <Text style={styles.consoleSub}>Dark Store Inventory & 11 Stages</Text>
            <View style={styles.consoleAction}>
              <Text style={[styles.consoleActionText, { color: '#DB2777' }]}>Track Orders</Text>
              <ChevronRight size={12} color="#DB2777" />
            </View>
          </TouchableOpacity>

          {/* Agent & Fleet Console */}
          <TouchableOpacity
            style={[styles.consoleCard, { borderTopColor: '#2563EB' }]}
            onPress={() => setActiveTab('Staff')}
            activeOpacity={0.8}
          >
            <View style={styles.consoleHeader}>
              <View style={[styles.consoleIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Bike size={16} color="#2563EB" />
              </View>
              <Text style={styles.consoleTitle}>Agent Hub</Text>
            </View>
            <Text style={styles.consoleCount}>{liveFleetCount} On Duty</Text>
            <Text style={styles.consoleSub}>Pickers, Riders & Fleet Dispatch</Text>
            <View style={styles.consoleAction}>
              <Text style={[styles.consoleActionText, { color: '#2563EB' }]}>View Fleet</Text>
              <ChevronRight size={12} color="#2563EB" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Item 4: Area-wise Vendors & Customers Telemetry Card */}
      <View style={styles.areaSectionCard}>
        <View style={styles.areaHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.areaIconBox}>
              <MapPin size={16} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.areaCardTitle}>Area Breakdown: Vendors & Customers</Text>
              <Text style={styles.areaCardSubtitle}>
                Operational territory density across dark store sectors
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowAreaPicker(true)} style={styles.areaPickerPill}>
            <Text style={styles.areaPickerPillText}>
              {currentArea ? currentArea.name : 'All Areas'}
            </Text>
            <ChevronRight size={12} color={COLORS.purple} />
          </TouchableOpacity>
        </View>

        <View style={styles.areaTable}>
          {areaBreakdownData.length === 0 ? (
            <View style={styles.emptyAreaBox}>
              <Store size={32} color="#CBD5E1" />
              <Text style={styles.emptyAreaText}>No active stores or vendors in database</Text>
              <Text style={styles.emptyAreaSubtext}>
                Dark stores created under Stores and merchants added under Vendors will display here with live customer density.
              </Text>
            </View>
          ) : (
            areaBreakdownData.map((item, idx) => (
              <View key={item.areaId || idx} style={styles.areaTableRow}>
                <View style={styles.areaNameCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.areaNameText}>{item.areaName}</Text>
                    {item.hasRealStore ? (
                      <View style={styles.storeBadgePill}>
                        <Text style={styles.storeBadgeText}>Dark Store</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.areaCityText}>
                    {item.cityName} {item.pincode ? `• PIN ${item.pincode}` : ''}
                  </Text>
                </View>

                <View style={styles.areaMetricsGrid}>
                  <View style={styles.areaMetricCol}>
                    <Text style={styles.areaMetricLabel}>Customers</Text>
                    <Text style={[styles.areaMetricVal, { color: COLORS.navy }]}>
                      {item.totalCustomers}
                    </Text>
                  </View>

                  <View style={styles.areaMetricCol}>
                    <Text style={styles.areaMetricLabel}>Active (₹2k+)</Text>
                    <Text style={[styles.areaMetricVal, { color: '#16A34A' }]}>
                      {item.activeCustomers}
                    </Text>
                  </View>

                  <View style={styles.areaMetricCol}>
                    <Text style={styles.areaMetricLabel}>Local Vendors</Text>
                    <Text style={[styles.areaMetricVal, { color: '#D97706' }]}>
                      {item.totalVendors}
                    </Text>
                  </View>

                  <View style={styles.areaMetricCol}>
                    <Text style={styles.areaMetricLabel}>Area GMV</Text>
                    <Text style={[styles.areaMetricVal, { color: COLORS.purple }]}>
                      ₹{item.gmv.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* 6. System Status Card (Live WebSocket & DB Status) */}
      <SystemStatusCard
        statusText={syncStatus || 'Live WebSocket & DB Active'}
        clusterLabel="Cluster0"
        isOnline={true}
        onViewDetails={() => setActiveTab('Approvals')}
      />

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
                <MapPin size={20} color="#762DEB" />
                <View>
                  <Text style={styles.modalTitle}>Filter Dashboard by City</Text>
                  <Text style={styles.modalSubtitle}>Scope telemetry and KPIs by city</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <X size={20} color="#636375" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.searchInnerRow}>
                <Search size={16} color="#636375" />
                <TextInput
                  style={styles.searchInnerInput}
                  placeholder="Search city by name or code..."
                  placeholderTextColor="#636375"
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
              </View>

              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.modalListItem,
                    selectedCityId === 'ALL' && styles.modalListItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCityId('ALL');
                    setSelectedAreaId('ALL');
                    setShowCityPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalListItemText,
                      selectedCityId === 'ALL' && styles.modalListItemTextActive,
                    ]}
                  >
                    All Operational Cities (National)
                  </Text>
                  {selectedCityId === 'ALL' && <Check size={16} color="#762DEB" />}
                </TouchableOpacity>

                {activeCities
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                      (c.code && c.code.toLowerCase().includes(citySearch.toLowerCase()))
                  )
                  .map((c) => {
                    const cId = c.id || (c as any)._id;
                    const isSelected = selectedCityId === cId;
                    return (
                      <TouchableOpacity
                        key={cId}
                        style={[
                          styles.modalListItem,
                          isSelected && styles.modalListItemActive,
                        ]}
                        onPress={() => {
                          setSelectedCityId(cId);
                          setSelectedAreaId('ALL');
                          setShowCityPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.modalListItemText,
                            isSelected && styles.modalListItemTextActive,
                          ]}
                        >
                          {c.name} ({c.code || 'ZONE'})
                        </Text>
                        {isSelected && <Check size={16} color="#762DEB" />}
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
                <MapPin size={20} color="#268BFA" />
                <View>
                  <Text style={styles.modalTitle}>Filter Dashboard by Area</Text>
                  <Text style={styles.modalSubtitle}>
                    {currentCity ? `Areas in ${currentCity.name}` : 'All Operational Areas'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAreaPicker(false)}>
                <X size={20} color="#636375" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.searchInnerRow}>
                <Search size={16} color="#636375" />
                <TextInput
                  style={styles.searchInnerInput}
                  placeholder="Search area by name..."
                  placeholderTextColor="#636375"
                  value={areaSearch}
                  onChangeText={setAreaSearch}
                />
              </View>

              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.modalListItem,
                    selectedAreaId === 'ALL' && styles.modalListItemActive,
                  ]}
                  onPress={() => {
                    setSelectedAreaId('ALL');
                    setShowAreaPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalListItemText,
                      selectedAreaId === 'ALL' && styles.modalListItemTextActive,
                    ]}
                  >
                    All Areas in {currentCity ? currentCity.name : 'Selection'}
                  </Text>
                  {selectedAreaId === 'ALL' && <Check size={16} color="#268BFA" />}
                </TouchableOpacity>

                {availableAreas
                  .filter((a) => a.name.toLowerCase().includes(areaSearch.toLowerCase()))
                  .map((a) => {
                    const aId = a.id || (a as any)._id;
                    const isSelected = selectedAreaId === aId;
                    return (
                      <TouchableOpacity
                        key={aId}
                        style={[
                          styles.modalListItem,
                          isSelected && styles.modalListItemActive,
                        ]}
                        onPress={() => {
                          setSelectedAreaId(aId);
                          setShowAreaPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.modalListItemText,
                            isSelected && styles.modalListItemTextActive,
                          ]}
                        >
                          {a.name}
                        </Text>
                        {isSelected && <Check size={16} color="#268BFA" />}
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
    backgroundColor: '#F8F4FF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalPanel: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: '#111044',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#565477',
    fontSize: 11.5,
  },
  modalBody: {
    gap: 12,
  },
  searchInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E7D9FF',
    gap: 8,
  },
  searchInnerInput: {
    flex: 1,
    fontSize: 13,
    color: '#111044',
  },
  modalList: {
    maxHeight: 280,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalListItemActive: {
    backgroundColor: '#F3E8FF',
  },
  modalListItemText: {
    fontSize: 13.5,
    color: '#111044',
    fontWeight: '500',
  },
  modalListItemTextActive: {
    color: '#762DEB',
    fontWeight: '700',
  },
  consoleSection: {
    marginTop: 14,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  consoleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  consoleCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 3,
    padding: 12,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
      default: { elevation: 1 },
    }),
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  consoleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consoleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  consoleCount: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.navy,
  },
  consoleSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  consoleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 6,
  },
  consoleActionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  areaSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
      default: { elevation: 2 },
    }),
  },
  areaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  areaIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  areaCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  areaCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  areaPickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
  },
  areaPickerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  areaTable: {
    gap: 8,
  },
  emptyAreaBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyAreaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  emptyAreaSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 16,
  },
  storeBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
  },
  storeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  areaTableRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  areaNameCol: {
    marginBottom: 4,
  },
  areaNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },
  areaCityText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  areaMetricsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  areaMetricCol: {
    minWidth: 60,
  },
  areaMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  areaMetricVal: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 1,
  },
});

