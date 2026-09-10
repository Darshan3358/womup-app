import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';

interface KpiCardProps {
  title: string;
  value: string;
  trend?: string;
  isPositive?: boolean;
  subLabel?: string;
  onPress?: () => void;
  accentColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  isPositive = true,
  subLabel,
  onPress,
  accentColor = COLORS.purple,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accentColor }]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {(trend || subLabel) && (
        <View style={styles.footerRow}>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: isPositive ? '#E8F8F0' : '#FCECEE' }]}>
              {isPositive ? (
                <TrendingUp size={12} color={COLORS.success} />
              ) : (
                <TrendingDown size={12} color={COLORS.error} />
              )}
              <Text style={[styles.trendText, { color: isPositive ? COLORS.success : COLORS.error }]}>
                {trend}
              </Text>
            </View>
          )}
          {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    margin: SPACING.xs,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  title: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    marginRight: 6,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  subLabel: {
    fontSize: 11,
    color: COLORS.secondaryText,
  },
});
