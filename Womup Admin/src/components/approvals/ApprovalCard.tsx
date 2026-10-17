import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Users,
  Bike,
  Store,
  Coins,
  Wallet,
  ShoppingBag,
  UserCheck,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';
import { RADIUS, SPACING } from '../../theme';

export type ApprovalCategoryKey =
  | 'customer-kyc'
  | 'riders'
  | 'dark-stores'
  | 'vendors'
  | 'withdrawals'
  | 'cancellations'
  | 'staff'
  | 'rate-changes';

interface CategoryConfig {
  key: ApprovalCategoryKey;
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  badgeBg: string;
  icon: any;
}

export const CATEGORY_CONFIGS: Record<ApprovalCategoryKey, CategoryConfig> = {
  'customer-kyc': {
    key: 'customer-kyc',
    title: 'Customer KYC',
    description: 'Pending Aadhaar F/B & Bank Account Review',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    accentColor: '#2563EB',
    badgeBg: '#DBEAFE',
    icon: Users,
  },
  'riders': {
    key: 'riders',
    title: 'Riders Pending',
    description: 'License & Vehicle Compliance Approval',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    accentColor: '#16A34A',
    badgeBg: '#DCFCE7',
    icon: Bike,
  },
  'dark-stores': {
    key: 'dark-stores',
    title: 'Dark Stores',
    description: 'Hub Verification & Radius Serviceability',
    bgColor: '#FEFCE8',
    borderColor: '#FEF08A',
    accentColor: '#CA8A04',
    badgeBg: '#FEF9C3',
    icon: Store,
  },
  'vendors': {
    key: 'vendors',
    title: 'Local Vendors',
    description: 'Shop KYC, GST & Commission % Setup',
    bgColor: '#FAF5FF',
    borderColor: '#E9D5FF',
    accentColor: '#9333EA',
    badgeBg: '#F3E8FF',
    icon: Coins,
  },
  'withdrawals': {
    key: 'withdrawals',
    title: 'Withdrawals',
    description: 'IMPS/NEFT Payout Bank Requests',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    accentColor: '#10B981',
    badgeBg: '#D1FAE5',
    icon: Wallet,
  },
  'cancellations': {
    key: 'cancellations',
    title: 'Cancellations',
    description: 'Order Cancel, Restock & Refund Approval',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    accentColor: '#DC2626',
    badgeBg: '#FEE2E2',
    icon: ShoppingBag,
  },
  'staff': {
    key: 'staff',
    title: 'Staff Pickers',
    description: 'Shift Roster & Onboarding Verification',
    bgColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    accentColor: '#64748B',
    badgeBg: '#F1F5F9',
    icon: UserCheck,
  },
  'rate-changes': {
    key: 'rate-changes',
    title: 'Rate Changes',
    description: 'Payout Simulator & Zone Surge Overrides',
    bgColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    accentColor: '#DB2777',
    badgeBg: '#FCE7F3',
    icon: TrendingUp,
  },
};

interface ApprovalCardProps {
  categoryKey: ApprovalCategoryKey;
  count: number;
  reviewedToday?: number;
  onPress: () => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  categoryKey,
  count,
  reviewedToday = 0,
  onPress,
}) => {
  const config = CATEGORY_CONFIGS[categoryKey];
  const IconComponent = config.icon;
  const hasPending = count > 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top Header: Icon on Left, Count Badge on Right */}
      <View style={styles.topHeader}>
        <View style={[styles.iconCircle, { backgroundColor: config.badgeBg }]}>
          <IconComponent size={22} color={config.accentColor} />
        </View>

        {/* Count Badge */}
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: hasPending ? config.accentColor : '#94A3B8',
            },
          ]}
        >
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      </View>

      {/* Title & Activity */}
      <View style={styles.titleSection}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {config.title}
        </Text>
        {reviewedToday > 0 ? (
          <Text style={styles.reviewedText}>✓ {reviewedToday} done today</Text>
        ) : null}
      </View>

      {/* Description */}
      <Text style={styles.cardDescription} numberOfLines={2}>
        {config.description}
      </Text>

      {/* Bottom Link: Review → */}
      <View style={styles.bottomRow}>
        <Text style={[styles.reviewLinkText, { color: config.accentColor }]}>Review</Text>
        <ChevronRight size={16} color={config.accentColor} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    minHeight: 190,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  titleSection: {
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  reviewedText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 12,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
    paddingTop: 4,
  },
  reviewLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
