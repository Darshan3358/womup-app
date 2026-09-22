import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';

export const NewDeliveryModal: React.FC = () => {
  const {
    showNewRequestModal,
    setShowNewRequestModal,
    activeDelivery,
    incomingJobOffer,
    acceptDelivery,
    setShowRejectModal,
  } = useRider();

  const offer = incomingJobOffer || activeDelivery;
  const [timeLeft, setTimeLeft] = useState<number>(45);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (showNewRequestModal && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && showNewRequestModal) {
      // Auto dismiss / reject on timeout
      setShowNewRequestModal(false);
    }
    return () => clearInterval(timer);
  }, [showNewRequestModal, timeLeft]);

  if (!offer) return null;

  return (
    <Modal
      visible={showNewRequestModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowNewRequestModal(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header with Countdown Pill */}
          <View style={styles.sheetHeader}>
            <View style={styles.titleRow}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications" size={22} color={COLORS.navy} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>New Delivery Request</Text>
                <Text style={styles.orderNumber}>{offer.orderNumber}</Text>
              </View>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Payout & Distance Card */}
            <View style={styles.highlightCard}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>EARNING</Text>
                <Text style={styles.payoutValue}>₹{offer.payoutAmount}</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>DISTANCE</Text>
                <Text style={styles.highlightValue}>{offer.distanceKm} km</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>EST. TIME</Text>
                <Text style={styles.highlightValue}>{offer.etaMinutes} min</Text>
              </View>
            </View>

            {/* Route Cards */}
            <View style={styles.routeContainer}>
              {/* Pickup Point */}
              <View style={styles.routeStep}>
                <View style={[styles.stepDot, styles.pickupDot]} />
                <View style={styles.stepInfo}>
                  <Text style={styles.stepLabel}>PICKUP FROM DARK STORE</Text>
                  <Text style={styles.stepName}>{offer.storeName}</Text>
                  <Text style={styles.stepAddress} numberOfLines={2}>
                    {offer.storeAddress}
                  </Text>
                </View>
              </View>

              <View style={styles.stepConnector} />

              {/* Delivery Point */}
              <View style={styles.routeStep}>
                <View style={[styles.stepDot, styles.dropDot]} />
                <View style={styles.stepInfo}>
                  <Text style={styles.stepLabel}>DELIVER TO CUSTOMER</Text>
                  <Text style={styles.stepName}>{offer.customerName}</Text>
                  <Text style={styles.stepAddress} numberOfLines={2}>
                    {offer.customerAddress}
                  </Text>
                </View>
              </View>
            </View>

            {/* Order Items Summary */}
            <View style={styles.orderSummaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Package Size: {offer.itemCount} items</Text>
                {offer.hasPrintJob && (
                  <View style={[styles.printBadge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <Ionicons name="print-outline" size={12} color="#4338CA" />
                    <Text style={styles.printBadgeText}>Contains Print Job</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Text style={styles.paymentMode}>Payment:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons
                    name={offer.paymentMethod === 'ONLINE_PAID' ? "checkmark-circle" : "cash-outline"}
                    size={14}
                    color={offer.paymentMethod === 'ONLINE_PAID' ? "#059669" : "#D97706"}
                  />
                  <Text style={[styles.paymentMode, { fontWeight: '700', color: offer.paymentMethod === 'ONLINE_PAID' ? "#059669" : "#D97706", marginTop: 0 }]}>
                    {offer.paymentMethod === 'ONLINE_PAID' ? 'Paid Online' : 'Cash on Delivery'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action CTAs */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => {
                setShowNewRequestModal(false);
                setShowRejectModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => acceptDelivery()}
              activeOpacity={0.85}
            >
              <Text style={styles.acceptBtnText}>ACCEPT DELIVERY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertEmoji: {
    fontSize: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.hotPink,
  },
  timerBadge: {
    backgroundColor: COLORS.busyOrangeLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.busyOrange,
  },
  timerText: {
    color: COLORS.busyOrange,
    fontWeight: '800',
    fontSize: 14,
  },
  contentScroll: {
    marginBottom: 16,
  },
  highlightCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  highlightItem: {
    alignItems: 'center',
  },
  highlightLabel: {
    color: COLORS.secondaryText,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  payoutValue: {
    color: COLORS.onlineGreen,
    fontSize: 22,
    fontWeight: '800',
  },
  highlightValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  dividerVertical: {
    width: 1,
    height: 30,
    backgroundColor: '#26295C',
  },
  routeContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  pickupDot: {
    backgroundColor: COLORS.blue,
  },
  dropDot: {
    backgroundColor: COLORS.hotPink,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.border,
    marginLeft: 6,
    marginVertical: 4,
  },
  stepInfo: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepAddress: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  orderSummaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  printBadge: {
    backgroundColor: COLORS.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  printBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  paymentMode: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: COLORS.offlineGrayLight,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rejectBtnText: {
    color: COLORS.offlineGray,
    fontWeight: '700',
    fontSize: 14,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: COLORS.onlineGreen,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 3,
  },
  acceptBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
