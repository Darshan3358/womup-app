import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../theme';
import { Sparkline } from './Sparkline';

export interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  isPositive?: boolean;
  icon: React.ElementType;
  iconBgColor: string;
  sparklineColor: string;
  onPress?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend = '↑ 0.0%',
  isPositive = true,
  icon: Icon,
  iconBgColor,
  sparklineColor,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
    >
      {/* Top row: icon + label + chevron */}
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          <Icon size={20} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <View style={styles.labelCol}>
          <Text style={styles.labelText} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <ChevronRight size={15} color="#A5A3BE" />
      </View>

      {/* Main prominent value */}
      <Text style={styles.valueText} numberOfLines={1}>
        {value}
      </Text>

      {/* Bottom row: Trend indicator & sparkline curve */}
      <View style={styles.bottomRow}>
        <Text style={[styles.trendText, { color: isPositive ? '#13C783' : '#EF4444' }]}>
          {trend}
        </Text>
        <Sparkline color={sparklineColor} width={58} height={20} strokeWidth={2.2} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 13,
    borderWidth: 1.2,
    borderColor: '#E7D9FF',
    shadowColor: '#762DEB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 116,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  labelCol: {
    flex: 1,
  },
  labelText: {
    color: '#565477',
    fontSize: 12,
    fontWeight: '600',
  },
  valueText: {
    color: '#111044',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginVertical: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

