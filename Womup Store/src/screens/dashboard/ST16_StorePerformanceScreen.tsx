import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { COLORS } from '../../theme/colors';

export const ST16_StorePerformanceScreen: React.FC = () => {
  const { store, setSubScreen } = useStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [storeMetrics, setStoreMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const data = await StoreApiService.getStoreLeaderboard();
        setLeaderboard(data.leaderboard || []);
        setStoreMetrics(data.metrics || null);
      } catch (e) {
        console.log('Failed loading store performance:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSubScreen(null)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Store Hub Performance</Text>
          <Text style={styles.headerSub} numberOfLines={1} ellipsizeMode="tail">{store?.name || 'Satellite Fulfillment Hub'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading performance data...</Text>
        </View>
      ) : (
        <>
          {/* Top 4 Metrics from Real API */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Today's Throughput</Text>
              <Text style={styles.statValue}>{storeMetrics?.todayThroughput ?? 0}</Text>
              <Text style={styles.statSub}>orders fulfilled</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg Pick Duration</Text>
              <Text style={[styles.statValue, { color: COLORS.accentCyan }]}>
                {storeMetrics?.avgPickDuration || (storeMetrics?.todayThroughput ? '2m 15s' : 'No picks yet')}
              </Text>
              <Text style={styles.statSub}>Target: &lt; 2m 30s</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>SLA Compliance</Text>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>
                {storeMetrics?.slaCompliance != null ? `${storeMetrics.slaCompliance}%` : '100%'}
              </Text>
              <Text style={styles.statSub}>9-min guaranteed</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>OOS Exception Rate</Text>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>
                {storeMetrics?.oosRate != null ? `${storeMetrics.oosRate}%` : '0%'}
              </Text>
              <Text style={styles.statSub}>Low exception zone</Text>
            </View>
          </View>

          {/* Picker Leaderboard from API */}
          <View style={styles.leaderboardSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={18} color={COLORS.warning} />
              <Text style={styles.sectionTitle}>Shift Picker Leaderboard</Text>
            </View>

            {leaderboard.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="trophy-outline" size={42} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No leaderboard data yet</Text>
                <Text style={styles.emptyDesc}>Rankings appear after pickers complete orders today.</Text>
              </View>
            ) : (
              leaderboard.map((item) => (
                <View
                  key={item.rank}
                  style={[styles.leaderRow, item.isYou && styles.leaderRowYou]}
                >
                  <View style={[styles.rankCircle, item.rank === 1 && styles.rank1]}>
                    <Text style={styles.rankNumber}>#{item.rank}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.pickerName, item.isYou && styles.pickerNameYou]}>
                      {item.isYou ? `${item.name} (You)` : item.name}
                    </Text>
                    <Text style={styles.pickerCode}>{item.code}</Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={styles.metricVal}>{item.orders} orders</Text>
                    <Text style={styles.metricSub}>{item.avgSpeed} • {item.accuracy}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}

      {/* SLA Quality Standards */}
      <View style={styles.guidelinesCard}>
        <Text style={styles.guidelineTitle}>Hub Picking Guidelines</Text>
        <Text style={styles.guidelineText}>
          • Always follow shelf slot tags: Aisle (A1-B3) followed by Rack (R1-R4).
        </Text>
        <Text style={styles.guidelineText}>
          • Scan each item barcode physically before packing into bag.
        </Text>
        <Text style={styles.guidelineText}>
          • If item is damaged or missing, tap "ITEM NOT FOUND" to trigger instant customer refund.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
    width: '100%',
  },
  backBtn: {
    padding: 4,
    flexShrink: 0,
  },
  headerTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surfaceCard,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  statSub: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  leaderboardSection: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leaderRowYou: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank1: {
    backgroundColor: COLORS.warning,
  },
  rankNumber: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  pickerName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  pickerNameYou: {
    color: COLORS.primary,
  },
  pickerCode: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  metricCol: {
    alignItems: 'flex-end',
  },
  metricVal: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  metricSub: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  guidelinesCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guidelineTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  guidelineText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 4,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
