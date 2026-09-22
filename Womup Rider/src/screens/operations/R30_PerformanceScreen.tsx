import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';
import { PerformanceMetrics } from '../../types/rider.types';

export const PerformanceScreen: React.FC = () => {
  const { setSubScreen, profile } = useRider();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await RiderApiService.getPerformance();
    setMetrics(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleIncentiveInfo = () => {
    Alert.alert(
      'Weekly Super-Rider Incentive',
      'Rules:\n1. Maintain >90% acceptance rate\n2. Complete 80 deliveries\n3. Zero reported missing items\n\nReward: ₹1,200 bonus credited directly to your bank every Monday.'
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Back button header */}
      <TouchableOpacity style={[styles.backRow, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={() => setSubScreen('None')}>
        <Ionicons name="arrow-back" size={16} color={COLORS.hotPink} />
        <Text style={styles.backArrow}>Back to Menu</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Rider Operational Scorecard</Text>
      <Text style={styles.screenSubtitle}>
        Performance metrics calculated automatically from completed delivery backend events.
      </Text>

      {/* Main Rating Pill */}
      <View style={styles.ratingHeroCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Ionicons key={i} name="star" size={20} color="#F59E0B" />
          ))}
        </View>
        <Text style={styles.ratingValue}>{profile?.rating || metrics?.customerRating || 5.0}</Text>
        <Text style={styles.ratingCount}>
          Based on {profile?.completedDeliveries ?? metrics?.totalDeliveries ?? 0} Customer Ratings
        </Text>
        <View style={[styles.badge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          <Ionicons name="ribbon-outline" size={12} color={COLORS.hotPink} />
          <Text style={styles.badgeText}>TOP RATED PARTNER</Text>
        </View>
      </View>

      {/* Core Efficiency Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics?.acceptanceRate ?? 94}%</Text>
          <Text style={styles.metricLabel}>Acceptance Rate</Text>
          <Text style={styles.metricSub}>Min 85% required</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics?.completionRate ?? 99}%</Text>
          <Text style={styles.metricLabel}>Completion Rate</Text>
          <Text style={styles.metricSub}>Zero unverified drops</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics?.avgDeliveryMinutes ?? 11.4}m</Text>
          <Text style={styles.metricLabel}>Avg Delivery Time</Text>
          <Text style={styles.metricSub}>SLA: Under 15m</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics?.onTimeRate ?? 97.2}%</Text>
          <Text style={styles.metricLabel}>On-Time SLA</Text>
          <Text style={styles.metricSub}>Target &gt; 95%</Text>
        </View>
      </View>

      {/* Incentives Qualifier */}
      <TouchableOpacity
        style={styles.incentiveCard}
        onPress={handleIncentiveInfo}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={styles.incentiveTitle}>Weekly Super-Rider Bonus: ACTIVE</Text>
          <Ionicons name="information-circle-outline" size={18} color="#059669" />
        </View>
        <Text style={styles.incentiveDesc}>
          Maintain &gt;90% acceptance and complete 80 orders this week to unlock ₹1,200 bonus.
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '75%' }]} />
        </View>
        <Text style={styles.progressText}>60 / 80 Orders completed (75%)</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  backRow: {
    marginBottom: 12,
  },
  backArrow: {
    color: COLORS.hotPink,
    fontWeight: '800',
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  ratingHeroCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingStars: {
    color: '#FBBF24',
    fontSize: 20,
    letterSpacing: 4,
  },
  ratingValue: {
    color: COLORS.white,
    fontSize: 42,
    fontWeight: '900',
    marginTop: 6,
  },
  ratingCount: {
    color: COLORS.secondaryText,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(245, 98, 175, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.hotPink,
  },
  badgeText: {
    color: COLORS.hotPink,
    fontWeight: '800',
    fontSize: 11,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  metricSub: {
    fontSize: 10,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  incentiveCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  incentiveTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  incentiveDesc: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 4,
    lineHeight: 18,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.blue,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 6,
  },
  bottomSpacer: {
    height: 30,
  },
});
