import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Phone,
  User,
  ShieldCheck,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { CustomerService } from '../../services/customerService';

interface CustomerLevelDetailModalProps {
  isOpen: boolean;
  customerId: string | null;
  customerName?: string;
  customerCode?: string;
  onClose: () => void;
}

interface MemberDetail {
  id: string;
  name: string;
  phone?: string;
  memberCode?: string;
  isActive?: boolean;
  isIncomeEligible?: boolean;
  registrationPincode?: string;
  monthlyPurchaseValue?: number;
  vegetableGMV?: number;
  otherGMV?: number;
  incomeEarned?: number;
}

interface LevelRow {
  level: number;
  memberCount: number;
  activeMemberCount: number;
  vegetableGMV: number;
  otherGMV: number;
  incomeEarned: number;
  members: MemberDetail[];
}

export const CustomerLevelDetailModal: React.FC<CustomerLevelDetailModalProps> = ({
  isOpen,
  customerId,
  customerName,
  customerCode,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({ 1: true });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      loadDashboard();
    } else {
      setDashboardData(null);
      setErrorMessage(null);
    }
  }, [isOpen, customerId]);

  const loadDashboard = async () => {
    if (!customerId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await CustomerService.getCustomerTeamDashboard(customerId);
      if (response && response.data) {
        setDashboardData(response.data);
      } else if (response && response.levels) {
        // Fallback structure from sponsor-tree
        const adaptedBreakdown: LevelRow[] = response.levels.map((lvl: any) => ({
          level: lvl.level,
          memberCount: lvl.count || (lvl.members ? lvl.members.length : 0),
          activeMemberCount: (lvl.members || []).filter((m: any) => m.isActiveMember || (m.monthlyPurchaseValue || 0) >= 2000).length,
          vegetableGMV: 0,
          otherGMV: 0,
          incomeEarned: 0,
          members: (lvl.members || []).map((m: any) => ({
            id: m.id || m._id,
            name: m.name || 'WormUp Member',
            phone: m.phone,
            memberCode: m.referralCode || m.sponsorCode,
            isActive: m.isActiveMember || (m.monthlyPurchaseValue || 0) >= 2000,
            monthlyPurchaseValue: m.monthlyPurchaseValue || 0,
            vegetableGMV: 0,
            otherGMV: 0,
            incomeEarned: 0,
          })),
        }));
        setDashboardData({
          levelBreakdown: adaptedBreakdown,
          personalStatus: {
            kycVerified: true,
            personalPurchase: 0,
            isPersonalActive: false,
            direct5ActiveCount: adaptedBreakdown[0]?.activeMemberCount || 0,
            isEligible: false,
            totalTeamSize: adaptedBreakdown.reduce((sum, l) => sum + l.memberCount, 0),
          },
          totals: {
            totalVegetableGMV: 0,
            totalOtherGMV: 0,
            totalPotentialIncome: 0,
          },
        });
      } else {
        setErrorMessage(response?.error || 'No downline team data found for this customer');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load level detail');
    } finally {
      setLoading(false);
    }
  };

  const toggleLevel = (lvl: number) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [lvl]: !prev[lvl],
    }));
  };

  if (!isOpen) return null;

  const personalStatus = dashboardData?.personalStatus;
  const totals = dashboardData?.totals || dashboardData?.teamSummary;
  const isKycVerified = Boolean(personalStatus?.kycVerified ?? personalStatus?.isPersonalKyc);
  const isPersonalActive = Boolean(personalStatus?.isPersonalActive);
  const personalPurchase = personalStatus?.personalPurchase ?? personalStatus?.monthlyPurchaseValue ?? 0;
  const isEligible = Boolean(personalStatus?.isEligible ?? personalStatus?.isEligibleForTeamIncome ?? dashboardData?.teamSummary?.isEligible);

  // Build 7 rows fallback if data is still loading or partially empty
  const levelBreakdown: LevelRow[] =
    dashboardData?.levelBreakdown ||
    [1, 2, 3, 4, 5, 6, 7].map((lvl) => ({
      level: lvl,
      memberCount: 0,
      activeMemberCount: 0,
      vegetableGMV: 0,
      otherGMV: 0,
      incomeEarned: 0,
      members: [],
    }));

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.headerTitle}>Team Performance</Text>
                {dashboardData && (
                  <View style={styles.badgeCode}>
                    <Text style={styles.badgeCodeText}>{customerCode || 'MEMBER'}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSub}>
                7-Level Downline & Real Income GMV
                {customerName ? ` • ${customerName}` : ''}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={loadDashboard}
                disabled={loading}
              >
                <RefreshCw size={18} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.purple} />
              <Text style={styles.loadingText}>Loading 7-level team breakdown...</Text>
            </View>
          ) : errorMessage && !dashboardData ? (
            <View style={styles.errorContainer}>
              <XCircle size={36} color="#DC2626" />
              <Text style={styles.errorTitle}>Could Not Load Levels</Text>
              <Text style={styles.errorSub}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadDashboard}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={{ paddingBottom: 32 }}
              showsVerticalScrollIndicator={true}
            >
              {/* Qualification / Status Metric Cards */}
              <View style={styles.qualificationGrid}>
                {/* 1. KYC Status */}
                <View style={styles.qualCard}>
                  <Text style={styles.qualLabel}>1. KYC Status</Text>
                  <View style={styles.qualRow}>
                    {isKycVerified ? (
                      <>
                        <CheckCircle2 size={13} color="#16A34A" />
                        <Text style={[styles.qualVal, { color: '#16A34A' }]}>Verified</Text>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} color="#DC2626" />
                        <Text style={[styles.qualVal, { color: '#DC2626' }]}>Pending</Text>
                      </>
                    )}
                  </View>
                </View>

                {/* 2. Personal Active */}
                <View style={styles.qualCard}>
                  <Text style={styles.qualLabel}>2. Personal Active</Text>
                  <View style={styles.qualRow}>
                    {isPersonalActive ? (
                      <>
                        <CheckCircle2 size={13} color="#16A34A" />
                        <Text style={[styles.qualVal, { color: '#16A34A' }]}>Active</Text>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} color="#DC2626" />
                        <Text style={[styles.qualVal, { color: '#DC2626' }]}>
                          ₹{personalPurchase}/2k
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* 3. Direct 5 Active */}
                <View style={styles.qualCard}>
                  <Text style={styles.qualLabel}>3. Direct 5 Active</Text>
                  <View style={styles.qualRow}>
                    {(personalStatus?.direct5ActiveCount ?? 0) >= 5 ? (
                      <>
                        <CheckCircle2 size={13} color="#16A34A" />
                        <Text style={[styles.qualVal, { color: '#16A34A' }]}>
                          {personalStatus?.direct5ActiveCount}/5 Active
                        </Text>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} color="#DC2626" />
                        <Text style={[styles.qualVal, { color: '#DC2626' }]}>
                          {personalStatus?.direct5ActiveCount ?? 0}/5
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* 4. 7-Level Team */}
                <View style={styles.qualCard}>
                  <Text style={styles.qualLabel}>7-Level Team</Text>
                  <View style={styles.qualRow}>
                    <Users size={13} color="#6D28D9" />
                    <Text style={[styles.qualVal, { color: '#6D28D9' }]}>
                      {personalStatus?.totalTeamSize ?? levelBreakdown.reduce((s, l) => s + l.memberCount, 0)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* GMV & Income Summary Card */}
              {totals && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Veg GMV (3%)</Text>
                    <Text style={[styles.summaryVal, { color: '#166534' }]}>
                      ₹{Number(totals.totalVegetableGMV || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Other GMV (0.4%)</Text>
                    <Text style={[styles.summaryVal, { color: '#1E40AF' }]}>
                      ₹{Number(totals.totalOtherGMV || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Income</Text>
                    <Text style={[styles.summaryVal, { color: '#0F172A', fontWeight: '900' }]}>
                      ₹{Number(totals.totalPotentialIncome || totals.earnedIncome || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              {/* 7-Level Breakdown Header */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>7-Level Breakdown</Text>
                {isEligible ? (
                  <View style={styles.statusUnlockedPill}>
                    <Unlock size={12} color="#16A34A" />
                    <Text style={styles.statusUnlockedText}>Unlocked & Eligible</Text>
                  </View>
                ) : (
                  <View style={styles.statusLockedPill}>
                    <Lock size={12} color="#D97706" />
                    <Text style={styles.statusLockedText}>Locked (Need Qualification)</Text>
                  </View>
                )}
              </View>
              <Text style={styles.sectionSubtitle}>
                Tap any level row to view individual downline members & GMV
              </Text>

              {/* 7-Level Table */}
              <View style={styles.levelTable}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thText, { width: 38 }]}>Lvl</Text>
                  <Text style={[styles.thText, { flex: 1.1 }]}>Members</Text>
                  <Text style={[styles.thText, { flex: 1.2 }]}>Veg GMV</Text>
                  <Text style={[styles.thText, { flex: 1.2 }]}>Other GMV</Text>
                  <Text style={[styles.thText, { flex: 1.1, textAlign: 'right' }]}>Income</Text>
                  <View style={{ width: 22 }} />
                </View>

                {/* Level Rows L1 - L7 */}
                {levelBreakdown.map((row) => {
                  const isExpanded = !!expandedLevels[row.level];
                  return (
                    <View key={row.level} style={styles.rowWrapper}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleLevel(row.level)}
                        style={[styles.tableRow, isExpanded && styles.tableRowExpanded]}
                      >
                        <Text style={[styles.tdText, styles.lvlBadge]}>
                          L{row.level}
                        </Text>
                        <View style={{ flex: 1.1 }}>
                          <Text style={[styles.tdText, { fontWeight: '700' }]}>
                            {row.memberCount}
                          </Text>
                          <Text style={styles.tdSub}>
                            {row.activeMemberCount} active
                          </Text>
                        </View>
                        <Text style={[styles.tdText, { flex: 1.2, color: '#166534', fontWeight: '600' }]}>
                          ₹{Number(row.vegetableGMV || 0).toFixed(2)}
                        </Text>
                        <Text style={[styles.tdText, { flex: 1.2, color: '#1E40AF', fontWeight: '600' }]}>
                          ₹{Number(row.otherGMV || 0).toFixed(2)}
                        </Text>
                        <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
                          <Text style={[styles.tdText, { fontWeight: '800', color: !isEligible ? '#64748B' : '#0F172A' }]}>
                            ₹{Number(row.incomeEarned || 0).toFixed(2)}
                          </Text>
                          {!isEligible && (
                            <Text style={styles.lockedTag}>🔒 Locked</Text>
                          )}
                        </View>
                        <View style={{ width: 22, alignItems: 'flex-end', justifyContent: 'center' }}>
                          {isExpanded ? (
                            <ChevronUp size={16} color="#6366F1" />
                          ) : (
                            <ChevronDown size={16} color="#94A3B8" />
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Accordion Member Details */}
                      {isExpanded && (
                        <View style={styles.membersBody}>
                          {row.members && row.members.length > 0 ? (
                            <>
                              <View style={styles.membersSummaryRow}>
                                <Text style={styles.membersSummaryTitle}>
                                  Level {row.level} Members ({row.members.length} total • {row.activeMemberCount} active)
                                </Text>
                                <Text style={styles.membersSummaryIncome}>
                                  Level Income: ₹{Number(row.incomeEarned || 0).toFixed(2)}
                                </Text>
                              </View>

                              {row.members.map((member, idx) => (
                                <View key={member.id || idx} style={styles.memberCard}>
                                  <View style={styles.memberTopRow}>
                                    <View style={{ flex: 1 }}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <Text style={styles.memberName} numberOfLines={1}>
                                          {member.name}
                                        </Text>
                                        <View style={[
                                          styles.activeBadge,
                                          member.isActive ? styles.activeBadgeGreen : styles.activeBadgeGrey
                                        ]}>
                                          <Text style={[
                                            styles.activeBadgeText,
                                            member.isActive ? styles.activeBadgeTextGreen : styles.activeBadgeTextGrey
                                          ]}>
                                            {member.isActive ? 'Active' : 'Inactive'}
                                          </Text>
                                        </View>
                                      </View>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                        <Text style={styles.memberCodeText}>
                                          ID: {member.memberCode || 'WOMUP'}
                                        </Text>
                                        {member.phone && (
                                          <Text style={styles.memberPhoneText}>
                                            📞 {member.phone}
                                          </Text>
                                        )}
                                      </View>
                                    </View>

                                    <View style={{ alignItems: 'flex-end' }}>
                                      <Text style={styles.memberIncomeLabel}>Income</Text>
                                      <Text style={styles.memberIncomeVal}>
                                        ₹{Number(member.incomeEarned || 0).toFixed(2)}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Member Spend Row */}
                                  <View style={styles.memberSpendRow}>
                                    <View style={styles.spendTag}>
                                      <Text style={styles.spendTagLabel}>Veg Purchase: </Text>
                                      <Text style={[styles.spendTagVal, { color: '#166534' }]}>
                                        ₹{Number(member.vegetableGMV || 0).toFixed(2)}
                                      </Text>
                                    </View>
                                    <View style={styles.spendTag}>
                                      <Text style={styles.spendTagLabel}>Other Purchase: </Text>
                                      <Text style={[styles.spendTagVal, { color: '#1E40AF' }]}>
                                        ₹{Number(member.otherGMV || 0).toFixed(2)}
                                      </Text>
                                    </View>
                                    <View style={styles.spendTag}>
                                      <Text style={styles.spendTagLabel}>Total: </Text>
                                      <Text style={[styles.spendTagVal, { color: '#0F172A', fontWeight: '700' }]}>
                                        ₹{Number(member.monthlyPurchaseValue || 0).toFixed(2)}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </>
                          ) : (
                            <View style={styles.emptyMembersBox}>
                              <Users size={28} color="#CBD5E1" />
                              <Text style={styles.emptyMembersText}>
                                No members joined at Level {row.level} yet.
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    ...Platform.select({
      web: {
        maxWidth: 720,
        alignSelf: 'center',
        width: '100%',
        borderRadius: 24,
        marginVertical: 'auto',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  badgeCode: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  errorSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollArea: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  qualificationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  qualCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qualLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  qualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qualVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusUnlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusUnlockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  statusLockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusLockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
    fontWeight: '500',
  },
  levelTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  rowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  tableRowExpanded: {
    backgroundColor: '#F8FAFC',
  },
  tdText: {
    fontSize: 12,
    color: '#0F172A',
  },
  tdSub: {
    fontSize: 9,
    color: '#64748B',
  },
  lvlBadge: {
    width: 38,
    fontWeight: '800',
    color: '#6366F1',
  },
  lockedTag: {
    fontSize: 9,
    color: '#D97706',
    fontWeight: '700',
  },
  membersBody: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 4,
  },
  membersSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  membersSummaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  membersSummaryIncome: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberCodeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  memberPhoneText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  activeBadgeGrey: {
    backgroundColor: '#F1F5F9',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeBadgeTextGreen: {
    color: '#16A34A',
  },
  activeBadgeTextGrey: {
    color: '#64748B',
  },
  memberIncomeLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  memberIncomeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  memberSpendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  spendTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spendTagLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  spendTagVal: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyMembersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  emptyMembersText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

