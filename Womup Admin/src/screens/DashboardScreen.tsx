import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Users, ShoppingBag, Truck, DollarSign, ArrowRight, Zap } from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { KpiCard } from '../components/common/KpiCard';
import { useAdminState } from '../context/AdminStateContext';

export const DashboardScreen: React.FC = () => {
  const { zones, setActiveTab, setSubView, setSelectedOrder, orders, customers, staff, syncStatus, refreshFromDb } = useAdminState();

  const totalGmv = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const pickersCount = staff.filter((s) => s.role === 'Picker' && s.status === 'On Duty').length;
  const ridersCount = staff.filter((s) => s.role === 'Rider' && s.status === 'On Duty').length;
  const liveFleetCount = pickersCount + ridersCount;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting Banner */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.banner}>
        <View style={styles.bannerContent}>
          <Image
            source={require('../../assets/womup_logo.png')}
            style={styles.bannerLogo}
            resizeMode="contain"
          />
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerGreeting}>Good Morning, Admin</Text>
            <Text style={styles.bannerSubtitle}>{syncStatus}</Text>
          </View>
          <TouchableOpacity style={styles.liveIndicator} onPress={refreshFromDb} activeOpacity={0.8}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveText}>DB LIVE</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Top 4 Telemetry KPI Cards */}
      <Text style={styles.sectionTitle}>Real-time Telemetry</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiRow}>
          <KpiCard
            title="Total GMV"
            value={totalGmv > 0 ? `₹${totalGmv.toLocaleString()}` : '₹0'}
            trend="0.0%"
            isPositive={true}
            subLabel="real-time"
            accentColor={COLORS.hotPink}
            onPress={() => setActiveTab('Orders')}
          />
          <KpiCard
            title="Active Orders"
            value={String(activeOrdersCount)}
            trend="0.0%"
            isPositive={true}
            subLabel="in fulfillment"
            accentColor={COLORS.purple}
            onPress={() => setActiveTab('Orders')}
          />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard
            title="Live Fleet"
            value={String(liveFleetCount)}
            subLabel={`On Duty (${pickersCount} Pickers / ${ridersCount} Riders)`}
            accentColor={COLORS.blue}
            onPress={() => setActiveTab('Staff')}
          />
          <KpiCard
            title="Total Customers"
            value={String(customers.length)}
            trend="0.0%"
            isPositive={true}
            subLabel="registered"
            accentColor={COLORS.deepPurple}
            onPress={() => setActiveTab('Users')}
          />
        </View>
      </View>

      {/* Zone Performance Progress Bars */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Zone GMV Share & Demand</Text>
          <TouchableOpacity onPress={() => setActiveTab('Prices')}>
            <Text style={styles.linkText}>View Prices</Text>
          </TouchableOpacity>
        </View>

        {zones.map((zone) => {
          const zoneActiveOrders = orders.filter((o) => o.zoneName === zone.name && o.status !== 'Delivered' && o.status !== 'Cancelled').length;
          const zoneGmv = orders.filter((o) => o.zoneName === zone.name).reduce((sum, o) => sum + (o.total || 0), 0);
          const percent = totalGmv > 0 ? Math.round((zoneGmv / totalGmv) * 100) : 0;
          return (
            <View key={zone.id} style={styles.zoneRow}>
              <View style={styles.zoneLabelCol}>
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Text style={styles.zoneMeta}>{zoneActiveOrders} active orders</Text>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBar, { width: `${Math.max(percent * 2.5, 0)}%` }]}
                />
              </View>
              <Text style={styles.percentText}>{percent}%</Text>
            </View>
          );
        })}
      </View>

      {/* Quick Action Shortcuts */}
      <Text style={styles.sectionTitle}>Operational Shortcuts</Text>
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => setActiveTab('Prices')}
        >
          <LinearGradient colors={['#FCE1F5', '#F562AF']} style={styles.shortcutIcon}>
            <DollarSign size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.shortcutText}>Adjust Prices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => setActiveTab('Inventory')}
        >
          <LinearGradient colors={['#E2E6F9', '#8364E6']} style={styles.shortcutIcon}>
            <Zap size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.shortcutText}>Stock Loss</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => setActiveTab('Orders')}
        >
          <LinearGradient colors={['#8364E6', '#515FEA']} style={styles.shortcutIcon}>
            <ShoppingBag size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.shortcutText}>Live Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => setSubView('ShoppingCoin')}
        >
          <LinearGradient colors={['#F1A4CD', '#BF54D0']} style={styles.shortcutIcon}>
            <TrendingUp size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.shortcutText}>Shopping Coin</Text>
        </TouchableOpacity>
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
    padding: SPACING.md,
  },
  banner: {
    borderRadius: RADIUS.banner,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 10,
  },
  bannerTextCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  bannerGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: COLORS.lightPink,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 6, 42, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
    alignSelf: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  liveText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginVertical: SPACING.sm,
  },
  kpiGrid: {
    marginBottom: SPACING.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    marginHorizontal: -SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  linkText: {
    fontSize: 12,
    color: COLORS.hotPink,
    fontWeight: '600',
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  zoneLabelCol: {
    width: 90,
  },
  zoneName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  zoneMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.lightBlueLavender,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  percentText: {
    width: 32,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.sm,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
