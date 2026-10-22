import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalTransaction } from '../types/localShop.types';
import { LocalShopApi } from '../api/localShopApi';

interface MyOrdersScreenProps {
  onGoBack: () => void;
  onShopAgain?: (vendorId: string) => void;
}

export const MyOrdersScreen: React.FC<MyOrdersScreenProps> = ({
  onGoBack,
  onShopAgain,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'All' | 'Ongoing' | 'Completed'>('All');
  const [orders, setOrders] = useState<LocalTransaction[]>([]);

  useEffect(() => {
    let isMounted = true;
    LocalShopApi.getLocalOrders().then((liveOrders) => {
      if (isMounted && liveOrders) {
        setOrders(liveOrders);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Modals
  const [receiptOrder, setReceiptOrder] = useState<LocalTransaction | null>(null);
  const [rateOrder, setRateOrder] = useState<LocalTransaction | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Ongoing') return o.status === 'PENDING';
    if (activeTab === 'Completed') return o.status === 'SUCCESS' || o.status === 'VERIFIED' || o.status === 'COMPLETED';
    return true;
  });

  const handleOpenRate = (order: LocalTransaction) => {
    setRateOrder(order);
    setRatingStars(5);
    setReviewComment('');
  };

  const handleSubmitReview = () => {
    if (!rateOrder) return;
    Alert.alert(
      'Review Submitted!',
      `Thank you for rating ${rateOrder.vendorName} ${ratingStars} stars! Your review helps the community.`,
      [{ text: 'OK', onPress: () => setRateOrder(null) }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Local Orders</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs Row (All, Ongoing, Completed) */}
      <View style={styles.tabsRow}>
        {(['All', 'Ongoing', 'Completed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No orders in this tab</Text>
            <Text style={styles.emptySub}>
              Scan a partner shop QR to make your first local counter purchase!
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              {/* Card Top */}
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderShopName}>{order.vendorName}</Text>
                  <Text style={styles.orderIdText}>
                    {order.orderNumber || order.orderId} • {order.date || order.createdAt}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        order.status === 'SUCCESS' ? '#ECFDF5' : '#FEF3C7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          order.status === 'SUCCESS' ? '#059669' : '#D97706',
                      },
                    ]}
                  >
                    {order.status === 'SUCCESS' ? 'COMPLETED' : 'IN PROGRESS'}
                  </Text>
                </View>
              </View>

              {/* Financials Row */}
              <View style={styles.financialsRow}>
                <View style={styles.finCol}>
                  <Text style={styles.finLabel}>Bill Amount</Text>
                  <Text style={styles.finValue}>₹{order.amount}</Text>
                </View>

                {Boolean(order.coinsUsed && order.coinsUsed > 0) && (
                  <View style={styles.finCol}>
                    <Text style={styles.finLabel}>Coins Used</Text>
                    <Text style={[styles.finValue, { color: '#E11D48', fontWeight: '800' }]}>
                      -₹{order.coinsUsed}
                    </Text>
                  </View>
                )}

                <View style={styles.finCol}>
                  <Text style={styles.finLabel}>Payment</Text>
                  <Text style={styles.finValueSecondary}>{order.paymentMethod}</Text>
                </View>

                {Boolean(order.coinsEarned && order.coinsEarned > 0) && (
                  <View style={styles.coinsEarnedCol}>
                    <Ionicons name="sparkles" size={14} color="#B45309" />
                    <Text style={styles.coinsEarnedText}>+{order.coinsEarned} Coins</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  onPress={() => setReceiptOrder(order)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text-outline" size={14} color="#334155" style={{ marginRight: 4 }} />
                  <Text style={styles.actionBtnOutlineText}>View Receipt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnPink}
                  onPress={() => handleOpenRate(order)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="star" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.actionBtnPinkText}>Rate Shop</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Receipt Modal */}
      <Modal visible={!!receiptOrder} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.receiptSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>Purchase Receipt</Text>
              <TouchableOpacity onPress={() => setReceiptOrder(null)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {receiptOrder && (
              <>
                <View style={styles.receiptInfoBox}>
                  <Text style={styles.receiptStore}>{receiptOrder.vendorName}</Text>
                  <Text style={styles.receiptMeta}>
                    Order: {receiptOrder.orderNumber || receiptOrder.orderId}
                  </Text>
                  <Text style={styles.receiptMeta}>
                    Date: {receiptOrder.date || receiptOrder.createdAt}
                  </Text>
                  <Text style={styles.receiptMeta}>Paid via: {receiptOrder.paymentMethod}</Text>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptLine}>
                  <Text style={styles.receiptLineLabel}>Bill Subtotal</Text>
                  <Text style={styles.receiptLineValue}>₹{receiptOrder.amount}</Text>
                </View>

                {Boolean(receiptOrder.coinsUsed && receiptOrder.coinsUsed > 0) && (
                  <View style={styles.receiptLine}>
                    <Text style={styles.receiptLineLabel}>Shopping Coins Redeemed</Text>
                    <Text style={[styles.receiptLineValue, { color: '#E11D48', fontWeight: '800' }]}>
                      -₹{receiptOrder.coinsUsed} Coins
                    </Text>
                  </View>
                )}

                {Boolean(receiptOrder.coinsEarned && receiptOrder.coinsEarned > 0) && (
                  <View style={styles.receiptLine}>
                    <Text style={styles.receiptLineLabel}>WOMUP Shopping Coins Earned</Text>
                    <Text style={[styles.receiptLineValue, { color: '#059669', fontWeight: '800' }]}>
                      +{receiptOrder.coinsEarned} Coins
                    </Text>
                  </View>
                )}

                <View style={styles.receiptDivider} />

                <View style={styles.receiptTotalLine}>
                  <Text style={styles.receiptTotalLabel}>Total Cash / UPI Paid</Text>
                  <Text style={styles.receiptTotalValue}>
                    ₹{receiptOrder.cashPaid !== undefined ? receiptOrder.cashPaid : Math.max(0, receiptOrder.amount - (receiptOrder.coinsUsed || 0))}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.downloadReceiptBtn}
                  onPress={() => {
                    Alert.alert('Receipt Downloaded', 'Invoice saved to your downloads folder.');
                    setReceiptOrder(null);
                  }}
                >
                  <Ionicons name="download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.downloadReceiptText}>Download PDF Invoice</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Rate Shop Modal */}
      <Modal visible={!!rateOrder} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.rateCard}>
            <Text style={styles.rateTitle}>Rate {rateOrder?.vendorName}</Text>
            <Text style={styles.rateSub}>How was your in-store experience?</Text>

            {/* 5 Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRatingStars(star)}
                  style={{ padding: 6 }}
                >
                  <Ionicons
                    name={star <= ratingStars ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment Box */}
            <TextInput
              style={styles.reviewInput}
              placeholder="Write a quick review (e.g. Fresh items, quick billing)..."
              placeholderTextColor="#94A3B8"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
            />

            <View style={styles.rateActionsRow}>
              <TouchableOpacity
                style={styles.cancelRateBtn}
                onPress={() => setRateOrder(null)}
              >
                <Text style={styles.cancelRateText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitRateBtn}
                onPress={handleSubmitReview}
              >
                <Text style={styles.submitRateText}>Submit Rating</Text>
              </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFF1F2',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#E11D48',
    fontWeight: '800',
  },
  scroll: {
    padding: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 40,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderShopName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderIdText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  financialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  finCol: {
    flex: 1,
  },
  finLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  finValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  finValueSecondary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  coinsEarnedCol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coinsEarnedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    marginLeft: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  actionBtnPink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E11D48',
  },
  actionBtnPinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  receiptSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  receiptInfoBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  receiptStore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  receiptMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptLineLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  receiptLineValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  receiptTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  receiptTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E11D48',
  },
  downloadReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  downloadReceiptText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 'auto',
    marginTop: 'auto',
    alignItems: 'center',
  },
  rateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  rateSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  reviewInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  rateActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  cancelRateBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelRateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  submitRateBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E11D48',
    alignItems: 'center',
  },
  submitRateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
