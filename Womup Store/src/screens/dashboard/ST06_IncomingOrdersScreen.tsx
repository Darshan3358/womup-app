import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { OrderCard } from '../../components/OrderCard';
import { COLORS } from '../../theme/colors';

type OrderTab = 'NEW' | 'PICKING' | 'PACKING' | 'DISPATCHED';

export const ST06_IncomingOrdersScreen: React.FC = () => {
  const {
    incomingOrders,
    pickingOrders,
    readyOrders,
    completedOrders,
    acceptOrderAndStartPick,
    selectOrderForDetail,
    refreshIncoming,
    refreshPicking,
    refreshReady,
    refreshCompletedOrders,
    isLoading,
    store,
  } = useStore();

  const [activeTab, setActiveTab] = useState<OrderTab>('NEW');
  const [searchQuery, setSearchQuery] = useState('');

  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Prahlad Nagar');
  const cityName = store?.cityName || store?.city || 'Ahmedabad';

  const handleRefresh = async () => {
    await Promise.all([
      refreshIncoming(),
      refreshPicking(),
      refreshReady(),
      refreshCompletedOrders(),
    ]);
  };

  const getTabOrders = () => {
    let list: any[] = [];
    if (activeTab === 'NEW') list = incomingOrders;
    else if (activeTab === 'PICKING') list = pickingOrders;
    else if (activeTab === 'PACKING') list = readyOrders;
    else if (activeTab === 'DISPATCHED') list = completedOrders;

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((order) => {
      const matchNum = order.orderNumber?.toLowerCase().includes(q);
      const matchCust = order.customerName?.toLowerCase().includes(q);
      const matchItem = order.items?.some((i: any) => i.name?.toLowerCase().includes(q));
      return matchNum || matchCust || matchItem;
    });
  };

  const currentOrders = getTabOrders();

  const getCtaProps = (item: any) => {
    if (activeTab === 'NEW') {
      return {
        text: 'START PICKING',
        color: '#FF3B98',
        action: () => acceptOrderAndStartPick(item.orderId || item._id),
      };
    }
    if (activeTab === 'PICKING') {
      return {
        text: 'CONTINUE PICK',
        color: '#F59E0B',
        action: () => selectOrderForDetail(item.orderId || item._id),
      };
    }
    if (activeTab === 'PACKING') {
      return {
        text: 'VIEW READY',
        color: '#13B978',
        action: () => selectOrderForDetail(item.orderId || item._id),
      };
    }
    return {
      text: 'VIEW SUMMARY',
      color: '#071B52',
      action: () => selectOrderForDetail(item.orderId || item._id),
    };
  };

  return (
    <View style={styles.container}>
      {/* Top Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order / Customer / Product"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Tabs Bar Matching Wireframe Screen 5 */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'NEW' && styles.tabButtonActive]}
          onPress={() => setActiveTab('NEW')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'NEW' && styles.tabTextActive]}>
            New
          </Text>
          {incomingOrders.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'NEW' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{incomingOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'PICKING' && styles.tabButtonActive]}
          onPress={() => setActiveTab('PICKING')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'PICKING' && styles.tabTextActive]}>
            Picking
          </Text>
          {pickingOrders.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'PICKING' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{pickingOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'PACKING' && styles.tabButtonActive]}
          onPress={() => setActiveTab('PACKING')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'PACKING' && styles.tabTextActive]}>
            Packing
          </Text>
          {readyOrders.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'PACKING' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{readyOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'DISPATCHED' && styles.tabButtonActive]}
          onPress={() => setActiveTab('DISPATCHED')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'DISPATCHED' && styles.tabTextActive]}>
            Dispatched
          </Text>
          {Boolean(completedOrders.length) && (
            <View style={[styles.tabBadge, activeTab === 'DISPATCHED' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{completedOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={currentOrders}
        keyExtractor={(item) => (item.orderId || item._id || item.orderNumber || Math.random()).toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#FF3B98"
          />
        }
        renderItem={({ item }) => {
          const cta = getCtaProps(item);
          return (
            <OrderCard
              order={item}
              ctaText={cta.text}
              ctaColor={cta.color}
              onPress={cta.action}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Orders in {activeTab}</Text>
            <Text style={styles.emptyDesc}>
              {searchQuery
                ? 'No orders matched your search query.'
                : `Currently no orders are pending in the ${activeTab.toLowerCase()} queue.`}
            </Text>
            <View style={styles.servingBadge}>
              <Ionicons name="location" size={13} color="#FF3B98" />
              <Text style={styles.servingText}>
                Hub: {areaName} · {cityName}
              </Text>
            </View>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#071B52',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
    overflow: 'visible',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: '#FF3B98',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
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
    borderColor: '#FF3B98',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#071B52',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 18,
  },
  servingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 59, 152, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 152, 0.2)',
  },
  servingText: {
    color: '#FF3B98',
    fontSize: 12,
    fontWeight: '700',
  },
});
