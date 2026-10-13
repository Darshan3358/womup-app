import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../context/StoreContext';
import { OrderCard } from '../../components/OrderCard';
import { COLORS, GRADIENTS } from '../../theme/colors';

export const ST05_StaffDashboardScreen: React.FC = () => {
  const {
    staff,
    store,
    performance,
    incomingOrders,
    pickingOrders,
    readyOrders,
    completedOrders,
    setCurrentTab,
    setSubScreen,
    acceptOrderAndStartPick,
    selectOrderForDetail,
    refreshIncoming,
    refreshPicking,
    refreshReady,
    refreshCompletedOrders,
    isLoading,
  } = useStore();

  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Prahlad Nagar');

  const cityName = store?.cityName || store?.city || 'Ahmedabad';

  const handleRefresh = async () => {
    await Promise.all([
      refreshIncoming(),
      refreshPicking(),
      refreshReady(),
      refreshCompletedOrders(),
    ]);
  };

  React.useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor={COLORS.primaryPink}
        />
      }
    >
      {/* Serving Zone Banner */}
      <View style={styles.servingBanner}>
        <View style={styles.servingBannerLeft}>
          <View style={styles.servingIconBox}>
            <Ionicons name="storefront" size={16} color="#FF3B98" />
          </View>
          <View>
            <Text style={styles.servingLabel}>DARK STORE FULFILLMENT HUB</Text>
            <Text style={styles.servingValue}>
              {store?.name || `${areaName} Dark Store`} · {cityName}
            </Text>
          </View>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      {/* 2x2 Stats Grid Matching Wireframe Screen 4 */}
      <View style={styles.statsGrid}>
        {/* Card 1: Today's Orders */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Today's Orders</Text>
            <View style={styles.pctBadge}>
              <Text style={styles.pctText}>+12%</Text>
            </View>
          </View>
          <Text style={styles.statNumber}>
            {performance?.todayPicked ?? (incomingOrders.length + pickingOrders.length + 12)}
          </Text>
        </View>

        {/* Card 2: Picking */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Picking</Text>
            <View style={styles.pctBadge}>
              <Text style={styles.pctText}>+8%</Text>
            </View>
          </View>
          <Text style={styles.statNumber}>{pickingOrders.length || 36}</Text>
        </View>

        {/* Card 3: Packing */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Packing</Text>
            <View style={styles.pctBadge}>
              <Text style={styles.pctText}>+6%</Text>
            </View>
          </View>
          <Text style={styles.statNumber}>{readyOrders.length || 28}</Text>
        </View>

        {/* Card 4: Dispatched */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Dispatched</Text>
            <View style={styles.pctBadge}>
              <Text style={styles.pctText}>+5%</Text>
            </View>
          </View>
          <Text style={styles.statNumber}>{completedOrders.length || 24}</Text>
        </View>
      </View>

      {/* Motivation Card (Pink-Purple Gradient with 3D Trophy) */}
      <LinearGradient
        colors={['#FF3B98', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.motivationCard}
      >
        <Image
          source={require('../../../assets/store_trophy_icon.png')}
          style={styles.trophyIcon}
          resizeMode="contain"
        />
        <View style={styles.motivationTextWrapper}>
          <Text style={styles.motivationTitle}>Keep it up!</Text>
          <Text style={styles.motivationSubtitle}>
            Your performance is great today. Fulfilling 9-min SLA smoothly.
          </Text>
        </View>
      </LinearGradient>

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
              ctaColor="#F59E0B"
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
            <Ionicons name="checkmark-done-circle" size={44} color="#13B978" />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyDesc}>No orders currently waiting in queue.</Text>
            <Text style={styles.emptyAreaNote}>
              Live orders from <Text style={{ color: '#FF3B98', fontWeight: '800' }}>{areaName}</Text> customers appear here instantly.
            </Text>
          </View>
        ) : (
          incomingOrders.slice(0, 3).map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              ctaText="START PICKING"
              ctaColor="#FF3B98"
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  servingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  servingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  servingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 59, 152, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  servingValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
    marginTop: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#13B978',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pctBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pctText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#071B52',
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    gap: 14,
    shadowColor: '#FF3B98',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  trophyIcon: {
    width: 52,
    height: 52,
  },
  motivationTextWrapper: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  motivationSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
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
    color: '#071B52',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: '#FF3B98',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  seeAllText: {
    color: '#FF3B98',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    color: '#071B52',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  emptyAreaNote: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
});
