import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  animation?: 'wave' | 'pulse' | 'none';
}

/**
 * Modern Pulse/Shimmer Base Skeleton Component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
  animation = 'wave',
}) => {
  const animatedValue = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (animation === 'none') return;

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();

    return () => anim.stop();
  }, [animatedValue, animation]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity: animation === 'none' ? 0.35 : animatedValue,
        },
        style,
      ]}
    />
  );
};

/**
 * Order Card Skeleton matching OrdersScreen layout
 */
export const OrderCardSkeleton: React.FC = () => {
  return (
    <View style={styles.orderCardSkeleton}>
      {/* Header Row */}
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <Skeleton width={110} height={18} borderRadius={4} />
          <Skeleton width={80} height={20} borderRadius={RADIUS.pill} style={{ marginLeft: 8 }} />
        </View>
        <Skeleton width={50} height={14} borderRadius={4} />
      </View>

      {/* Breadcrumb Hierarchy */}
      <View style={styles.breadcrumbSkeleton}>
        <Skeleton width="85%" height={12} borderRadius={4} />
      </View>

      {/* Customer & Price */}
      <View style={[styles.rowBetween, { marginTop: 12 }]}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Skeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width="40%" height={12} borderRadius={4} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Skeleton width={60} height={20} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width={40} height={12} borderRadius={4} />
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRowSkeleton}>
        <Skeleton width={75} height={28} borderRadius={RADIUS.pill} style={{ marginRight: 8 }} />
        <Skeleton width={65} height={28} borderRadius={RADIUS.pill} style={{ marginRight: 8 }} />
        <Skeleton width={80} height={28} borderRadius={RADIUS.pill} style={{ marginLeft: 'auto' }} />
      </View>
    </View>
  );
};

/**
 * Order List Skeleton (renders multiple OrderCardSkeleton items)
 */
export const OrderListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md }}>
      {Array.from({ length: count }).map((_, idx) => (
        <OrderCardSkeleton key={`order_skel_${idx}`} />
      ))}
    </View>
  );
};

/**
 * Customer / Rider Card Skeleton matching CustomersScreen layout
 */
export const CustomerCardSkeleton: React.FC = () => {
  return (
    <View style={styles.customerCardSkeleton}>
      <Skeleton width={44} height={44} borderRadius={22} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Skeleton width="50%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width={60} height={18} borderRadius={RADIUS.pill} />
        </View>
        <Skeleton width="35%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
        <View style={styles.row}>
          <Skeleton width={80} height={18} borderRadius={RADIUS.pill} style={{ marginRight: 8 }} />
          <Skeleton width={70} height={18} borderRadius={RADIUS.pill} />
        </View>
      </View>
    </View>
  );
};

/**
 * Customer / Rider List Skeleton
 */
export const CustomerListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md }}>
      {Array.from({ length: count }).map((_, idx) => (
        <CustomerCardSkeleton key={`cust_skel_${idx}`} />
      ))}
    </View>
  );
};

/**
 * KPI Grid Skeleton for Dashboard
 */
export const DashboardKpiSkeleton: React.FC = () => {
  return (
    <View style={styles.kpiGridSkeleton}>
      <View style={styles.kpiCardSkeleton}>
        <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={24} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={10} borderRadius={4} />
      </View>
      <View style={styles.kpiCardSkeleton}>
        <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={24} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={10} borderRadius={4} />
      </View>
      <View style={styles.kpiCardSkeleton}>
        <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={24} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={10} borderRadius={4} />
      </View>
      <View style={styles.kpiCardSkeleton}>
        <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={24} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={10} borderRadius={4} />
      </View>
    </View>
  );
};

/**
 * Inventory Card Skeleton matching InventoryScreen layout
 */
export const InventoryCardSkeleton: React.FC = () => {
  return (
    <View style={styles.inventoryCardSkeleton}>
      <View style={styles.rowBetween}>
        <Skeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width={70} height={18} borderRadius={RADIUS.pill} />
      </View>
      <Skeleton width="30%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
      <View style={styles.rowBetween}>
        <View>
          <Skeleton width={45} height={10} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={18} borderRadius={4} />
        </View>
        <View>
          <Skeleton width={45} height={10} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={18} borderRadius={4} />
        </View>
        <View>
          <Skeleton width={45} height={10} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={18} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

/**
 * Inventory List Skeleton
 */
export const InventoryListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md }}>
      {Array.from({ length: count }).map((_, idx) => (
        <InventoryCardSkeleton key={`inv_skel_${idx}`} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderCardSkeleton: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  breadcrumbSkeleton: {
    backgroundColor: '#F7FAFC',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 10,
  },
  actionRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
  },
  customerCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  kpiGridSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  kpiCardSkeleton: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  inventoryCardSkeleton: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
});
