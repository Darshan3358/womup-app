import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  FolderTree,
  Search,
  User,
  Users,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Award,
  Phone,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { NEST_API_BASE_URL } from '../services/api';

export const ReferralTreeScreen: React.FC = () => {
  const { customers } = useAdminState();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [treeData, setTreeData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({ 1: true });

  // Initial customer default: first customer or admin sponsor
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      const firstCust = customers[0];
      const custId = (firstCust as any)._id || firstCust.id;
      setSelectedCustomerId(custId);
    }
  }, [customers, selectedCustomerId]);

  const fetchTree = useCallback(async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`${NEST_API_BASE_URL}/admin/customers/${id}/sponsor-tree`);
      if (res.ok) {
        const data = await res.json();
        setTreeData(data);
      } else {
        // Try fallback to team dashboard endpoint
        const teamRes = await fetch(`${NEST_API_BASE_URL}/admin/customers/${id}/team-dashboard`);
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTreeData(teamData.data || teamData);
        }
      }
    } catch (e) {
      console.warn('Failed fetching sponsor tree:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchTree(selectedCustomerId);
    }
  }, [selectedCustomerId, fetchTree]);

  const handleSearchUser = () => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase();
    const matched = customers.find(
      (c) =>
        c.phone.includes(q) ||
        (c.referralCode && c.referralCode.toLowerCase() === q) ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase() === q ||
        ((c as any)._id && (c as any)._id.toLowerCase() === q)
    );

    if (matched) {
      const matchId = (matched as any)._id || matched.id;
      setSelectedCustomerId(matchId);
    } else {
      Alert.alert(
        'Customer Not Found in Cache',
        `Searching database for "${searchQuery}"...`,
        [
          {
            text: 'OK',
            onPress: () => fetchTree(searchQuery.trim()),
          },
        ]
      );
    }
  };

  const toggleLevel = (lvlNum: number) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [lvlNum]: !prev[lvlNum],
    }));
  };

  const rootCustomer = treeData?.customer;
  const levels = treeData?.levels || [];
  const totalTeamSize = levels.reduce((acc: number, l: any) => acc + (l.count || l.members?.length || 0), 0);
  const totalActiveDownline = levels.reduce((acc: number, l: any) => {
    const activeInLvl = (l.members || []).filter((m: any) => m.isActiveMember || (m.monthlyPurchaseValue || 0) >= 2000).length;
    return acc + activeInLvl;
  }, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <FolderTree size={20} color={COLORS.purple} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Customer Referral Tree Explorer</Text>
            <Text style={styles.headerSubtitle}>
              Inspect complete 7-level multi-tier downline hierarchy & GMVs
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => selectedCustomerId && fetchTree(selectedCustomerId)}
          activeOpacity={0.7}
        >
          <RefreshCw size={14} color={COLORS.navy} />
          <Text style={styles.refreshBtnText}>Reload</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar for Any User */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={15} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Mobile (e.g. 9825000099), WOM ID, or Referral Code..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchUser}
          />
          <TouchableOpacity style={styles.lookupBtn} onPress={handleSearchUser}>
            <Text style={styles.lookupBtnText}>Inspect Tree</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Customer Selection Horizontal Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChips}>
          <Text style={styles.chipsLabel}>Quick Select:</Text>
          {customers.slice(0, 10).map((c) => {
            const cId = (c as any)._id || c.id;
            const isSel = selectedCustomerId === cId;
            return (
              <TouchableOpacity
                key={cId}
                style={[styles.userChip, isSel && styles.userChipActive]}
                onPress={() => setSelectedCustomerId(cId)}
              >
                <Text style={[styles.userChipText, isSel && styles.userChipTextActive]}>
                  {c.name} ({c.referralCode || c.phone.slice(-4)})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tree View Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.purple} />
          <Text style={styles.loadingText}>Building 7-level referral hierarchy...</Text>
        </View>
      ) : !rootCustomer ? (
        <View style={styles.emptyContainer}>
          <FolderTree size={40} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Select a Customer to View Referral Tree</Text>
          <Text style={styles.emptyText}>
            Use the search bar above or choose a user from the quick chips.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent}>
          {/* Root User Profile Card */}
          <View style={styles.rootCard}>
            <View style={styles.rootHeaderRow}>
              <View style={styles.rootAvatarBox}>
                <User size={22} color={COLORS.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.rootName}>{rootCustomer.name}</Text>
                  <View style={styles.referralCodeBadge}>
                    <Text style={styles.referralCodeText}>{rootCustomer.referralCode}</Text>
                  </View>
                </View>
                <Text style={styles.uplineText}>
                  Sponsor Upline: <Text style={{ fontWeight: '800', color: COLORS.navy }}>{rootCustomer.sponsorName || 'Master'}</Text> ({rootCustomer.sponsorCode || 'ROOT'})
                </Text>
              </View>
            </View>

            {/* Quick Metrics */}
            <View style={styles.rootMetricsRow}>
              <View style={styles.rootMetricBox}>
                <Text style={styles.rootMetricLabel}>Total Team Size</Text>
                <Text style={[styles.rootMetricValue, { color: COLORS.purple }]}>
                  {totalTeamSize} Members
                </Text>
              </View>

              <View style={styles.rootMetricBox}>
                <Text style={styles.rootMetricLabel}>Active Downline (₹2,000+)</Text>
                <Text style={[styles.rootMetricValue, { color: '#16A34A' }]}>
                  {totalActiveDownline} Active
                </Text>
              </View>

              <View style={styles.rootMetricBox}>
                <Text style={styles.rootMetricLabel}>Direct L1 Referrals</Text>
                <Text style={[styles.rootMetricValue, { color: '#2563EB' }]}>
                  {levels[0]?.count || levels[0]?.members?.length || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* 7-Level Downline Accordion */}
          <Text style={styles.sectionTitle}>7-LEVEL REFERRAL BREAKDOWN</Text>

          {levels.map((lvl: any, idx: number) => {
            const lvlNum = lvl.level || idx + 1;
            const isExpanded = !!expandedLevels[lvlNum];
            const members = lvl.members || [];
            const activeCount = members.filter((m: any) => m.isActiveMember || (m.monthlyPurchaseValue || 0) >= 2000).length;
            const levelGmv = members.reduce((sum: number, m: any) => sum + (m.monthlyPurchaseValue || 0), 0);

            return (
              <View key={lvlNum} style={styles.levelCard}>
                <TouchableOpacity
                  style={styles.levelHeader}
                  onPress={() => toggleLevel(lvlNum)}
                  activeOpacity={0.8}
                >
                  <View style={styles.levelHeaderLeft}>
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(lvlNum) }]}>
                      <Text style={styles.levelBadgeText}>L{lvlNum}</Text>
                    </View>
                    <View>
                      <Text style={styles.levelTitle}>
                        Level {lvlNum} Downline
                      </Text>
                      <Text style={styles.levelSub}>
                        {members.length} members • {activeCount} active (₹2k+) • Total GMV: ₹{levelGmv.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.levelHeaderRight}>
                    {isExpanded ? (
                      <ChevronDown size={18} color="#64748B" />
                    ) : (
                      <ChevronRight size={18} color="#64748B" />
                    )}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.levelBody}>
                    {members.length === 0 ? (
                      <Text style={styles.noMembersText}>No members registered in Level {lvlNum} yet.</Text>
                    ) : (
                      members.map((m: any) => {
                        const mId = m.id || m._id;
                        const isSpendActive = m.isActiveMember || (m.monthlyPurchaseValue || 0) >= 2000;
                        const memberIdCode = m.referralCode || m.memberCode || 'N/A';
                        const sponsorCode = m.sponsorCode || 'ROOT';

                        return (
                          <View key={mId} style={styles.memberRow}>
                            <View style={styles.memberLeft}>
                              <View style={styles.memberAvatarCircle}>
                                <User size={13} color="#64748B" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <Text style={styles.memberName}>{m.name}</Text>
                                  <View
                                    style={[
                                      styles.activeTag,
                                      isSpendActive ? styles.activeTagGreen : styles.activeTagGray,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.activeTagText,
                                        isSpendActive ? styles.activeTagTextGreen : styles.activeTagTextGray,
                                      ]}
                                    >
                                      {isSpendActive ? '🟢 ACTIVE' : '⚪ INACTIVE'}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.memberSubRow}>
                                  <Phone size={10} color="#94A3B8" />
                                  <Text style={styles.memberPhone}>{m.phone || 'No Phone'}</Text>
                                  <Text style={styles.dot}>•</Text>
                                  <Text style={styles.memberCode}>ID: {memberIdCode}</Text>
                                </View>
                                <View style={styles.sponsorBadgeRow}>
                                  <Text style={styles.sponsorBadgeLabel}>Sponsor ID:</Text>
                                  <View style={styles.sponsorBadge}>
                                    <Text style={styles.sponsorBadgeText}>{sponsorCode}</Text>
                                  </View>
                                  {Boolean(m.sponsorName) && (
                                    <Text style={styles.sponsorNameText} numberOfLines={1}>
                                      • {m.sponsorName}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            </View>

                            <View style={styles.memberRight}>
                              <Text style={styles.memberSpend}>
                                ₹{(m.monthlyPurchaseValue || 0).toLocaleString()}
                              </Text>
                              <TouchableOpacity
                                style={styles.inspectBtn}
                                onPress={() => setSelectedCustomerId(mId)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.inspectBtnText}>Tree</Text>
                                <ArrowRight size={10} color={COLORS.purple} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

function getLevelColor(lvl: number) {
  switch (lvl) {
    case 1:
      return '#7C3AED';
    case 2:
      return '#2563EB';
    case 3:
      return '#059669';
    case 4:
      return '#D97706';
    case 5:
      return '#DC2626';
    case 6:
      return '#DB2777';
    case 7:
      return '#4B5563';
    default:
      return '#7C3AED';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
  },
  searchSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  lookupBtn: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  lookupBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  chipsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 4,
  },
  userChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: COLORS.purple,
  },
  userChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  userChipTextActive: {
    color: COLORS.purple,
    fontWeight: '800',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: 12,
  },
  rootCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: SPACING.md,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
      default: { elevation: 2 },
    }),
  },
  rootHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rootAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rootName: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.navy,
  },
  referralCodeBadge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  referralCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE185D',
  },
  uplineText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rootMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 12,
  },
  rootMetricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 10,
    alignItems: 'center',
  },
  rootMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  rootMetricValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  levelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  levelSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  levelHeaderRight: {
    paddingLeft: 8,
  },
  levelBody: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FAFAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noMembersText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  memberAvatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeTagGreen: {
    backgroundColor: '#DCFCE7',
  },
  activeTagGray: {
    backgroundColor: '#F1F5F9',
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  activeTagTextGreen: {
    color: '#15803D',
  },
  activeTagTextGray: {
    color: '#64748B',
  },
  memberSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  memberPhone: {
    fontSize: 11,
    color: '#64748B',
  },
  dot: {
    color: '#CBD5E1',
  },
  memberCode: {
    fontSize: 11,
    color: COLORS.purple,
    fontWeight: '600',
  },
  memberRight: {
    alignItems: 'flex-end',
  },
  memberSpend: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  inspectBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.purple,
  },
  sponsorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  sponsorBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  sponsorBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  sponsorBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7E22CE',
  },
  sponsorNameText: {
    fontSize: 10,
    color: '#64748B',
  },
});
