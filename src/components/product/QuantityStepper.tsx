import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { RADIUS } from '../../theme/spacing';

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  compact?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  compact = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onDecrement}
        style={[styles.button, compact && styles.compactButton]}
      >
        <Ionicons
          name={quantity === 1 ? 'trash-outline' : 'remove'}
          size={compact ? 12 : 14}
          color={COLORS.white}
        />
      </TouchableOpacity>

      <Text style={[styles.quantityText, compact && styles.compactQuantityText]}>
        {quantity}
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onIncrement}
        style={[styles.button, compact && styles.compactButton]}
      >
        <Ionicons name="add" size={compact ? 12 : 14} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hotPink,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  compactContainer: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  button: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    padding: 2,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    paddingHorizontal: 8,
  },
  compactQuantityText: {
    fontSize: 11,
    paddingHorizontal: 5,
  },
});
