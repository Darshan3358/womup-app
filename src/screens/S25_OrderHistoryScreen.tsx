import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { OrderCard } from '../components/order/OrderCard';
import { useApp } from '../context/AppContext';
import { OrderService } from '../services/orderService';

type TabType = 'ALL' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export const S25_OrderHistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, orders, goBack } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('ALL');

  const tabs: { key: TabType; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'ONGOING', label: 'Ongoing' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  const filteredOrders = OrderService.getOrdersByStatus(activeTab);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="Order History"
        onBack={goBack}
      />

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
            >
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyView}>
            <Text style={styles.emptyText}>No orders in this section</Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onReorder={() => setActiveScreen('C19_Cart')}
            />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
    minHeight: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
  },
  activeTabButton: {
    backgroundColor: COLORS.hotPink,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabLabel: {
    color: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  emptyView: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
