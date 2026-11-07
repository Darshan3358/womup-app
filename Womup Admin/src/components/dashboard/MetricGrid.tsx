import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShoppingBag, ShoppingCart, Users, Activity } from 'lucide-react-native';
import { MetricCard } from './MetricCard';

interface MetricGridProps {
  totalGmv: number;
  activeOrdersCount: number;
  totalCustomers: number;
  liveFleetCount: number;
  onPressGmv?: () => void;
  onPressOrders?: () => void;
  onPressCustomers?: () => void;
  onPressFleet?: () => void;
}

export const MetricGrid: React.FC<MetricGridProps> = ({
  totalGmv,
  activeOrdersCount,
  totalCustomers,
  liveFleetCount,
  onPressGmv,
  onPressOrders,
  onPressCustomers,
  onPressFleet,
}) => {
  return (
    <View style={styles.grid}>
      {/* Row 1: Total GMV & Active Orders */}
      <View style={styles.row}>
        <MetricCard
          label="Total GMV"
          value={totalGmv > 0 ? `₹${totalGmv.toLocaleString()}` : '₹0'}
          trend="↑ 12.5%"
          isPositive={true}
          icon={ShoppingBag}
          iconBgColor="#8C52FF"
          sparklineColor="#8C52FF"
          onPress={onPressGmv}
        />
        <View style={styles.spacer} />
        <MetricCard
          label="Active Orders"
          value={String(activeOrdersCount)}
          trend="↑ 0.0%"
          isPositive={true}
          icon={ShoppingCart}
          iconBgColor="#268BFA"
          sparklineColor="#268BFA"
          onPress={onPressOrders}
        />
      </View>

      {/* Row 2: Total Customers & Live Fleet */}
      <View style={styles.row}>
        <MetricCard
          label="Total Customers"
          value={String(totalCustomers)}
          trend="↑ 0.0%"
          isPositive={true}
          icon={Users}
          iconBgColor="#13C783"
          sparklineColor="#13C783"
          onPress={onPressCustomers}
        />
        <View style={styles.spacer} />
        <MetricCard
          label="Live Fleet"
          value={String(liveFleetCount)}
          trend="↑ 0.0%"
          isPositive={true}
          icon={Activity}
          iconBgColor="#FF922E"
          sparklineColor="#FF922E"
          onPress={onPressFleet}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    marginBottom: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  spacer: {
    width: 12,
  },
});

