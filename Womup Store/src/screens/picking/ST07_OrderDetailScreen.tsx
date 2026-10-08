import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { PickItemRow } from '../../components/PickItemRow';
import { COLORS } from '../../theme/colors';

export const ST07_OrderDetailScreen: React.FC = () => {
  const { activeOrder, activePickList, setSubScreen, acceptOrderAndStartPick } = useStore();

  if (!activeOrder) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No order selected</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSubScreen(null)}>
          <Text style={styles.backText}>Return to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = activePickList?.items || activeOrder.items || [];
  const isDelivered =
    activeOrder.status === 'DELIVERED' ||
    activeOrder.status === 'COMPLETED';
  const isPacking = activeOrder.status === 'PACKING';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Navigation Row */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.navBackBtn}
            onPress={() => setSubScreen(null)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color="#FFF" />
            <Text style={styles.navBackText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.navTitle} numberOfLines={1}>
            Order Details
          </Text>

          <View style={{ width: 60 }} />
        </View>

        {/* Order Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.orderNumber}>{activeOrder.orderNumber}</Text>
              <Text style={styles.deliverySlot}>
                Slot: {activeOrder.deliverySlot || 'Instant 9-min'}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                isDelivered ? styles.statusBadgeDelivered : styles.statusBadgeNormal,
              ]}
            >
              {isDelivered && (
                <Ionicons
                  name="checkmark-circle"
                  size={13}
                  color="#10B981"
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={[
                  styles.statusText,
                  isDelivered && { color: '#10B981', fontWeight: '800' },
                ]}
              >
                {activeOrder.status}
              </Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryVal}>{items.length}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Your Payout</Text>
              <Text style={[styles.summaryVal, { color: '#10B981' }]}>
                ₹{(activeOrder as any).storeEarnings ?? Math.round((activeOrder.totalAmount || 60) * 0.9)}
              </Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Priority</Text>
              <Text
                style={[
                  styles.summaryVal,
                  {
                    color:
                      activeOrder.priority === 'HIGH'
                        ? COLORS.danger
                        : isDelivered
                        ? '#10B981'
                        : COLORS.primary,
                  },
                ]}
              >
                {isDelivered ? 'FULFILLED' : activeOrder.priority || 'NORMAL'}
              </Text>
            </View>
          </View>
        </View>

        {/* Banner Notice */}
        {isDelivered ? (
          <View style={styles.deliveredBanner}>
            <Ionicons name="checkmark-done-circle" size={22} color="#10B981" />
            <View style={styles.bannerTextCol}>
              <Text style={styles.deliveredBannerTitle}>Order Successfully Delivered</Text>
              <Text style={styles.deliveredBannerSubtitle}>
                Completed and delivered to customer safely.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.instructionBanner}>
            <Ionicons name="information-circle" size={18} color={COLORS.accentCyan} />
            <Text style={styles.instructionText}>
              Follow aisle and rack shelf indicators for the most optimal pick route.
            </Text>
          </View>
        )}

        {/* Customer & Delivery Information Card */}
        {(Boolean(activeOrder.customerName) || Boolean((activeOrder as any).deliveryAddress)) && (
          <View style={styles.detailSectionCard}>
            <View style={styles.detailSectionHeader}>
              <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.detailSectionTitle}>Customer & Destination</Text>
            </View>

            {Boolean(activeOrder.customerName) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>
                  {activeOrder.customerName}
                  {(activeOrder as any).customerPhone ? ` · ${(activeOrder as any).customerPhone}` : ''}
                </Text>
              </View>
            )}

            {Boolean((activeOrder as any).deliveryAddress) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue} numberOfLines={2}>
                  {typeof (activeOrder as any).deliveryAddress === 'string'
                    ? (activeOrder as any).deliveryAddress
                    : (activeOrder as any).deliveryAddress?.addressLine || 'Ahmedabad'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Assigned Rider Card */}
        {Boolean(activeOrder.assignedRider) && (
          <View style={styles.detailSectionCard}>
            <View style={styles.detailSectionHeader}>
              <Ionicons name="bicycle" size={18} color={COLORS.accentCyan} />
              <Text style={styles.detailSectionTitle}>Delivery Partner</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rider Name:</Text>
              <Text style={styles.detailValue}>{activeOrder.assignedRider?.name}</Text>
            </View>

            {Boolean(activeOrder.assignedRider?.vehicleNumber) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle:</Text>
                <Text style={styles.detailValue}>{activeOrder.assignedRider?.vehicleNumber}</Text>
              </View>
            )}

            {Boolean(activeOrder.assignedRider?.phone) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={[styles.detailValue, { color: COLORS.accentCyan, fontWeight: '700' }]}>
                  {activeOrder.assignedRider?.phone}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Item List with Shelf Slots */}
        <View style={styles.itemsHeaderRow}>
          <Text style={styles.sectionTitle}>
            {isDelivered ? 'FULFILLED ITEMS' : 'PICK LIST ITEMS'} ({items.length})
          </Text>
        </View>

        {items.map((item: any, idx: number) => (
          <PickItemRow
            key={item.productId?.toString() || idx}
            item={{
              productId: item.productId?.toString() || idx.toString(),
              name: item.name,
              quantity: item.quantity,
              unit: item.unit || item.quantityLabel || 'pack',
              shelfLocation: item.shelfLocation || 'Not set',
              barcode: item.barcode || '8901030383748',
              status: isDelivered ? 'PICKED' : (item.status || 'PENDING'),
              notes: item.notes,
            }}
          />
        ))}
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        {isDelivered ? (
          <TouchableOpacity
            style={[styles.startPickBtn, styles.backToOrdersBtn]}
            onPress={() => setSubScreen(null)}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.startPickText}>BACK TO ORDERS</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.startPickBtn}
            onPress={() => {
              if (isPacking) {
                setSubScreen('PickingCore');
              } else {
                acceptOrderAndStartPick(activeOrder.orderId);
              }
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="barcode" size={20} color="#FFF" />
            <Text style={styles.startPickText}>
              {isPacking ? 'RESUME SCANNING' : 'START PICKING'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navBackText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  navTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  deliverySlot: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeNormal: {
    backgroundColor: 'rgba(236, 74, 157, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(236, 74, 157, 0.3)',
  },
  statusBadgeDelivered: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 3,
  },
  summaryVal: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 12,
  },
  bannerTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  deliveredBannerTitle: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
  },
  deliveredBannerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    marginBottom: 12,
  },
  instructionText: {
    color: COLORS.accentCyan,
    fontSize: 12,
    flex: 1,
  },
  detailSectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailSectionTitle: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: 11.5,
  },
  detailValue: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  itemsHeaderRow: {
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  backToOrdersBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  startPickText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
