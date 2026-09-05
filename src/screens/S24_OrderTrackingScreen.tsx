import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { useApp } from '../context/AppContext';

export const S24_OrderTrackingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentOrder, setActiveScreen, goBack } = useApp();

  const order = currentOrder;
  const orderNum = order?.orderNumber || '#W12345678';
  const partner = order?.deliveryPartner || { name: 'Rohit Kumar', phone: '+91 98123 45678' };

  const steps = [
    { title: 'Order Confirmed', time: '10:30 AM', status: 'completed' },
    { title: 'Packed', time: '10:40 AM', status: 'completed' },
    { title: 'Out for Delivery', time: '11:00 AM', status: 'active' },
    { title: 'Delivered', time: 'Estimated 11:12 AM', status: 'pending' },
  ];

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="Order Tracking"
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Info Card */}
        <View style={styles.orderInfoCard}>
          <View>
            <Text style={styles.orderNumberTitle}>Order {orderNum}</Text>
            <Text style={styles.orderDateSubtitle}>Placed on 22 May 2024, 10:30 AM</Text>
          </View>
          <View style={styles.etaBadge}>
            <Ionicons name="time-outline" size={14} color={COLORS.hotPink} />
            <Text style={styles.etaBadgeText}>12 min</Text>
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
            <Text style={styles.mapEta}>Estimated arrival: 12 min</Text>
            <Text style={styles.mapSub}>Worm Up Express Rider on the way</Text>
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
            <TouchableOpacity style={styles.circleActionButton}>
              <Ionicons name="call" size={18} color={COLORS.hotPink} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleActionButton}>
              <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.blue} />
            </TouchableOpacity>
          </View>
        </View>

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
});
