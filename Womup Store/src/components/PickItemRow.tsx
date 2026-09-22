import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PickItem } from '../types/store.types';
import { COLORS } from '../theme/colors';

interface PickItemRowProps {
  item: PickItem;
  onPress?: () => void;
  isCurrent?: boolean;
}

export const PickItemRow: React.FC<PickItemRowProps> = ({
  item,
  onPress,
  isCurrent = false,
}) => {
  const isPicked = item.status === 'PICKED';
  const isOOS = item.status === 'OUT_OF_STOCK';

  return (
    <TouchableOpacity
      style={[
        styles.row,
        isCurrent && styles.currentRow,
        isPicked && styles.pickedRow,
        isOOS && styles.oosRow,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Shelf Location Tag */}
      <View
        style={[
          styles.shelfBadge,
          isPicked ? styles.shelfPicked : isCurrent ? styles.shelfCurrent : styles.shelfPending,
        ]}
      >
        <Text style={styles.shelfText}>{item.shelfLocation || 'A1-R1'}</Text>
      </View>

      {/* Product Information */}
      <View style={styles.infoCol}>
        <Text
          style={[
            styles.productName,
            isPicked && styles.pickedText,
            isOOS && styles.oosText,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={styles.skuText}>
          {item.quantity}x • {item.unit || 'unit'} • SKU: {item.barcode || '890123'}
        </Text>
        {Boolean(item.notes) && <Text style={styles.notesText}>Note: {item.notes}</Text>}
      </View>

      {/* Status Icon */}
      <View style={styles.statusCol}>
        {isPicked ? (
          <View style={styles.pickedCircle}>
            <Ionicons name="checkmark-sharp" size={16} color="#FFF" />
          </View>
        ) : isOOS ? (
          <View style={styles.oosCircle}>
            <Ionicons name="close-sharp" size={14} color="#FFF" />
          </View>
        ) : isCurrent ? (
          <View style={styles.currentIndicator}>
            <Text style={styles.currentText}>SCAN</Text>
          </View>
        ) : (
          <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentRow: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  pickedRow: {
    opacity: 0.6,
  },
  oosRow: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  shelfBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  shelfPending: {
    backgroundColor: COLORS.shelfBadgeBg,
  },
  shelfCurrent: {
    backgroundColor: COLORS.primary,
  },
  shelfPicked: {
    backgroundColor: COLORS.surfaceElevated,
  },
  shelfText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoCol: {
    flex: 1,
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  pickedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  oosText: {
    color: COLORS.danger,
  },
  skuText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  notesText: {
    color: COLORS.warning,
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  statusCol: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentIndicator: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
