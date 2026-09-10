import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Clock, MapPin, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { Order, OrderStage } from '../types/admin';

export const OrdersScreen: React.FC = () => {
  const { orders, setSelectedOrder, setSubView, setActiveModal } = useAdminState();

  const [topTab, setTopTab] = useState<'Live Orders' | 'Order History'>('Live Orders');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredOrders = orders.filter((o) => {
    if (topTab === 'Live Orders' && o.status === 'Delivered') return false;
    if (topTab === 'Order History' && o.status !== 'Delivered' && o.status !== 'Cancelled') return false;
    if (statusFilter !== 'All' && o.status !== statusFilter) return false;
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
      {/* Top Segmented Tabs */}
      <View style={styles.topSection}>
        <View style={styles.mainTabRow}>
          <TouchableOpacity
            style={[styles.mainTab, topTab === 'Live Orders' && styles.activeMainTab]}
            onPress={() => setTopTab('Live Orders')}
          >
            <Text
              style={[styles.mainTabText, topTab === 'Live Orders' && styles.activeMainTabText]}
            >
              Live Orders ({orders.filter((o) => o.status !== 'Delivered').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTab, topTab === 'Order History' && styles.activeMainTab]}
            onPress={() => setTopTab('Order History')}
          >
            <Text
              style={[
                styles.mainTabText,
                topTab === 'Order History' && styles.activeMainTabText,
              ]}
            >
              Order History
            </Text>
          </TouchableOpacity>
        </View>

        {/* 11-Stage Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['All', 'Pending', 'Picking', 'Packing', 'Ready for Dispatch', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => {
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
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No orders found in this category</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const badge = getStatusBadgeStyle(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => handleOpenInspector(order)}
                activeOpacity={0.8}
              >
                {/* Header Row */}
                <View style={styles.orderHeader}>
                  <View style={styles.idRow}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <View style={styles.locationTag}>
                      <MapPin size={10} color={COLORS.textMuted} style={{ marginRight: 2 }} />
                      <Text style={styles.locationText}>{order.zoneName}</Text>
                    </View>
                  </View>

                  <View style={styles.timeTag}>
                    <Clock size={11} color={COLORS.secondaryText} style={{ marginRight: 3 }} />
                    <Text style={styles.timeText}>{order.timeAgo}</Text>
                  </View>
                </View>

                {/* Status & Amount Row */}
                <View style={styles.orderBody}>
                  <View style={[styles.statusPillBadge, { backgroundColor: badge.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                      {order.status}
                    </Text>
                  </View>

                  <Text style={styles.orderAmount}>₹{order.total}</Text>
                </View>

                {/* Items & Staff Meta */}
                <View style={styles.orderFooter}>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <Text style={styles.itemSummary}>
                    {order.items.length} items ({order.items.map((i) => i.name).join(', ')})
                  </Text>
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
                    <ChevronRight size={14} color={COLORS.hotPink} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
  filterScroll: {
    flexDirection: 'row',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
  },
  activeStatusPill: {
    backgroundColor: COLORS.hotPink,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeStatusPillText: {
    color: COLORS.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  emptyState: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
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
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlueLavender,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  locationText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.darkBlue,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: COLORS.secondaryText,
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  statusPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 8,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemSummary: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlueLavender,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.purple,
    marginLeft: 4,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspectText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.hotPink,
    marginRight: 2,
  },
});
