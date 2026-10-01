import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { OrderCard } from '../../components/OrderCard';
import { COLORS } from '../../theme/colors';

export const ST05_StaffDashboardScreen: React.FC = () => {
  const {
    staff,
    store,
    performance,
    incomingOrders,
    pickingOrders,
    readyOrders,
    setCurrentTab,
    setSubScreen,
    acceptOrderAndStartPick,
    selectOrderForDetail,
    refreshIncoming,
    refreshPicking,
    refreshReady,
    isLoading,
  } = useStore();

  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Chandlodiya');

  const cityName = store?.cityName || store?.city || 'Ahmedabad';

  const handleRefresh = async () => {
    await Promise.all([refreshIncoming(), refreshPicking(), refreshReady()]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Shift Greeting */}
      <View style={styles.welcomeBanner}>
        <View style={styles.welcomeTextWrapper}>
          <Text style={styles.greetingText} numberOfLines={1} ellipsizeMode="tail">
            Hello, {staff?.fullName || `${store?.name || 'Dark Store'} Staff`} 👋
          </Text>
          <Text style={styles.shiftMetaText} numberOfLines={1} ellipsizeMode="tail">
            Shift: {staff?.shift || 'MORNING'} • Terminal: #{staff?.employeeCode ? staff.employeeCode.replace(/^STF-STORE-/, '').replace(/^STF-/, '') : (store?.code || '001')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.perfButton}
          onPress={() => setSubScreen('Performance')}
          activeOpacity={0.8}
        >
          <Ionicons name="stats-chart" size={15} color={COLORS.primary} />
          <Text style={styles.perfButtonText}>STATS</Text>
        </TouchableOpacity>
      </View>

      {/* 📍 Serving Zone Banner (NEW) */}
      <View style={styles.servingBanner}>
        <View style={styles.servingBannerLeft}>
          <View style={styles.servingIconBox}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.servingLabel}>YOU ARE SERVING</Text>
            <Text style={styles.servingValue}>
              {areaName} · {cityName}
            </Text>
          </View>
        </View>
        <View style={styles.servingLockBadge}>
          <Ionicons name="lock-closed" size={11} color={COLORS.accentCyan} />
          <Text style={styles.servingLockText}>Area Locked</Text>
        </View>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={styles.kpiIconBox}>
            <Ionicons name="cube-outline" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.kpiValue}>{performance?.todayPicked ?? 0}</Text>
          <Text style={styles.kpiLabel}>Orders Picked</Text>
          <Text style={styles.kpiSubLabel}>
            {(performance?.todayPicked ?? 0) === 0 ? 'Just started' : 'Picked today'}
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
            <Ionicons name="speedometer-outline" size={18} color={COLORS.accentCyan} />
          </View>
          <Text style={styles.kpiValue} numberOfLines={1}>
            {performance?.avgPickTime ? performance.avgPickTime : 'No orders'}
          </Text>
          <Text style={styles.kpiLabel}>Avg Pick Speed</Text>
          <Text style={styles.kpiSubLabel} numberOfLines={1}>
            {performance?.avgPickTime ? 'Avg pick time' : 'Pick 1 order to see'}
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.accentPurple} />
          </View>
          <Text style={styles.kpiValue}>{performance?.accuracy ?? 100}%</Text>
          <Text style={styles.kpiLabel}>Scan Accuracy</Text>
          <Text style={styles.kpiSubLabel}>
            {(performance?.todayPicked ?? 0) === 0 ? 'Perfect so far' : 'High accuracy'}
          </Text>
        </View>
      </View>

      {/* Quick Action Shortcuts */}
      <View style={styles.quickShortcuts}>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => setCurrentTab('Incoming')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Ionicons name="flash" size={18} color={COLORS.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>Incoming Queue</Text>
            <Text style={styles.shortcutDesc}>{incomingOrders.length} orders awaiting pick</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => setCurrentTab('Ready')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="bicycle" size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>Rider Handover Shelves</Text>
            <Text style={styles.shortcutDesc}>{readyOrders.length} sealed bags ready</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Currently In-Progress Orders Section */}
      {pickingOrders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CURRENTLY PICKING ({pickingOrders.length})</Text>
            <TouchableOpacity onPress={() => setCurrentTab('Picking')}>
              <Text style={styles.seeAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          {pickingOrders.slice(0, 2).map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              ctaText="CONTINUE PICKING"
              ctaColor={COLORS.warning}
              onPress={() => selectOrderForDetail(order.orderId)}
            />
          ))}
        </View>
      )}

      {/* Incoming Orders Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>INCOMING ORDERS</Text>
            {incomingOrders.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{incomingOrders.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => setCurrentTab('Incoming')}>
            <Text style={styles.seeAllText}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {incomingOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle" size={42} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>Queue Clear!</Text>
            <Text style={styles.emptyDesc}>No orders currently waiting.</Text>
            <Text style={styles.emptyAreaNote}>
              New orders from <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{areaName}</Text> area will appear here.
            </Text>
          </View>
        ) : (
          incomingOrders.slice(0, 3).map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              ctaText="START PICKING"
              ctaColor={COLORS.primary}
              onPress={() => acceptOrderAndStartPick(order.orderId)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  welcomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  welcomeTextWrapper: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  greetingText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  shiftMetaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  perfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    flexShrink: 0,
  },
  perfButtonText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  kpiLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '700',
  },
  kpiSubLabel: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    marginTop: 2,
  },
  quickShortcuts: {
    gap: 10,
    marginBottom: 20,
  },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  shortcutIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  shortcutDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  emptyAreaNote: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  servingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  servingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  servingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingLabel: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  servingValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  servingLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  servingLockText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '800',
  },
});
