import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { useApp } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';

export const S24_OrderTrackingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentOrder, setActiveScreen, goBack, user, addToCart } = useApp();

  const order = currentOrder;
  const orderNum = order?.orderNumber || '#W12345678';
  const partner = order?.deliveryPartner || { name: 'Rohit Kumar (Worm Up Express)', phone: '+91 98123 45678' };
  const isDelivered = order?.status === 'DELIVERED';

  const steps = [
    { title: 'Order Confirmed', time: order?.date ? order.date.split(',')[1] || 'Just now' : 'Just now', status: 'completed' },
    { title: 'Packed & Dispatched', time: 'In 3 mins', status: isDelivered ? 'completed' : 'active' },
    { title: 'Out for Delivery', time: 'In 6 mins', status: isDelivered ? 'completed' : 'pending' },
    { title: isDelivered ? 'Delivered' : 'Delivering in 9 mins', time: isDelivered ? 'Delivered' : 'Estimated', status: isDelivered ? 'completed' : 'pending' },
  ];

  const handleRepeatOrder = () => {
    if (order?.items && order.items.length > 0) {
      order.items.forEach((it) => {
        addToCart({
          id: it.productId || `prod_${Date.now()}`,
          name: it.name,
          brand: 'Worm Up',
          categoryId: 'cooking',
          sellingPrice: it.price,
          mrp: Math.round(it.price * 1.15),
          discountPercent: 12,
          shoppingCoins: 10,
          rating: 4.8,
          reviewCount: 30,
          stock: 100,
          deliveryMinutes: 9,
          description: '',
          quantityLabel: `${it.quantity} unit`,
        });
      });
      setActiveScreen('C19_Cart');
    } else {
      Alert.alert('Notice', 'No items found in this order.');
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="Order Details"
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Info & Status Header */}
        <View style={styles.orderInfoCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNumberTitle}>{orderNum}</Text>
            <Text style={styles.orderDateSubtitle}>Placed on {order?.date || 'Today'}</Text>
          </View>
          <View style={[styles.statusPill, isDelivered ? styles.statusPillDelivered : styles.statusPillActive]}>
            <Text style={[styles.statusPillText, isDelivered ? styles.statusTextDelivered : styles.statusTextActive]}>
              {order?.status || 'PLACED'}
            </Text>
          </View>
        </View>

        {/* Live Delivery Map Visualization */}
        <View style={styles.mapCard}>
          <View style={styles.mapMockBackground}>
            <View style={styles.roadLine} />
            <View style={styles.dashedRoute} />

            {/* Store Pin */}
            <View style={[styles.mapPin, styles.storePin]}>
              <Ionicons name="storefront" size={16} color={COLORS.white} />
            </View>

            {/* Delivery Scooter on the way */}
            <View style={[styles.mapPin, styles.scooterPin]}>
              <Ionicons name="bicycle" size={18} color={COLORS.white} />
            </View>

            {/* Home Destination Pin */}
            <View style={[styles.mapPin, styles.homePin]}>
              <Ionicons name="home" size={16} color={COLORS.white} />
            </View>
          </View>

          <View style={styles.mapFooter}>
            <Text style={styles.mapEta}>
              {isDelivered ? 'Order Delivered Successfully' : 'Estimated arrival: 9-12 minutes'}
            </Text>
            <Text style={styles.mapSub}>
              {isDelivered ? 'Thank you for shopping with Worm Up!' : 'Worm Up Express delivery partner on the way'}
            </Text>
          </View>
        </View>

        {/* Timeline Progress */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineHeading}>Order Status</Text>

          {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isLast = idx === steps.length - 1;

            return (
              <View key={idx} style={styles.timelineItem}>
                <View style={styles.timelineIconCol}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleCompleted,
                      isActive && styles.stepCircleActive,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={12} color={COLORS.white} />
                    ) : isActive ? (
                      <View style={styles.activeDot} />
                    ) : (
                      <View style={styles.pendingDot} />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                        isCompleted && styles.timelineLineCompleted,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.timelineTextCol}>
                  <Text
                    style={[
                      styles.stepTitle,
                      (isCompleted || isActive) && styles.stepTitleBold,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.stepTime}>{step.time}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Ordered Items Breakdown Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="cart-outline" size={18} color={COLORS.navy} style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeading}>
              Items in this Order ({order?.items?.length || 0})
            </Text>
          </View>

          {order?.items && order.items.length > 0 ? (
            order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemBullet} />
                <View style={styles.itemInfoCol}>
                  <Text style={styles.itemNameText}>{item.name}</Text>
                  <Text style={styles.itemQtyText}>Quantity: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPriceText}>₹{item.price * item.quantity}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>Order items details not available</Text>
          )}
        </View>

        {/* Delivery Address Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.hotPink} style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeading}>Delivery Address</Text>
          </View>
          <Text style={styles.recipientName}>
            {order?.deliveryAddress?.fullName || user?.fullName || 'Worm Up Customer'} ({order?.deliveryAddress?.type || 'Home'})
          </Text>
          <Text style={styles.addressLine}>
            {order?.deliveryAddress?.houseFlat ? `${order.deliveryAddress.houseFlat}, ` : ''}
            {order?.deliveryAddress?.areaLandmark || 'Current Delivery Location'}
            {order?.deliveryAddress?.city ? `, ${order.deliveryAddress.city}` : ''}
            {order?.deliveryAddress?.pincode ? ` - ${order.deliveryAddress.pincode}` : ''}
          </Text>
        </View>

        {/* Bill Summary Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="receipt-outline" size={18} color={COLORS.purple} style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeading}>Bill & Payment Summary</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Subtotal</Text>
            <Text style={styles.billValue}>₹{order?.subtotal || order?.totalAmount || 0}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, { color: '#059669' }]}>FREE</Text>
          </View>

          {order?.discount && order.discount > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Discount</Text>
              <Text style={[styles.billValue, { color: COLORS.hotPink }]}>-₹{order.discount}</Text>
            </View>
          ) : null}

          <View style={styles.dividerLine} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Total Amount Paid</Text>
            <Text style={styles.billTotalValue}>₹{order?.totalAmount || 0}</Text>
          </View>

          <View style={styles.paymentMethodRow}>
            <Ionicons name="card-outline" size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.paymentMethodText}>
              Paid via {order?.paymentMethod || 'Online / Cash on Delivery'}
            </Text>
          </View>
        </View>

        {/* Delivery Partner Section */}
        <View style={styles.partnerCard}>
          <View style={styles.partnerAvatar}>
            <Ionicons name="person" size={24} color={COLORS.purple} />
          </View>

          <View style={styles.partnerInfo}>
            <Text style={styles.partnerRole}>Delivery Partner</Text>
            <Text style={styles.partnerName}>{partner.name}</Text>
          </View>

          <View style={styles.partnerActions}>
            <TouchableOpacity
              onPress={() => Alert.alert('Calling Partner', `Calling ${partner.phone}...`)}
              style={styles.circleActionButton}
            >
              <Ionicons name="call" size={18} color={COLORS.hotPink} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Alert.alert('Support Chat', 'Worm Up 24x7 Customer Support is here to help.')}
              style={styles.circleActionButton}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.blue} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons: Repeat Order and Help */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleRepeatOrder}
          style={styles.actionBtnWrapper}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Ionicons name="repeat" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Repeat This Order</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => Alert.alert('Worm Up Support', `For assistance with order ${orderNum}, call 1800-WORM-UP or email support@wormup.in`)}
          style={styles.supportOutlineBtn}
        >
          <Text style={styles.supportOutlineText}>Need Help with this Order?</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  orderInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderNumberTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  orderDateSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCE1F5',
  },
  etaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  mapCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  mapMockBackground: {
    height: 160,
    backgroundColor: '#E8ECFA',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadLine: {
    position: 'absolute',
    width: '80%',
    height: 4,
    backgroundColor: '#D1D9F0',
    borderRadius: 2,
  },
  dashedRoute: {
    position: 'absolute',
    width: '50%',
    height: 3,
    backgroundColor: COLORS.hotPink,
    left: '20%',
  },
  mapPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  storePin: {
    left: '16%',
    backgroundColor: COLORS.navy,
  },
  scooterPin: {
    left: '52%',
    backgroundColor: COLORS.hotPink,
  },
  homePin: {
    right: '16%',
    backgroundColor: COLORS.blue,
  },
  mapFooter: {
    padding: SPACING.compact,
    backgroundColor: COLORS.white,
  },
  mapEta: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  mapSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  timelineCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.success,
  },
  stepCircleActive: {
    backgroundColor: COLORS.hotPink,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  timelineLine: {
    width: 2,
    height: 36,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  timelineLineCompleted: {
    backgroundColor: COLORS.success,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  stepTitleBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECE8FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerRole: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 2,
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  circleActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: '#FCE1F5',
    borderColor: COLORS.hotPink,
  },
  statusPillDelivered: {
    backgroundColor: '#E6F9F0',
    borderColor: '#059669',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: COLORS.hotPink,
  },
  statusTextDelivered: {
    color: '#059669',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F5',
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.hotPink,
    marginRight: 10,
  },
  itemInfoCol: {
    flex: 1,
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  itemQtyText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginLeft: 8,
  },
  noItemsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F0F0F5',
    marginVertical: 8,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  billTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.hotPink,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F5',
  },
  paymentMethodText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  actionBtnWrapper: {
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 10,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  supportOutlineBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(131, 100, 230, 0.35)',
    backgroundColor: '#F8F6FE',
  },
  supportOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.purple,
  },
});
