import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS } from '../../theme/spacing';
import { OrderStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'DELIVERED':
        return { label: 'Delivered', bg: '#EAF8F1', text: COLORS.success };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: '#FDECEE', text: COLORS.error };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Out for Delivery', bg: '#EBF0FF', text: COLORS.blue };
      case 'PACKED':
        return { label: 'Packed', bg: '#F3EFFF', text: COLORS.purple };
      case 'PLACED':
      case 'ACCEPTED':
      default:
        return { label: 'In Progress', bg: '#FEF8EC', text: COLORS.warning };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
