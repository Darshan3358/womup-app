import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { AppIcon } from '../components/common/AppIcon';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { TeamService, TeamMember, MemberTransactionDetails } from '../services/teamService';

interface DrilldownEntry {
  userId: string;
  name: string;
  userCode: string;
}

export const MyTeamScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const { goBack, user } = useApp();

  // State
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_shopping'>('newest');
  const [sortModalVisible, setSortModalVisible] = useState<boolean>(false);

  // Drilldown stack (for "Show Member" navigation down the tree)
  const [drilldownStack, setDrilldownStack] = useState<DrilldownEntry[]>([]);

  // Team data
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [targetUserSponsorCode, setTargetUserSponsorCode] = useState<string>('');
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Transaction Modal state
  const [selectedMemberTx, setSelectedMemberTx] = useState<MemberTransactionDetails | null>(null);
  const [txModalVisible, setTxModalVisible] = useState<boolean>(false);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);
  const [txOrderFilter, setTxOrderFilter] = useState<'ALL' | 'HOME' | 'OFFLINE'>('ALL');

  // Search debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 400);
  };

  const currentTargetUserId = useMemo(() => {
    return drilldownStack.length > 0 ? drilldownStack[drilldownStack.length - 1].userId : undefined;
  }, [drilldownStack]);

  const currentTargetUserName = useMemo(() => {
    return drilldownStack.length > 0 ? drilldownStack[drilldownStack.length - 1].name : null;
  }, [drilldownStack]);

  // Fetch Team Members
  const fetchTeam = useCallback(
    async (isRefresh = false, nextPage = 1) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (nextPage > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await TeamService.getMyTeam({
          level: selectedLevel,
          search: debouncedSearch,
          sortBy,
          targetUserId: currentTargetUserId,
          page: nextPage,
          limit: 20,
        });

        if (res.success && res.data) {
          if (res.data.targetUser?.sponsorCode) {
            setTargetUserSponsorCode(res.data.targetUser.sponsorCode);
          }
          if (nextPage === 1) {
            setMembers(res.data.users);
          } else {
            setMembers((prev) => [...prev, ...res.data!.users]);
          }
          setTotalUsers(res.data.totalUsers);
          setLevelCounts(res.data.levelCounts || {});
          setPage(res.data.page);
          setTotalPages(res.data.totalPages);
        } else {
          Alert.alert('Error', res.message || 'Could not load team data');
        }
      } catch (err: any) {
        console.warn('Failed to fetch team members:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [selectedLevel, debouncedSearch, sortBy, currentTargetUserId]
  );

  useEffect(() => {
    setPage(1);
    fetchTeam(false, 1);
  }, [fetchTeam]);

  // Handle Load More
  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchTeam(false, page + 1);
    }
  };

  // Show Member (Drill down)
  const handleShowMember = (member: TeamMember) => {
    setDrilldownStack((prev) => [
      ...prev,
      {
        userId: member.id,
        name: member.name,
        userCode: member.userCode,
      },
    ]);
  };

  // Pop Drilldown stack
  const handlePopDrilldown = () => {
    setDrilldownStack((prev) => prev.slice(0, prev.length - 1));
  };

  // Reset to root team
  const handleResetToRoot = () => {
    setDrilldownStack([]);
  };

  // Show Transaction Details
  const handleShowTransaction = async (member: TeamMember) => {
    setLoadingTx(true);
    setTxModalVisible(true);
    setSelectedMemberTx(null);
    try {
      const res = await TeamService.getMemberTransactions(member.id);
      if (res.success && res.data) {
        setSelectedMemberTx(res.data);
      } else {
        Alert.alert('Notice', res.message || 'Could not fetch transaction details.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load transaction data.');
    } finally {
      setLoadingTx(false);
    }
  };

  // Levels for filter pills
  const levelFilterOptions = [
    { key: 'all', label: 'All', count: levelCounts.all ?? 0 },
    { key: '1', label: 'Level 1', count: levelCounts.l1 ?? 0 },
    { key: '2', label: 'Level 2', count: levelCounts.l2 ?? 0 },
    { key: '3', label: 'Level 3', count: levelCounts.l3 ?? 0 },
    { key: '4', label: 'Level 4', count: levelCounts.l4 ?? 0 },
    { key: '5', label: 'Level 5', count: levelCounts.l5 ?? 0 },
    { key: '6', label: 'Level 6', count: levelCounts.l6 ?? 0 },
    { key: '7', label: 'Level 7', count: levelCounts.l7 ?? 0 },
  ];

  // Render individual member card
  const renderMemberCard = ({ item }: { item: TeamMember }) => {
    return (
      <View style={styles.cardContainer}>
        {/* Top Header of Card: Avatar, Name & User ID Badge */}
        <View style={styles.cardTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.avatarInitial}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.memberName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{item.levelLabel}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.isActive ? styles.statusActive : styles.statusInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.isActive ? styles.statusActiveText : styles.statusInactiveText,
                  ]}
                >
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              {item.isVerified && (
                <View style={styles.verifiedBadge}>
                  <AppIcon name="check-circle" size={11} color={COLORS.success} />
                  <Text style={styles.verifiedBadgeText}>Verified</Text>
                </View>
              )}
            </View>
          </View>

          {/* User ID & Sponsor ID in top right corner */}
          <View style={styles.cardTopRightCol}>
            <View style={styles.userIdBadge}>
              <Text style={styles.userIdText}>{item.userCode}</Text>
            </View>
            {Boolean(item.sponsorCode) && (
              <View style={styles.sponsorBadge}>
                <Text style={styles.sponsorBadgeText}>
                  <Text style={styles.sponsorBadgeLabel}>Sponsor: </Text>
                  {item.sponsorCode}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Total Shopping Row */}
        <View style={styles.shoppingRow}>
          <View style={styles.shoppingLeft}>
            <AppIcon name="shopping-bag" size={16} color={COLORS.primary} />
            <Text style={styles.shoppingLabel}>Total Shopping:</Text>
          </View>
          <Text style={styles.shoppingAmount}>₹{item.totalShopping.toLocaleString('en-IN')}</Text>
        </View>

        {/* Bottom Actions: Show Member & Show Transaction */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.showMemberBtn}
            activeOpacity={0.8}
            onPress={() => handleShowMember(item)}
          >
            <AppIcon name="users" size={14} color={COLORS.primary} />
            <Text style={styles.showMemberText}>Show Member</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.showTxBtn}
            activeOpacity={0.8}
            onPress={() => handleShowTransaction(item)}
          >
            <AppIcon name="file-text" size={14} color="#0D9488" />
            <Text style={styles.showTxText}>Show Transaction</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={Platform.OS === 'android'} />
      {/* 1. Header */}
      <View style={[styles.header, { paddingTop: topInset + (Platform.OS === 'android' ? 10 : 8) }]}>
        <TouchableOpacity
          onPress={() => {
            if (drilldownStack.length > 0) {
              handlePopDrilldown();
            } else {
              goBack();
            }
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <AppIcon name="arrow-left" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {currentTargetUserName ? `Team of ${currentTargetUserName}` : 'My Team / My Network'}
          </Text>
          <Text style={styles.headerSubtitle}>Track your 7-level referrals & earnings</Text>
          {Boolean(targetUserSponsorCode || user?.sponsorCode) && (
            <View style={styles.headerSponsorRow}>
              <Text style={styles.headerSponsorLabel}>Sponsor ID: </Text>
              <Text style={styles.headerSponsorCode}>{targetUserSponsorCode || user?.sponsorCode}</Text>
            </View>
          )}
        </View>
        <View style={styles.networkStatBadge}>
          <AppIcon name="users" size={14} color={COLORS.primary} />
          <Text style={styles.networkStatText}>{totalUsers}</Text>
        </View>
      </View>

      {/* 1b. Drilldown Breadcrumb Banner */}
      {drilldownStack.length > 0 && (
        <View style={styles.breadcrumbBanner}>
          <Text style={styles.breadcrumbText} numberOfLines={1}>
            Viewing: <Text style={styles.breadcrumbHighlight}>{currentTargetUserName}</Text>
          </Text>
          <TouchableOpacity onPress={handleResetToRoot} style={styles.breadcrumbResetBtn}>
            <Text style={styles.breadcrumbResetText}>Back to My Team ✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Search & Sort Bar */}
      <View style={styles.searchSortContainer}>
        <View style={styles.searchInputWrapper}>
          <AppIcon name="search" size={18} color={COLORS.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Name or ID..."
            placeholderTextColor={COLORS.secondaryText}
            value={searchQuery}
            onChangeText={handleSearchChange}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity onPress={() => handleSearchChange('')} style={{ padding: 4 }}>
              <AppIcon name="x" size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Button */}
        <TouchableOpacity
          style={[styles.sortBtn, sortBy !== 'newest' && styles.sortBtnActive]}
          activeOpacity={0.8}
          onPress={() => setSortModalVisible(true)}
        >
          <AppIcon
            name="sliders"
            size={18}
            color={sortBy !== 'newest' ? COLORS.white : COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* 3. Level Filter Pills Horizontal Scroll */}
      <View style={styles.levelScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelScrollContent}
        >
          {levelFilterOptions.map((opt) => {
            const isSelected = selectedLevel === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.levelPill, isSelected && styles.levelPillSelected]}
                onPress={() => setSelectedLevel(opt.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.levelPillText, isSelected && styles.levelPillTextSelected]}>
                  {opt.label}
                </Text>
                {typeof opt.count === 'number' && (
                  <View
                    style={[styles.countBubble, isSelected && styles.countBubbleSelected]}
                  >
                    <Text
                      style={[styles.countBubbleText, isSelected && styles.countBubbleTextSelected]}
                    >
                      {opt.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Summary Counter */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          Total Users (<Text style={styles.summaryCount}>{totalUsers}</Text>)
        </Text>
        <Text style={styles.sortIndicatorText}>
          Sort: {sortBy === 'highest_shopping' ? 'Top Shopping' : sortBy === 'oldest' ? 'Oldest' : 'Newest'}
        </Text>
      </View>

      {/* 5. Members List */}
      {loading && page === 1 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Loading your team members...</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item, index) => `${item.id}_${item.level}_${index}`}
          renderItem={renderMemberCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTeam(true, 1)}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <AppIcon name="users" size={36} color={COLORS.secondaryText} />
              </View>
              <Text style={styles.emptyTitle}>No Members Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No team members matched "${searchQuery}".`
                  : selectedLevel !== 'all'
                  ? `No members found at ${selectedLevel.toUpperCase()}. Invite users using your referral code!`
                  : 'Start sharing your referral code to build your 7-level team!'}
              </Text>
            </View>
          }
        />
      )}

      {/* 6. Sort Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.sortModalBox}>
            <Text style={styles.sortModalTitle}>Sort Members By</Text>
            {[
              { key: 'newest', label: 'Newest Joined First' },
              { key: 'oldest', label: 'Oldest Joined First' },
              { key: 'highest_shopping', label: 'Highest Shopping Amount' },
            ].map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.sortOptionRow, sortBy === s.key && styles.sortOptionRowActive]}
                onPress={() => {
                  setSortBy(s.key as any);
                  setSortModalVisible(false);
                }}
              >
                <Text
                  style={[styles.sortOptionText, sortBy === s.key && styles.sortOptionTextActive]}
                >
                  {s.label}
                </Text>
                {sortBy === s.key && (
                  <AppIcon name="check" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 7. Show Transaction Modal */}
      <Modal
        visible={txModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTxModalVisible(false)}
      >
        <View style={styles.modalOverlayBottom}>
          <View style={styles.txModalContent}>
            {/* Modal Header */}
            <View style={styles.txModalHeader}>
              <View>
                <Text style={styles.txModalTitle}>Member Activity Ledger</Text>
                <Text style={styles.txModalSub}>
                  {selectedMemberTx?.member?.name || 'Loading details...'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setTxModalVisible(false)}
                style={styles.txModalCloseBtn}
              >
                <AppIcon name="x" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingTx ? (
              <View style={styles.txLoaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.txLoaderText}>Fetching transactions...</Text>
              </View>
            ) : selectedMemberTx ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.txScroll}>
                {/* Member Highlights Card */}
                <View style={styles.txStatsCard}>
                  <View style={styles.txStatBox}>
                    <Text style={styles.txStatLabel}>Total Shopping</Text>
                    <Text style={styles.txStatValue}>
                      ₹{selectedMemberTx.member.totalShopping.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.txStatDivider} />
                  <View style={styles.txStatBox}>
                    <Text style={styles.txStatLabel}>Points Redeemed</Text>
                    <Text style={[styles.txStatValue, { color: '#B45309' }]}>
                      🪙 {selectedMemberTx.member.totalPointsUsed || 0}
                    </Text>
                  </View>
                  <View style={styles.txStatDivider} />
                  <View style={styles.txStatBox}>
                    <Text style={styles.txStatLabel}>Your Income</Text>
                    <Text style={[styles.txStatValue, { color: COLORS.success }]}>
                      ₹{selectedMemberTx.member.totalIncomeGenerated.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Filter Tabs for Orders: All, Home Delivery, Offline Store */}
                <View style={styles.txTabContainer}>
                  <TouchableOpacity
                    style={[styles.txTabBtn, txOrderFilter === 'ALL' && styles.txTabBtnActive]}
                    onPress={() => setTxOrderFilter('ALL')}
                  >
                    <Text style={[styles.txTabText, txOrderFilter === 'ALL' && styles.txTabTextActive]}>
                      All Orders ({selectedMemberTx.shoppingOrders.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.txTabBtn, txOrderFilter === 'HOME' && styles.txTabBtnActive]}
                    onPress={() => setTxOrderFilter('HOME')}
                  >
                    <Text style={[styles.txTabText, txOrderFilter === 'HOME' && styles.txTabTextActive]}>
                      Home Delivery ({selectedMemberTx.member.homeOrdersCount || 0})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.txTabBtn, txOrderFilter === 'OFFLINE' && styles.txTabBtnActive]}
                    onPress={() => setTxOrderFilter('OFFLINE')}
                  >
                    <Text style={[styles.txTabText, txOrderFilter === 'OFFLINE' && styles.txTabTextActive]}>
                      Offline Store ({selectedMemberTx.member.offlineOrdersCount || 0})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Detail-Wise Orders List (Home Delivery & Offline Store) */}
                <Text style={styles.txSectionHeader}>Order & Points Details</Text>
                {(() => {
                  const filteredOrders = selectedMemberTx.shoppingOrders.filter((ord) => {
                    if (txOrderFilter === 'HOME') return ord.orderType === 'HOME_DELIVERY';
                    if (txOrderFilter === 'OFFLINE') return ord.orderType === 'OFFLINE_STORE';
                    return true;
                  });

                  if (filteredOrders.length === 0) {
                    return (
                      <View style={styles.txEmptyBlock}>
                        <Text style={styles.txEmptyText}>
                          {txOrderFilter === 'HOME'
                            ? 'No home delivery orders found for this member.'
                            : txOrderFilter === 'OFFLINE'
                            ? 'No offline store purchases recorded for this member.'
                            : 'No orders recorded yet.'}
                        </Text>
                      </View>
                    );
                  }

                  return filteredOrders.map((ord, idx) => {
                    const isHome = ord.orderType === 'HOME_DELIVERY';
                    return (
                      <View key={ord.id || idx} style={styles.orderDetailCard}>
                        {/* Top: Order Type Badge & Order ID */}
                        <View style={styles.orderDetailTop}>
                          <View
                            style={[
                              styles.orderTypeBadge,
                              isHome ? styles.orderTypeHome : styles.orderTypeOffline,
                            ]}
                          >
                            <Text
                              style={[
                                styles.orderTypeBadgeText,
                                isHome ? styles.orderTypeHomeText : styles.orderTypeOfflineText,
                              ]}
                            >
                              {ord.orderTypeLabel}
                            </Text>
                          </View>
                          <Text style={styles.orderDetailId}>{ord.orderNumber}</Text>
                        </View>

                        {/* Store / Destination & Date */}
                        <View style={styles.orderStoreRow}>
                          <Text style={styles.orderStoreName} numberOfLines={1}>
                            {ord.storeName}
                          </Text>
                          <Text style={styles.orderDetailDate}>
                            {new Date(ord.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>

                        {/* Divider */}
                        <View style={styles.orderCardDivider} />

                        {/* Order Amount & Points Used */}
                        <View style={styles.orderAmountAndPointsRow}>
                          <View>
                            <Text style={styles.orderAmountLabel}>Order Amount</Text>
                            <Text style={styles.orderAmountValue}>₹{ord.amount.toLocaleString('en-IN')}</Text>
                          </View>

                          <View style={styles.pointsBadgeWrapper}>
                            <Text style={styles.pointsLabel}>Points Used</Text>
                            <View
                              style={[
                                styles.pointsUsedPill,
                                ord.pointsUsed > 0 ? styles.pointsUsedPositive : styles.pointsUsedZero,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.pointsUsedPillText,
                                  ord.pointsUsed > 0 ? styles.pointsPositiveText : styles.pointsZeroText,
                                ]}
                              >
                                {ord.pointsUsed > 0
                                  ? `🪙 ${ord.pointsUsed} Points (-₹${ord.pointsUsed})`
                                  : '0 Points Used'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  });
                })()}

                {/* Earnings from this Member Section */}
                <Text style={[styles.txSectionHeader, { marginTop: 18 }]}>
                  Referral & Level Earnings from this Member
                </Text>
                {selectedMemberTx.incomeTransactions.length === 0 ? (
                  <View style={styles.txEmptyBlock}>
                    <Text style={styles.txEmptyText}>No direct income transactions recorded yet.</Text>
                  </View>
                ) : (
                  selectedMemberTx.incomeTransactions.map((tx) => (
                    <View key={tx.id} style={styles.txItemCard}>
                      <View style={styles.txItemLeft}>
                        <View style={styles.txIconCircle}>
                          <AppIcon name="arrow-down-left" size={16} color={COLORS.success} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.txItemDesc}>{tx.description}</Text>
                          <Text style={styles.txItemDate}>
                            {new Date(tx.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.txItemRight}>
                        <Text style={styles.txItemAmount}>+₹{tx.amount}</Text>
                        <Text
                          style={[
                            styles.txItemStatus,
                            tx.status === 'AVAILABLE' ? styles.txAvailable : styles.txPending,
                          ]}
                        >
                          {tx.status}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.headingMd,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  networkStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  networkStatText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  breadcrumbBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  breadcrumbHighlight: {
    fontWeight: '700',
    color: '#78350F',
  },
  breadcrumbResetBtn: {
    marginLeft: 8,
  },
  breadcrumbResetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  searchSortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  sortBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortBtnActive: {
    backgroundColor: COLORS.primary,
  },
  levelScrollWrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  levelScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  levelPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  levelPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  levelPillTextSelected: {
    color: COLORS.white,
  },
  countBubble: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  countBubbleSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  countBubbleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },
  countBubbleTextSelected: {
    color: COLORS.white,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  summaryCount: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  sortIndicatorText: {
    fontSize: 12,
    color: COLORS.secondaryText,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  nameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  levelBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusActiveText: {
    color: COLORS.success,
  },
  statusInactiveText: {
    color: COLORS.secondaryText,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
  },
  cardTopRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  userIdBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  userIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  sponsorBadge: {
    backgroundColor: '#FDF4FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F0ABFC',
  },
  sponsorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#86198F',
  },
  sponsorBadgeLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#A21CAF',
  },
  headerSponsorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  headerSponsorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  headerSponsorCode: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  shoppingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shoppingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shoppingLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  shoppingAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  showMemberBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  showMemberText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  showTxBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  showTxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loaderText: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 12,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sortModalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  sortModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sortOptionRowActive: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  sortOptionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sortOptionTextActive: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  txModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  txModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  txModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  txModalSub: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  txModalCloseBtn: {
    padding: 6,
  },
  txLoaderContainer: {
    padding: 50,
    alignItems: 'center',
  },
  txLoaderText: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 12,
  },
  txScroll: {
    padding: 16,
  },
  txStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  txStatDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  txStatLabel: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginBottom: 4,
  },
  txStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  txSectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 8,
  },
  txEmptyBlock: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  txEmptyText: {
    fontSize: 12,
    color: COLORS.secondaryText,
  },
  txItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  txItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txItemDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  txItemDate: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  txItemRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  txItemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  txItemStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  txAvailable: {
    backgroundColor: '#ECFDF5',
    color: COLORS.success,
  },
  txPending: {
    backgroundColor: '#FFFBEB',
    color: '#D97706',
  },
  txTabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  txTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txTabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  txTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  txTabTextActive: {
    color: COLORS.white,
  },
  orderDetailCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  orderDetailTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderTypeHome: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  orderTypeOffline: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  orderTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderTypeHomeText: {
    color: '#1D4ED8',
  },
  orderTypeOfflineText: {
    color: '#0F766E',
  },
  orderDetailId: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  orderStoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderStoreName: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondaryText,
    flex: 1,
    marginRight: 8,
  },
  orderDetailDate: {
    fontSize: 11,
    color: COLORS.secondaryText,
  },
  orderCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  orderAmountAndPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  orderAmountLabel: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginBottom: 2,
  },
  orderAmountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  pointsBadgeWrapper: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginBottom: 2,
  },
  pointsUsedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pointsUsedPositive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pointsUsedZero: {
    backgroundColor: '#F1F5F9',
  },
  pointsUsedPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pointsPositiveText: {
    color: '#B45309',
  },
  pointsZeroText: {
    color: COLORS.secondaryText,
  },
});
