import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  BarChart2,
  TrendingUp,
  Coins,
  Users,
  Clock,
  Award,
  Inbox,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';
import { VendorApi, VendorAnalyticsData } from '../services/api';

export const AnalyticsScreen: React.FC = () => {
  const { vendor, refreshData } = useVendor();
  const [analytics, setAnalytics] = useState<VendorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const data = await VendorApi.getAnalytics(vendor?.vendorCode || 'VND001');
      if (data) setAnalytics(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [vendor?.vendorCode]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAnalytics(), refreshData()]);
  };

  const totalSplit = (analytics?.paymentSplit.coins || 0) +
    (analytics?.paymentSplit.cash || 0) +
    (analytics?.paymentSplit.wallet || 0) +
    (analytics?.paymentSplit.upi || 0);

  const coinsPct = totalSplit > 0 ? Math.round(((analytics?.paymentSplit.coins || 0) / totalSplit) * 100) : 0;
  const cashPct = totalSplit > 0 ? Math.round(((analytics?.paymentSplit.cash || 0) / totalSplit) * 100) : 0;
  const walletPct = totalSplit > 0 ? Math.round(((analytics?.paymentSplit.wallet || 0) / totalSplit) * 100) : 0;
  const upiPct = totalSplit > 0 ? Math.round(((analytics?.paymentSplit.upi || 0) / totalSplit) * 100) : 0;

  const topCustomers = analytics?.topCustomers || [];
  const peakHours = analytics?.peakHours || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.rose]} />
      }
    >
      {/* Title */}
      <View style={styles.header}>
        <BarChart2 size={22} color={COLORS.rose} />
        <View>
          <Text style={styles.title}>Store Performance & Analytics</Text>
          <Text style={styles.subtitle}>Insights for {vendor?.storeName || 'Vendor'}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.rose} style={{ marginVertical: 30 }} />
      ) : (
        <>
          {/* Monthly Revenue Card */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>MONTHLY ESTIMATED GMV</Text>
            <Text style={styles.metricTotal}>
              ₹{(analytics?.monthlyGmv || 0).toLocaleString()}
            </Text>
            <View style={styles.metricFooter}>
              <TrendingUp size={14} color="#10B981" />
              <Text style={styles.growthText}>
                {analytics?.growthPercent ? `+${analytics.growthPercent}% vs last month` : 'Real-time aggregated sales'}
              </Text>
            </View>
          </View>

          {/* Payment Split Analytics */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Method Distribution</Text>

            {totalSplit === 0 ? (
              <Text style={styles.emptyText}>No payment transactions recorded yet.</Text>
            ) : (
              <>
                <View style={styles.barWrapper}>
                  {coinsPct > 0 && <View style={[styles.barSegment, { flex: coinsPct, backgroundColor: '#D97706' }]} />}
                  {cashPct > 0 && <View style={[styles.barSegment, { flex: cashPct, backgroundColor: '#10B981' }]} />}
                  {walletPct > 0 && <View style={[styles.barSegment, { flex: walletPct, backgroundColor: '#6366F1' }]} />}
                  {upiPct > 0 && <View style={[styles.barSegment, { flex: upiPct, backgroundColor: '#EC4899' }]} />}
                </View>

                <View style={styles.legendRow}>
                  {coinsPct > 0 && (
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
                      <Text style={styles.legendText}>Coins: {coinsPct}%</Text>
                    </View>
                  )}
                  {cashPct > 0 && (
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                      <Text style={styles.legendText}>Cash: {cashPct}%</Text>
                    </View>
                  )}
                  {walletPct > 0 && (
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
                      <Text style={styles.legendText}>Wallet: {walletPct}%</Text>
                    </View>
                  )}
                  {upiPct > 0 && (
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#EC4899' }]} />
                      <Text style={styles.legendText}>UPI: {upiPct}%</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Top Counter Customers */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Award size={18} color="#D97706" />
              <Text style={styles.cardTitle}>Top Local Customers</Text>
            </View>

            {topCustomers.length === 0 ? (
              <Text style={styles.emptyText}>Top spending customers will appear here after orders.</Text>
            ) : (
              <View style={styles.customerList}>
                {topCustomers.map((c, i) => (
                  <View key={c.name + i} style={styles.customerRow}>
                    <View style={styles.customerRank}>
                      <Text style={styles.rankNum}>#{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.cName}>{c.name}</Text>
                      <Text style={styles.cMeta}>{c.visitCount} counter orders</Text>
                    </View>
                    <Text style={styles.cSpend}>₹{c.totalSpent.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Peak Hours Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Clock size={18} color="#2563EB" />
              <Text style={styles.cardTitle}>Peak In-Store Footfall Hours</Text>
            </View>
            {peakHours.length === 0 ? (
              <Text style={styles.emptyText}>Peak order hours will calculate automatically from customer visits.</Text>
            ) : (
              <Text style={styles.peakSub}>
                Busiest hours at your store are:{' '}
                {peakHours.map((h) => `${h.hour % 12 || 12}:00 ${h.hour >= 12 ? 'PM' : 'AM'}`).join(', ')} ({peakHours.reduce((sum, h) => sum + h.count, 0)} orders recorded).
              </Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  metricTotal: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  growthText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  barWrapper: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  customerList: {
    gap: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  cName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  cSpend: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  peakSub: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});
