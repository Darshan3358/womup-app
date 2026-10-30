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
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Navigation,
  Warehouse,
  ChevronDown,
  Search,
  X,
  Check,
  Calendar,
  Filter,
  Barcode,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { Order, OrderStage } from '../types/admin';
import { OrderListSkeleton } from '../components/common/Skeleton';

export const OrdersScreen: React.FC = () => {
  const {
    orders,
    cities,
    zones,
    darkStores,
    setSelectedOrder,
    setSubView,
    setActiveModal,
    isLoading,
  } = useAdminState();

  const [topTab, setTopTab] = useState<'Live Orders' | 'Order History'>('Live Orders');
  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'This Week'>('All');
  const [orderSearch, setOrderSearch] = useState('');

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

  // Helper to resolve an order's City, Area, and Store
  const resolveOrderHierarchy = (order: Order) => {
    // Area
    let areaName = order.areaName || order.zoneName || 'Area';
    let matchedZone = zones.find(
      (z) =>
        (order.areaId && (z.id === order.areaId || z._id === order.areaId)) ||
        (order.zoneName && z.name.toLowerCase() === order.zoneName.toLowerCase()) ||
        (order.address && order.address.toLowerCase().includes(z.name.toLowerCase()))
    );

    if (matchedZone) {
      areaName = matchedZone.name;
    }

    // City
    let cityName = order.cityName || matchedZone?.cityName || matchedZone?.city;
    if (!cityName && matchedZone?.cityId) {
      const c = cities.find((ct) => ct.id === matchedZone.cityId || ct._id === matchedZone.cityId);
      if (c) cityName = c.name;
    }
    if (!cityName) cityName = 'Ahmedabad';

    // Store
    let storeName = order.darkStore || matchedZone?.assignedStore?.name || matchedZone?.darkStore;
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

  const matchesStatusFilter = (orderStatus: OrderStage | string, rawStatus: string | undefined, filter: string): boolean => {
    if (filter === 'All') return true;
    const s = String(orderStatus || '').toLowerCase();
    const raw = String(rawStatus || '').toLowerCase();

    switch (filter) {
      case 'Pending':
        return s === 'order placed' || s === 'pending' || s === 'payment confirmed' || s === 'order accepted' || raw === 'placed' || raw === 'pending';
      case 'Picking':
        return s === 'picking' || s === 'packing' || s === 'picker assigned' || s === 'picking completed' || raw === 'packing' || raw === 'picking';
      case 'Packed':
        return s === 'packed' || raw === 'packed';
      case 'Ready for Dispatch':
        return s === 'ready for dispatch' || s === 'rider assigned' || raw === 'assigned' || raw === 'going_to_store' || raw === 'arrived_at_store' || raw === 'ready_for_dispatch' || raw === 'ready_for_pickup';
      case 'Out for Delivery':
        return s === 'out for delivery' || s === 'arrived_at_customer' || raw === 'out_for_delivery' || raw === 'arrived_at_customer';
      case 'Delivered':
        return s === 'delivered' || raw === 'delivered' || raw === 'completed';
      case 'Cancelled':
        return s === 'cancelled' || raw === 'cancelled' || raw === 'payment_failed';
      default:
        return s === filter.toLowerCase() || raw === filter.toLowerCase();
    }
  };

  const filteredOrders = orders.filter((o) => {
    // 0. Search Filter (by Order #, Barcode, Bag Barcode, Customer Name, Phone, Item name)
    const cleanSearch = orderSearch.trim().toLowerCase();
    if (cleanSearch) {
      const matchNum = (o.id || '').toLowerCase().includes(cleanSearch) || (o.orderNumber || '').toLowerCase().includes(cleanSearch);
      const matchCust = (o.customerName || '').toLowerCase().includes(cleanSearch) || (o.customerPhone || '').toLowerCase().includes(cleanSearch);
      const matchBarcode = (o.bagBarcode || '').toLowerCase().includes(cleanSearch) || (o.barcode || '').toLowerCase().includes(cleanSearch);
      const matchItems = (o.items || []).some(it => (it.name || '').toLowerCase().includes(cleanSearch) || (it.barcode || '').toLowerCase().includes(cleanSearch));
      if (!matchNum && !matchCust && !matchBarcode && !matchItems) return false;
    }

    // 1. Live vs History (unless an explicit order search is happening, in which case we show it)
    const isCompleted = o.status === 'Delivered' || o.status === 'Cancelled' || String(o.rawStatus).toUpperCase() === 'DELIVERED' || String(o.rawStatus).toUpperCase() === 'CANCELLED';
    if (!cleanSearch) {
      if (topTab === 'Live Orders' && isCompleted) return false;
      if (topTab === 'Order History' && !isCompleted) return false;
    }

    // 2. Status Filter
    if (!matchesStatusFilter(o.status, o.rawStatus, statusFilter)) return false;

    const { cityName, areaName } = resolveOrderHierarchy(o);

    // 3. City Filter
    if (selectedCityId !== 'ALL' && currentCity) {
      const matchCity =
        (o.cityId && String(o.cityId) === String(currentCity.id || currentCity._id)) ||
        cityName.toLowerCase() === currentCity.name.toLowerCase();
      if (!matchCity) return false;
    }

    // 4. Area Filter
    if (selectedAreaId !== 'ALL' && currentArea) {
      const matchArea =
        (o.areaId && String(o.areaId) === String(currentArea.id || currentArea._id)) ||
        areaName.toLowerCase() === currentArea.name.toLowerCase() ||
        (o.zoneName && o.zoneName.toLowerCase() === currentArea.name.toLowerCase());
      if (!matchArea) return false;
    }

    // 5. Date Filter
    if (dateFilter === 'Today') {
      const orderDate = new Date(o.timestamp);
      const today = new Date();
      if (orderDate.toDateString() !== today.toDateString()) return false;
    } else if (dateFilter === 'This Week') {
      const orderTime = new Date(o.timestamp).getTime();
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (orderTime < oneWeekAgo) return false;
    }

    return true;
  });

  const handleOpenInspector = (order: Order) => {
    setSelectedOrder(order);
    setSubView('OrderInspector');
  };

  const getStatusBadgeStyle = (status: OrderStage) => {
    switch (status) {
      case 'Picking':
      case 'Packed':
        return { bg: '#FFF4E5', text: '#D97706', dot: '#F59E0B' };
      case 'Ready for Dispatch':
      case 'Out for Delivery':
        return { bg: '#E0F2FE', text: '#0284C7', dot: '#0EA5E9' };
      case 'Delivered':
        return { bg: '#E8F8F0', text: COLORS.success, dot: COLORS.success };
      case 'Cancelled':
        return { bg: '#FCECEE', text: COLORS.error, dot: COLORS.error };
      default:
        return { bg: COLORS.cardBackground, text: COLORS.textMuted, dot: COLORS.textMuted };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Section: Tabs & Cascading Hierarchy Filters */}
      <View style={styles.topSection}>
        {/* Main Tab Switcher */}
        <View style={styles.mainTabRow}>
          {(() => {
            const liveCount = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
            const historyCount = orders.filter((o) => o.status === 'Delivered' || o.status === 'Cancelled').length;
            const isLive = topTab === 'Live Orders';
            const isHistory = topTab === 'Order History';
            return (
              <>
                <TouchableOpacity
                  style={[styles.mainTab, isLive && styles.activeMainTab]}
                  onPress={() => {
                    setTopTab('Live Orders');
                    setStatusFilter('All');
                  }}
                >
                  <Text style={[styles.mainTabText, isLive && styles.activeMainTabText]}>
                    Live Orders
                  </Text>
                  {liveCount > 0 && (
                    <View style={[styles.tabBadge, isLive && styles.tabBadgeActive]}>
                      <Text style={styles.tabBadgeText}>{liveCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mainTab, isHistory && styles.activeMainTab]}
                  onPress={() => {
                    setTopTab('Order History');
                    setStatusFilter('All');
                  }}
                >
                  <Text style={[styles.mainTabText, isHistory && styles.activeMainTabText]}>
                    Order History
                  </Text>
                  {historyCount > 0 && (
                    <View style={[styles.tabBadge, isHistory && styles.tabBadgeActive]}>
                      <Text style={styles.tabBadgeText}>{historyCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            );
          })()}
        </View>

        {/* Global Order Search Bar */}
        <View style={styles.orderSearchBar}>
          <Search size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.orderSearchInput}
            placeholder="Search by Order ID (e.g. WORM-792874-284), Barcode, Customer..."
            placeholderTextColor={COLORS.textMuted}
            value={orderSearch}
            onChangeText={setOrderSearch}
          />
          {Boolean(orderSearch) && (
            <TouchableOpacity onPress={() => setOrderSearch('')} style={{ padding: 4 }}>
              <X size={15} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Cascading Filter Bar: City + Area + Date */}
        <View style={styles.filtersBar}>
          {/* City Filter Button */}
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

          {/* Area Filter Button (Cascades) */}
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

          {/* Date Filter Button */}
          <TouchableOpacity
            style={[styles.filterDropdownBtn, dateFilter !== 'All' && styles.activeFilterDropdown]}
            onPress={() => {
              setDateFilter((prev) => (prev === 'All' ? 'Today' : prev === 'Today' ? 'This Week' : 'All'));
            }}
            activeOpacity={0.8}
          >
            <Calendar size={13} color={dateFilter !== 'All' ? COLORS.hotPink : COLORS.textMuted} />
            <Text style={[styles.filterDropdownText, dateFilter !== 'All' && styles.activeFilterText]} numberOfLines={1}>
              Date: {dateFilter}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Horizontal Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(topTab === 'Live Orders'
            ? ['All', 'Pending', 'Picking', 'Packed', 'Ready for Dispatch', 'Out for Delivery']
            : ['All', 'Delivered', 'Cancelled']
          ).map((st) => {
            const isSelected = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.statusPill, isSelected && styles.activeStatusPill]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.statusPillText, isSelected && styles.activeStatusPillText]}>
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {isLoading ? (
          <OrderListSkeleton count={4} />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Warehouse size={40} color={COLORS.border} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubTitle}>
              No orders match the selected filters ({currentCity ? currentCity.name : 'All Cities'}, {currentArea ? currentArea.name : 'All Areas'}, {statusFilter}).
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const badge = getStatusBadgeStyle(order.status);
            const hierarchy = resolveOrderHierarchy(order);

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => handleOpenInspector(order)}
                activeOpacity={0.85}
              >
                {/* Header Row: Order ID + Status + Time */}
                <View style={styles.orderHeader}>
                  <View style={styles.idRow}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <View style={[styles.statusPillBadge, { backgroundColor: badge.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timeTag}>
                    <Clock size={11} color={COLORS.secondaryText} style={{ marginRight: 3 }} />
                    <Text style={styles.timeText}>{order.timeAgo || 'Just now'}</Text>
                  </View>
                </View>

                {/* Bag Barcode & Hierarchy Row */}
                <View style={styles.orderMetaBar}>
                  <View style={styles.bagBarcodeTag}>
                    <Barcode size={13} color={COLORS.purple} />
                    <Text style={styles.bagBarcodeText}>
                      {order.bagBarcode || order.barcode || `BAG-${order.id.replace('#', '').slice(-6)}`}
                    </Text>
                  </View>
                  <View style={styles.breadcrumbCard}>
                    <Text style={styles.breadcrumbText} numberOfLines={1}>
                      📍 <Text style={styles.crumbBold}>{hierarchy.areaName}</Text> · 🏪 <Text style={styles.crumbStore}>{hierarchy.storeName}</Text>
                    </Text>
                  </View>
                </View>

                {Boolean(order.distanceToCustomer || order.distanceKm || order.distanceToStore) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginHorizontal: 12, marginTop: 6, alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D' }}>
                      🛵 {order.status === 'Ready for Dispatch' && order.distanceToStore
                        ? `Rider is ${order.distanceToStore} km from store`
                        : `Rider is ${order.distanceToCustomer || order.distanceKm} km from customer${order.eta ? ` · ETA ${order.eta}` : ''}`}
                    </Text>
                  </View>
                )}

                {/* Amount & Items Row */}
                <View style={styles.orderBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>{order.customerName}</Text>
                    <Text style={styles.itemSummary} numberOfLines={1}>
                      {order.items?.length || 0} items ({order.items?.map((i) => i.name).join(', ')})
                    </Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.orderAmount}>₹{order.total}</Text>
                    <Text style={styles.paymentMethodText}>
                      {order.paymentMethod || 'COD'}
                    </Text>
                  </View>
                </View>

                {/* Action Shortcuts */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setSelectedOrder(order);
                      setActiveModal('StaffReassignment');
                    }}
                  >
                    <RefreshCw size={12} color={COLORS.purple} />
                    <Text style={styles.actionBtnText}>Reassign</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#FCECEE' }]}
                    onPress={() => {
                      setSelectedOrder(order);
                      setActiveModal('OrderCancelRefund');
                    }}
                  >
                    <AlertCircle size={12} color={COLORS.error} />
                    <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Cancel</Text>
                  </TouchableOpacity>

                  <View style={styles.inspectBtn}>
                    <Text style={styles.inspectText}>Inspector</Text>
                    <ChevronRight size={14} color={COLORS.purple} />
                  </View>
                </View>
              </TouchableOpacity>
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
                  <Text style={styles.modalTitle}>Filter by City</Text>
                  <Text style={styles.modalSubtitle}>Scope orders to a specific city</Text>
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
                {/* All Cities Option */}
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
                  <Text style={styles.modalSubtitle}>Scope orders to a specific area</Text>
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
                {/* All Areas Option */}
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
                              {area.cityName || currentCity?.name} • {area.darkStore || 'Dark Store Hub'}
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
  mainTabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    position: 'relative',
  },
  activeMainTab: {
    backgroundColor: COLORS.purple,
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeMainTabText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: 8,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
    elevation: 4,
  },
  tabBadgeActive: {
    borderColor: COLORS.purple,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  filtersBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
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
    minWidth: 110,
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
  filterScroll: {
    flexDirection: 'row',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
  },
  activeStatusPill: {
    backgroundColor: COLORS.purple,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeStatusPillText: {
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
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: SPACING.md,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  breadcrumbCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 8,
  },
  breadcrumbText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  crumbBold: {
    fontWeight: '800',
    color: COLORS.navy,
  },
  crumbStore: {
    fontWeight: '700',
    color: COLORS.purple,
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemSummary: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.purple,
  },
  paymentMethodText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inspectText: {
    fontSize: 12,
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
  orderSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  orderSearchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    padding: 0,
  },
  orderMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  bagBarcodeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  bagBarcodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
    letterSpacing: 0.5,
  },
});
