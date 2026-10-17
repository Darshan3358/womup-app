import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  ShieldCheck,
  Users,
  Bike,
  Store,
  DollarSign,
  Package,
  UserCheck,
  Sliders,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const PendingApprovalsWidget: React.FC = () => {
  const { setActiveTab } = useAdminState();
  const [counts, setCounts] = useState({
    customerKyc: 45,
    riders: 8,
    stores: 3,
    vendors: 12,
    withdrawals: 15,
    staff: 5,
    orders: 6,
    rateChanges: 2,
    total: 96,
  });

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await fetch('http://localhost:5050/api/v1/admin/approvals/summary');
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setCounts({
            customerKyc: json.data.customerKyc,
            riders: json.data.riders,
            stores: json.data.stores,
            vendors: json.data.vendors,
            withdrawals: json.data.withdrawals,
            staff: json.data.staff,
            orders: json.data.orders,
            rateChanges: json.data.rateChanges,
            total: json.data.totalPending,
          });
        }
      }
    } catch (e) {
      // keep fallback
    }
  };

  const cards = [
    {
      id: 'customerKyc',
      title: 'Customer KYC',
      count: counts.customerKyc,
      icon: Users,
      color: '#1D4ED8',
      bg: '#EFF6FF',
      tab: 'Customers',
      desc: 'Pending Aadhaar Front/Back',
    },
    {
      id: 'riders',
      title: 'Riders Pending',
      count: counts.riders,
      icon: Bike,
      color: '#0D9488',
      bg: '#F0FDFA',
      tab: 'Staff',
      desc: 'License & Vehicle Approval',
    },
    {
      id: 'stores',
      title: 'Dark Stores',
      count: counts.stores,
      icon: Store,
      color: '#D97706',
      bg: '#FFFBEB',
      tab: 'Stores',
      desc: 'Hub Verification & Radius',
    },
    {
      id: 'vendors',
      title: 'Local Vendors',
      count: counts.vendors,
      icon: Store,
      color: '#7C3AED',
      bg: '#F5F3FF',
      tab: 'Vendors',
      desc: 'Shop KYC & Commission',
    },
    {
      id: 'withdrawals',
      title: 'Withdrawals',
      count: counts.withdrawals,
      icon: DollarSign,
      color: '#059669',
      bg: '#ECFDF5',
      tab: 'Wallets',
      desc: 'IMPS/NEFT Payout Requests',
    },
    {
      id: 'orders',
      title: 'Cancellations',
      count: counts.orders,
      icon: Package,
      color: '#DC2626',
      bg: '#FEF2F2',
      tab: 'Orders',
      desc: 'Order Cancel & Restock',
    },
    {
      id: 'staff',
      title: 'Staff Pickers',
      count: counts.staff,
      icon: UserCheck,
      color: '#475569',
      bg: '#F8FAFC',
      tab: 'Staff',
      desc: 'Shift & Duty Approval',
    },
    {
      id: 'rateChanges',
      title: 'Rate Changes',
      count: counts.rateChanges,
      icon: Sliders,
      color: '#FF3B98',
      bg: '#FFF0F7',
      tab: 'PayoutRates',
      desc: 'Payout Simulator Overrides',
    },
  ];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ShieldCheck size={20} color={COLORS.navy} />
          <Text style={styles.title}>Pending Approvals</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{counts.total} PENDING</Text>
          </View>
        </View>
      </View>

      {/* 2-COLUMN GRID OF APPROVAL CARDS */}
      <View style={styles.grid}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <TouchableOpacity
              key={card.id}
              style={[styles.card, { backgroundColor: card.bg }]}
              onPress={() => setActiveTab(card.tab as any)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <Icon size={16} color={card.color} />
                </View>
                <Text style={[styles.countText, { color: card.color }]}>
                  {card.count}
                </Text>
              </View>

              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={1}>
                {card.desc}
              </Text>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewText, { color: card.color }]}>Review</Text>
                <ChevronRight size={13} color={card.color} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
  },
  badge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 16,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 8,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 6,
  },
  reviewText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
