import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  QrCode,
  TrendingUp,
  Coins,
  Banknote,
  ShoppingBag,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { COLORS, GRADIENTS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';

const DashboardScreenComponent: React.FC = () => {
  const {
    vendor,
    stats,
    pendingRequests,
    setActiveModalRequest,
    setIsQRModalVisible,
    refreshData,
  } = useVendor();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.rose]} />
      }
    >
      {/* 1. Today Collection Hero Banner */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroLabel}>TODAY'S COLLECTION</Text>
          <View style={styles.growthBadge}>
            <TrendingUp size={13} color="#10B981" />
            <Text style={styles.growthText}>+{stats.todayGrowthPercent}% vs yesterday</Text>
          </View>
        </View>

        <Text style={styles.collectionTotal}>
          ₹{stats.todayCollection.toLocaleString()}
        </Text>

        {/* 3 Metric Pills */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <ShoppingBag size={14} color="#60A5FA" />
            </View>
            <Text style={styles.metricVal}>{stats.orderCount}</Text>
            <Text style={styles.metricSub}>Orders</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.2)' }]}>
              <Coins size={14} color="#F59E0B" />
            </View>
            <Text style={styles.metricVal}>₹{stats.coinsSettled.toLocaleString()}</Text>
            <Text style={styles.metricSub}>Coins Settled</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Banknote size={14} color="#10B981" />
            </View>
            <Text style={styles.metricVal}>₹{stats.cashCollected.toLocaleString()}</Text>
            <Text style={styles.metricSub}>Cash Collected</Text>
          </View>
        </View>

        {/* Big Counter QR Action Button */}
        <TouchableOpacity
          style={styles.showQrBtn}
          activeOpacity={0.85}
          onPress={() => setIsQRModalVisible(true)}
        >
          <QrCode size={20} color="#0F172A" />
          <Text style={styles.showQrBtnText}>Show Counter QR to Customer</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* 2. Admin Settled Shopping Coin Badge */}
      <View style={styles.coinPerkCard}>
        <View style={styles.coinIconPill}>
          <Sparkles size={20} color="#D97706" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.coinPerkTitle}>
            Active Cashback: <Text style={{ color: '#B45309', fontWeight: '900' }}>{vendor?.shoppingCoinPercent || 15}% Shopping Coins</Text>
          </Text>
          <Text style={styles.coinPerkSub}>
            Admin configured rate for {vendor?.storeName}. Customers get rewarded on every counter bill!
          </Text>
        </View>
      </View>

      {/* 3. Pending Verifications Section */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleGroup}>
          <Clock size={18} color={COLORS.rose} />
          <Text style={styles.sectionTitle}>
            Pending Counter Verifications ({pendingRequests.length})
          </Text>
        </View>
      </View>

      {pendingRequests.length === 0 ? (
        <View style={styles.emptyPendingCard}>
          <ShieldCheck size={40} color="#10B981" />
          <Text style={styles.emptyTitle}>All Bills Verified!</Text>
          <Text style={styles.emptySub}>
            New customer bill scans will appear here automatically in real time.
          </Text>
        </View>
      ) : (
        <View style={styles.pendingList}>
          {pendingRequests.map((req) => (
            <TouchableOpacity
              key={req.id}
              style={styles.pendingItem}
              activeOpacity={0.8}
              onPress={() => setActiveModalRequest(req)}
            >
              <View style={styles.pendingLeft}>
                <View style={styles.pendingAvatar}>
                  <Text style={styles.avatarLetter}>{req.customerName.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.customerName}>{req.customerName}</Text>
                  <Text style={styles.pendingMeta}>
                    {req.paymentMethod === 'COINS' || req.paymentMethod === 'COIN'
                      ? `Coins: ₹${req.coinsUsed} • Collect Cash: ₹${req.cashToCollect}`
                      : req.paymentMethod === 'WALLET'
                      ? 'Paid via Wallet'
                      : req.paymentMethod === 'UPI'
                      ? 'Paid via UPI'
                      : `Collect Cash: ₹${req.cashToCollect}`}
                  </Text>
                </View>
              </View>

              <View style={styles.pendingRight}>
                <Text style={styles.pendingAmount}>₹{req.billAmount}</Text>
                <View style={styles.verifyChip}>
                  <Text style={styles.verifyChipText}>
                    {req.cashToCollect > 0 ? `Collect ₹${req.cashToCollect}` : 'Confirm'}
                  </Text>
                  <ChevronRight size={12} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  collectionTotal: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  metricIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  showQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  showQrBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  coinPerkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  coinIconPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinPerkTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  coinPerkSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  sectionHeaderRow: {
    marginTop: 4,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyPendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
  pendingList: {
    gap: 10,
  },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pendingAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.rose,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pendingMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pendingRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  verifyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.rose,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  verifyChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export const DashboardScreen = React.memo(DashboardScreenComponent);
