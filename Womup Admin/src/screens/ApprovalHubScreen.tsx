import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { ShieldCheck, RefreshCw, Layers } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import {
  ApprovalCard,
  ApprovalCategoryKey,
  CATEGORY_CONFIGS,
} from '../components/approvals/ApprovalCard';
import { CategoryQueueView } from '../components/approvals/CategoryQueueView';
import { approvalService, ApprovalSummary } from '../services/approvalService';
import io from 'socket.io-client';

const CATEGORY_KEYS: ApprovalCategoryKey[] = [
  'customer-kyc',
  'riders',
  'dark-stores',
  'vendors',
  'withdrawals',
  'cancellations',
  'staff',
  'rate-changes',
];

export const ApprovalHubScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const [summary, setSummary] = useState<ApprovalSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<ApprovalCategoryKey | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await approvalService.getSummary();
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();

    // Auto-refresh summary every 30 seconds
    const interval = setInterval(() => {
      fetchSummary();
    }, 30000);

    // WebSocket real-time updates
    let socket: any = null;
    try {
      const socketUrl =
        typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:5050/tracking'
          : 'https://womup-app.onrender.com/tracking';

      socket = io(socketUrl, { transports: ['websocket'] });
      socket.on('approval_summary_updated', (updatedSummary: any) => {
        if (updatedSummary) {
          setSummary((prev) => ({
            ...prev,
            ...updatedSummary,
            totalPending: updatedSummary.totalPending ?? prev?.totalPending ?? 0,
          }));
        }
      });
    } catch (sockErr) {
      console.warn('Socket connect error:', sockErr);
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [fetchSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const getCategoryCount = (key: ApprovalCategoryKey): number => {
    if (!summary) return 0;
    switch (key) {
      case 'customer-kyc':
        return summary.customerKyc ?? summary.categories?.customerKyc?.pending ?? 0;
      case 'riders':
        return summary.riders ?? summary.categories?.riders?.pending ?? 0;
      case 'dark-stores':
        return summary.stores ?? summary.categories?.darkStores?.pending ?? 0;
      case 'vendors':
        return summary.vendors ?? summary.categories?.vendors?.pending ?? 0;
      case 'withdrawals':
        return summary.withdrawals ?? summary.categories?.withdrawals?.pending ?? 0;
      case 'cancellations':
        return summary.orders ?? summary.categories?.cancellations?.pending ?? 0;
      case 'staff':
        return summary.staff ?? summary.categories?.staff?.pending ?? 0;
      case 'rate-changes':
        return summary.rateChanges ?? summary.categories?.rateChanges?.pending ?? 0;
      default:
        return 0;
    }
  };

  const getCategoryReviewedToday = (key: ApprovalCategoryKey): number => {
    if (!summary?.categories) return 0;
    switch (key) {
      case 'customer-kyc':
        return summary.categories.customerKyc?.reviewedToday || 0;
      case 'riders':
        return summary.categories.riders?.reviewedToday || 0;
      case 'dark-stores':
        return summary.categories.darkStores?.reviewedToday || 0;
      case 'vendors':
        return summary.categories.vendors?.reviewedToday || 0;
      case 'withdrawals':
        return summary.categories.withdrawals?.reviewedToday || 0;
      case 'cancellations':
        return summary.categories.cancellations?.reviewedToday || 0;
      case 'staff':
        return summary.categories.staff?.reviewedToday || 0;
      case 'rate-changes':
        return summary.categories.rateChanges?.reviewedToday || 0;
      default:
        return 0;
    }
  };

  // If a category queue is open, render CategoryQueueView
  if (activeCategory) {
    return (
      <CategoryQueueView
        categoryKey={activeCategory}
        onBack={() => setActiveCategory(null)}
        onRefreshSummary={fetchSummary}
      />
    );
  }

  const totalPending = summary?.totalPending ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.purple]} />
      }
    >
      {/* Page Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <ShieldCheck size={26} color={COLORS.purple} />
          </View>
          <View>
            <Text style={styles.headerTitle}>🛡️ Pending Approvals</Text>
            <Text style={styles.headerSubtitle}>
              Multi-entity KYC, verification, and dispatch compliance hub
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>[{totalPending} PENDING]</Text>
          </View>
          <TouchableOpacity style={styles.refreshIconBtn} onPress={fetchSummary}>
            <RefreshCw size={18} color={COLORS.navy} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading state */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.purple} />
          <Text style={styles.loadingText}>Syncing approval queues across all 8 modules...</Text>
        </View>
      ) : (
        /* 8-Card Grid Layout (Matching user screenshot) */
        <View style={styles.cardsGrid}>
          {(() => {
            const isMobile = width < 540;
            const isTablet = width >= 540 && width < 960;
            const cardWidth = isMobile ? '100%' : isTablet ? '50%' : '25%';

            return CATEGORY_KEYS.map((key) => {
              const count = getCategoryCount(key);
              const reviewedToday = getCategoryReviewedToday(key);
              return (
                <View key={key} style={[styles.cardWrapper, { width: cardWidth }]}>
                  <ApprovalCard
                    categoryKey={key}
                    count={count}
                    reviewedToday={reviewedToday}
                    onPress={() => setActiveCategory(key)}
                  />
                </View>
              );
            });
          })()}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  totalBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  cardWrapper: {
    width: Platform.OS === 'web' ? '50%' : '100%',
    paddingHorizontal: 8,
  },
});
