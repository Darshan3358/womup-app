import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import {
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Eye,
  X,
  Check,
  RefreshCw,
  Phone,
  User,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { DateRangeFilter, DateFilterRange } from '../components/common/DateRangeFilter';
import { approvalService } from '../services/approvalService';
import { NEST_API_BASE_URL } from '../services/api';

export const GpsLocationRequestsScreen: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateFilterRange>({ preset: 'All Time' });

  // Proof Image Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Reject Modal
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await approvalService.getCategoryQueue('pincode-changes', {
        search: searchQuery,
      });
      setRequests(res.items || []);
    } catch (e) {
      console.warn('Failed loading GPS requests:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (item: any) => {
    const confirmMsg = `Approve pincode change for ${item.name} to ${item.code?.split('➔')[1]?.trim() || 'requested pincode'}? Their profile & MLM eligibility will be updated directly.`;
    
    const proceed = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? window.confirm(confirmMsg) : true)
      : await new Promise((resolve) => {
          Alert.alert('Approve Pincode Change', confirmMsg, [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Approve & Update', onPress: () => resolve(true) },
          ]);
        });

    if (!proceed) return;

    try {
      setActionLoading(true);
      await approvalService.approveItem('pincode-changes', item.id, {
        notes: 'Approved by admin via GPS Location Request console',
      });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Approved! Pincode updated directly for ${item.name}.`);
      } else {
        Alert.alert('Approved!', `Pincode updated directly for ${item.name}.`);
      }
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Approval Error', err.message || 'Failed approving request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingItem) return;
    try {
      setActionLoading(true);
      await approvalService.rejectItem(
        'pincode-changes',
        rejectingItem.id,
        { reason: rejectReason || 'Address proof mismatch' }
      );
      setRejectingItem(null);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Rejection Error', err.message || 'Failed rejecting request');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests by Tab & Search
  const filteredRequests = requests.filter((r) => {
    if (activeTab !== 'ALL' && r.status !== activeTab) {
      if (activeTab === 'PENDING' && r.status && r.status !== 'PENDING') return false;
      if (activeTab !== 'PENDING' && r.status !== activeTab) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchPhone = (r.mobile || '').includes(q);
      const matchCode = (r.code || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCode) return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconBadge}>
            <MapPin size={20} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.headerTitle}>GPS Location & Pincode Requests</Text>
            <Text style={styles.headerSubtitle}>
              Directly verify & update customer serviceable pincodes & coordinates
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchRequests} activeOpacity={0.7}>
          <RefreshCw size={15} color={COLORS.navy} />
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          const count = requests.filter((r) => (tab === 'ALL' ? true : r.status === tab)).length;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isSelected && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab === 'PENDING' ? '⏳ Pending' : tab === 'APPROVED' ? '✅ Approved' : tab === 'REJECTED' ? '❌ Rejected' : 'All'}
              </Text>
              <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search & Date Filter */}
      <View style={styles.controlsBar}>
        <View style={styles.searchBox}>
          <Search size={15} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer name, phone, or pincode..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <DateRangeFilter currentPreset={dateRange.preset} onFilterChange={setDateRange} compact />
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading GPS & pincode change requests...</Text>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MapPin size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Requests Found</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'PENDING'
              ? 'There are no pending GPS location or pincode change requests at this moment.'
              : 'No requests matched your filter criteria.'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
          {filteredRequests.map((item) => {
            const isPending = item.status === 'PENDING';
            const docs = item.documents || [];
            const proofDoc = docs[0];

            return (
              <View key={item.id} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <User size={15} color={COLORS.navy} />
                      <Text style={styles.customerName}>{item.name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          item.status === 'APPROVED' && styles.statusBadgeApproved,
                          item.status === 'REJECTED' && styles.statusBadgeRejected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            item.status === 'APPROVED' && styles.statusBadgeTextApproved,
                            item.status === 'REJECTED' && styles.statusBadgeTextRejected,
                          ]}
                        >
                          {item.status || 'PENDING'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.contactRow}>
                      <Phone size={12} color="#64748B" />
                      <Text style={styles.phoneText}>{item.mobile || 'No Phone'}</Text>
                      {item.submittedAt ? (
                        <>
                          <Text style={styles.dot}>•</Text>
                          <Clock size={12} color="#64748B" />
                          <Text style={styles.timeText}>
                            {new Date(item.submittedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* Pincode Change Comparison Banner */}
                <View style={styles.pincodeBox}>
                  <View style={styles.pincodeCol}>
                    <Text style={styles.pincodeLabel}>Current Pincode</Text>
                    <Text style={styles.oldPincode}>
                      {item.code?.split('➔')[0]?.trim() || 'N/A'}
                    </Text>
                  </View>
                  <Text style={styles.arrowIcon}>➔</Text>
                  <View style={styles.pincodeCol}>
                    <Text style={styles.pincodeLabel}>Requested New Pincode</Text>
                    <Text style={styles.newPincode}>
                      {item.code?.split('➔')[1]?.trim() || item.code}
                    </Text>
                  </View>
                </View>

                {/* Proof & Notes */}
                <View style={styles.proofRow}>
                  {proofDoc?.url ? (
                    <TouchableOpacity
                      style={styles.proofBtn}
                      onPress={() => setPreviewImageUrl(proofDoc.url)}
                      activeOpacity={0.8}
                    >
                      <Eye size={13} color="#0284C7" />
                      <Text style={styles.proofBtnText}>View Proof Document</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noProofTag}>
                      <FileText size={12} color="#94A3B8" />
                      <Text style={styles.noProofText}>No Proof Attached</Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                {isPending && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApprove(item)}
                      disabled={actionLoading}
                      activeOpacity={0.8}
                    >
                      <Check size={16} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve & Update Pincode</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => {
                        setRejectingItem(item);
                        setRejectReason('');
                      }}
                      disabled={actionLoading}
                      activeOpacity={0.8}
                    >
                      <X size={16} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Proof Image Viewer Modal */}
      <Modal
        visible={!!previewImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUrl(null)}
      >
        <View style={styles.imageModalBackdrop}>
          <View style={styles.imageModalContent}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>Address Proof Document</Text>
              <TouchableOpacity onPress={() => setPreviewImageUrl(null)}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {previewImageUrl && (
              <Image
                source={{ uri: previewImageUrl }}
                style={styles.fullProofImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={!!rejectingItem}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectingItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.rejectModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Pincode Change</Text>
              <TouchableOpacity onPress={() => setRejectingItem(null)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.rejectSubtitle}>
              Please provide a reason for rejecting {rejectingItem?.name}'s request:
            </Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="e.g. Invalid address proof document or outside service area"
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRejectingItem(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmRejectBtn}
                onPress={handleReject}
                disabled={actionLoading}
              >
                <Text style={styles.confirmRejectText}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0284C7',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  tabBadgeActive: {
    backgroundColor: '#E0F2FE',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBadgeTextActive: {
    color: '#0284C7',
  },
  controlsBar: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
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
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    gap: 12,
  },
  requestCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
  },
  statusBadgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  statusBadgeTextApproved: {
    color: '#15803D',
  },
  statusBadgeTextRejected: {
    color: '#B91C1C',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  dot: {
    color: '#94A3B8',
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
  },
  pincodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F0F9FF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  pincodeCol: {
    alignItems: 'center',
  },
  pincodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
  },
  oldPincode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
    marginTop: 2,
  },
  newPincode: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0284C7',
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#0284C7',
    fontWeight: '900',
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  proofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  proofBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  noProofTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noProofText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 10,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  imageModalContent: {
    width: '100%',
    maxWidth: 600,
    height: '80%',
    backgroundColor: '#1E293B',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  imageModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fullProofImage: {
    flex: 1,
    width: '100%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rejectModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  rejectSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  rejectInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  rejectModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  confirmRejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#DC2626',
  },
  confirmRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
