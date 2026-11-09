import React, { useEffect } from 'react';
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
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
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
    completedOrders,
    setCurrentTab,
    setSubScreen,
    acceptOrderAndStartPick,
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
      : 'Chandlodiya - Tragad');

  const storeDisplayName =
    store?.name || `Wom Up ${areaName}`;

  const handleRefresh = async () => {
    await Promise.all([
      refreshIncoming(),
      refreshPicking(),
      refreshReady(),
      refreshCompletedOrders(),
    ]);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  const todayOrderCount =
    performance?.todayPicked ?? (incomingOrders.length + pickingOrders.length);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor="#F52B99"
          colors={['#F52B99']}
        />
      }
    >
      {/* SECTION 2: STORE IDENTITY CARD */}
      <View style={styles.storeCard}>
        <View style={styles.storeCardLeft}>
          <View style={styles.storeImageWrapper}>
            <Image
              source={require('../../../assets/DarkStoretop.png')}
              style={styles.storeImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.storeInfoText}>
            <Text style={styles.storeCardSubtitle}>DARK STORE FULFILLMENT HUB</Text>
            <Text style={styles.storeCardTitle} numberOfLines={2}>
              {storeDisplayName}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.onlinePill}
          activeOpacity={0.8}
          onPress={() => setSubScreen('StoreInfo')}
          accessibilityLabel="Store is online. View details."
        >
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
          <Ionicons name="chevron-forward" size={12} color="#065F46" />
        </TouchableOpacity>
      </View>

      {/* SECTION 3 - 6: FOUR KPI CARDS (2x2 Grid) */}
      <View style={styles.kpiGrid}>
        {/* Card 1: Today's Orders */}
        <TouchableOpacity
          style={[styles.kpiCard, styles.kpiCardPink]}
          activeOpacity={0.85}
          onPress={() => setCurrentTab('Incoming')}
        >
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#FDE7F3' }]}>
              <Ionicons name="cart" size={17} color="#F52B99" />
            </View>
            <View style={styles.kpiLabelValueCol}>
              <Text style={styles.kpiLabel}>Today's Orders</Text>
              <Text style={styles.kpiValue}>{todayOrderCount}</Text>
            </View>
          </View>

          <View style={styles.kpiBottomRow}>
            <Text style={styles.kpiTrendText}>↑ +12% vs yesterday</Text>
            {/* Sparkline wave */}
            <View style={styles.sparklineContainer}>
              <Svg width={46} height={18} viewBox="0 0 46 18">
                <Path
                  d="M 2 14 Q 14 4 24 10 T 44 4"
                  fill="none"
                  stroke="#F52B99"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>

        {/* Card 2: Picking */}
        <TouchableOpacity
          style={[styles.kpiCard, styles.kpiCardPurple]}
          activeOpacity={0.85}
          onPress={() => setCurrentTab('Picking')}
        >
          <View style={styles.liveBadgeTopRight}>
            <Text style={styles.liveBadgeText}>⚡ Live</Text>
          </View>

          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="cube" size={17} color="#7031E8" />
            </View>
            <View style={styles.kpiLabelValueCol}>
              <Text style={styles.kpiLabel}>Picking</Text>
              <Text style={styles.kpiValue}>{pickingOrders.length}</Text>
            </View>
          </View>

          <View style={styles.kpiBottomRow}>
            <Text style={styles.kpiTrendText}>↑ 0%</Text>
            <View style={styles.sparklineContainer}>
              <Svg width={46} height={18} viewBox="0 0 46 18">
                <Path
                  d="M 2 14 Q 14 12 24 6 T 44 4"
                  fill="none"
                  stroke="#7031E8"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>

        {/* Card 3: Packing */}
        <TouchableOpacity
          style={[styles.kpiCard, styles.kpiCardBlue]}
          activeOpacity={0.85}
          onPress={() => setSubScreen('Packing')}
        >
          <View style={styles.liveBadgeTopRight}>
            <Text style={styles.liveBadgeText}>⚡ Live</Text>
          </View>

          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="bag-check" size={17} color="#278BFA" />
            </View>
            <View style={styles.kpiLabelValueCol}>
              <Text style={styles.kpiLabel}>Packing</Text>
              <Text style={styles.kpiValue}>{readyOrders.length}</Text>
            </View>
          </View>

          <View style={styles.kpiBottomRow}>
            <Text style={styles.kpiTrendText}>↑ 0%</Text>
            <View style={styles.sparklineContainer}>
              <Svg width={46} height={18} viewBox="0 0 46 18">
                <Path
                  d="M 2 12 Q 14 16 26 8 T 44 4"
                  fill="none"
                  stroke="#278BFA"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>

        {/* Card 4: Dispatched */}
        <TouchableOpacity
          style={[styles.kpiCard, styles.kpiCardPurple]}
          activeOpacity={0.85}
          onPress={() => setCurrentTab('History')}
        >
          <View style={styles.liveBadgeTopRight}>
            <Text style={styles.liveBadgeText}>⚡ Live</Text>
          </View>

          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="bicycle" size={18} color="#7031E8" />
            </View>
            <View style={styles.kpiLabelValueCol}>
              <Text style={styles.kpiLabel}>Dispatched</Text>
              <Text style={styles.kpiValue}>{completedOrders.length}</Text>
            </View>
          </View>

          <View style={styles.kpiBottomRow}>
            <Text style={styles.kpiTrendText}>↑ 0%</Text>
            <View style={styles.sparklineContainer}>
              <Svg width={46} height={18} viewBox="0 0 46 18">
                <Path
                  d="M 2 14 Q 16 4 26 12 T 44 4"
                  fill="none"
                  stroke="#7031E8"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* SECTION 7: PERFORMANCE ENCOURAGEMENT BANNER ("Keep it up! ⭐") */}
      <LinearGradient
        colors={['#FA35A5', '#A72CC7', '#5129ED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.9 }}
        style={styles.motivationBanner}
      >
        <Image
          source={require('../../../assets/waringicon_mirrored.png')}
          style={styles.megaphoneImage}
          resizeMode="contain"
        />
        <View style={styles.motivationContent}>
          <Text style={styles.motivationTitle}>Keep it up! ⭐</Text>
          <Text style={styles.motivationSubtitle}>
            Your performance is great today. Fulfilling 9-min SLA smoothly.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewDetailsBtn}
          activeOpacity={0.85}
          onPress={() => setSubScreen('Performance')}
        >
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* SECTION 8 & 9: INCOMING ORDERS SECTION & EMPTY STATE */}
      <View style={styles.incomingSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="flash" size={16} color="#F59E0B" />
            <Text style={styles.sectionHeading}>Incoming Orders</Text>
            {incomingOrders.length > 0 && (
              <View style={styles.incomingCountBadge}>
                <Text style={styles.incomingCountText}>{incomingOrders.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setCurrentTab('Incoming')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllActionText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {incomingOrders.length === 0 ? (
          /* SECTION 9: ALL CAUGHT UP EMPTY STATE */
          <View style={styles.emptyCardContainer}>
            <View style={styles.emptyBagWrapper}>
              <Image
                source={require('../../../assets/storecartimage.png')}
                style={styles.emptyBagImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.allCaughtUpTitle}>All Caught Up!</Text>
            <Text style={styles.allCaughtUpSubtitle}>
              No orders currently waiting in queue.
            </Text>

            <View style={styles.softPinkPill}>
              <Text style={styles.softPinkPillText}>
                💗 Live orders from <Text style={{ fontWeight: '800', color: '#F52B99' }}>{areaName}</Text> customers appear here instantly.
              </Text>
            </View>
          </View>
        ) : (
          /* Active Incoming Orders */
          <View style={styles.orderListWrap}>
            {incomingOrders.slice(0, 3).map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                ctaText="START PICKING"
                ctaColor="#F52B99"
                onPress={() => acceptOrderAndStartPick(order.orderId)}
              />
            ))}
          </View>
        )}
      </View>

      {/* SECTION 10 & 11: PERFORMANCE OVERVIEW & LIVE ACTIVITY */}
      <View style={styles.dualCardRow}>
        {/* Card A: Performance Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="bar-chart" size={16} color="#F52B99" />
            <Text style={styles.cardHeadingText}>Performance Overview</Text>
          </View>

          <View style={styles.gaugeLayoutRow}>
            {/* SVG Circular Gauge */}
            <View style={styles.gaugeCircleWrap}>
              <Svg width={88} height={88} viewBox="0 0 100 100">
                <Defs>
                  <SvgGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#FA35A5" />
                    <Stop offset="100%" stopColor="#7031E8" />
                  </SvgGradient>
                </Defs>
                {/* Track Circle */}
                <Circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#F3E8FF"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress Arc: ~85% circle */}
                <Circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40 * 0.85} ${2 * Math.PI * 40 * 0.15}`}
                  strokeDashoffset={2 * Math.PI * 40 * 0.25}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
              <View style={styles.gaugeInnerLabel}>
                <Text style={styles.gaugePercentText}>100%</Text>
                <Text style={styles.gaugeSublabel}>Order Flow</Text>
              </View>
            </View>

            {/* Checklist */}
            <View style={styles.checklistColumn}>
              <View style={styles.checkItem}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
                <Text style={styles.checkText}>Orders On Time</Text>
              </View>
              <View style={styles.checkItem}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
                <Text style={styles.checkText}>Packing On Time</Text>
              </View>
              <View style={styles.checkItem}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
                <Text style={styles.checkText}>Dispatch On Time</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Card B: Live Activity */}
        <View style={styles.activityCard}>
          <View style={styles.cardHeaderRowBetween}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="flash" size={16} color="#F59E0B" />
              <Text style={styles.cardHeadingText}>Live Activity</Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>⚡ Live</Text>
            </View>
          </View>

          {/* Activity Timeline */}
          <View style={styles.timelineContainer}>
            {/* Item 1 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeftCol}>
                <View style={[styles.timelineIconCircle, { backgroundColor: '#FDE7F3' }]}>
                  <Ionicons name="cart" size={12} color="#F52B99" />
                </View>
                <View style={styles.timelineConnectorLine} />
              </View>
              <View style={styles.timelineContentCol}>
                <Text style={styles.timelineTitle}>
                  {incomingOrders.length > 0
                    ? `Order #${incomingOrders[0].orderNumber || '001'} waiting`
                    : 'New order received'}
                </Text>
                <Text style={styles.timelineTime}>2m ago</Text>
              </View>
            </View>

            {/* Item 2 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeftCol}>
                <View style={[styles.timelineIconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="cube" size={12} color="#7031E8" />
                </View>
                <View style={styles.timelineConnectorLine} />
              </View>
              <View style={styles.timelineContentCol}>
                <Text style={styles.timelineTitle}>
                  {pickingOrders.length > 0
                    ? `Picking Order #${pickingOrders[0].orderNumber || '002'}`
                    : 'Order picked'}
                </Text>
                <Text style={styles.timelineTime}>5m ago</Text>
              </View>
            </View>

            {/* Item 3 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeftCol}>
                <View style={[styles.timelineIconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="bicycle" size={12} color="#7031E8" />
                </View>
              </View>
              <View style={styles.timelineContentCol}>
                <Text style={styles.timelineTitle}>
                  {completedOrders.length > 0
                    ? `Order #${completedOrders[0].orderNumber || '003'} dispatched`
                    : 'Order dispatched'}
                </Text>
                <Text style={styles.timelineTime}>7m ago</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 95, // Leaves clearance for the floating BottomNav
  },

  /* SECTION 2: Store Identity Card */
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 200, 231, 0.45)',
    shadowColor: '#4327C9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  storeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    gap: 10,
  },
  storeImageWrapper: {
    width: 52,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeImage: {
    width: 50,
    height: 46,
  },
  storeInfoText: {
    flex: 1,
    justifyContent: 'center',
  },
  storeCardSubtitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7031E8',
    letterSpacing: 0.5,
  },
  storeCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#101A4B',
    marginTop: 1,
    lineHeight: 18,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DDF8E9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    flexShrink: 0,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#24B96F',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },

  /* SECTION 3 - 6: 2x2 KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    width: '48.3%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#4327C9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    minHeight: 88,
    justifyContent: 'space-between',
  },
  kpiCardPink: {
    borderColor: 'rgba(245, 200, 231, 0.6)',
  },
  kpiCardPurple: {
    borderColor: 'rgba(228, 213, 255, 0.6)',
  },
  kpiCardBlue: {
    borderColor: 'rgba(186, 230, 253, 0.6)',
  },
  liveBadgeTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#DDF8E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#24B96F',
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kpiIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiLabelValueCol: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#697493',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#101A4B',
    lineHeight: 26,
    marginTop: 1,
  },
  kpiBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  kpiTrendText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#24B96F',
  },
  sparklineContainer: {
    width: 46,
    height: 18,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  /* SECTION 7: Motivation Banner */
  motivationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    gap: 10,
    shadowColor: '#FA35A5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  megaphoneImage: {
    width: 58,
    height: 58,
    flexShrink: 0,
  },
  motivationContent: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  motivationSubtitle: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 15,
  },
  viewDetailsBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    flexShrink: 0,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7031E8',
  },

  /* SECTION 8 & 9: Incoming Orders */
  incomingSection: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#101A4B',
  },
  incomingCountBadge: {
    backgroundColor: '#F52B99',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  incomingCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  viewAllActionText: {
    color: '#F52B99',
    fontSize: 12.5,
    fontWeight: '800',
  },
  emptyCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 200, 231, 0.45)',
    shadowColor: '#4327C9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyBagWrapper: {
    width: 130,
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyBagImage: {
    width: 125,
    height: 94,
  },
  allCaughtUpTitle: {
    color: '#101A4B',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 3,
  },
  allCaughtUpSubtitle: {
    color: '#697493',
    fontSize: 12.5,
    marginBottom: 12,
  },
  softPinkPill: {
    backgroundColor: '#FDF2F8',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  softPinkPillText: {
    color: '#697493',
    fontSize: 11.5,
    textAlign: 'center',
  },
  orderListWrap: {
    gap: 10,
  },

  /* SECTION 10 & 11: Dual Overview & Activity Cards */
  dualCardRow: {
    gap: 14,
    marginBottom: 14,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(228, 213, 255, 0.5)',
    shadowColor: '#4327C9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  cardHeaderRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeadingText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#101A4B',
  },
  gaugeLayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 12,
  },
  gaugeCircleWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeInnerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercentText: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#101A4B',
  },
  gaugeSublabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#697493',
  },
  checklistColumn: {
    gap: 8,
    flex: 1,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#24B96F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#101A4B',
  },

  /* Card B: Live Activity */
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(228, 213, 255, 0.5)',
    shadowColor: '#4327C9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  liveBadge: {
    backgroundColor: '#DDF8E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 40,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 26,
    marginRight: 10,
  },
  timelineIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#FCE7F3',
    marginVertical: 2,
  },
  timelineContentCol: {
    flex: 1,
    paddingTop: 2,
  },
  timelineTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#101A4B',
  },
  timelineTime: {
    fontSize: 10.5,
    color: '#929CB5',
    marginTop: 1,
  },
});
