import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckSquare,
  Square,
  FileText,
  Check,
  X,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import {
  ApprovalCategoryKey,
  CATEGORY_CONFIGS,
} from './ApprovalCard';
import {
  approvalService,
  ApprovalQueueItem,
  ApprovalDocument,
} from '../../services/approvalService';
import { DocumentViewerModal } from './DocumentViewerModal';
import { ApproveModal } from './ApproveModal';
import { RejectModal } from './RejectModal';
import { VendorKycReviewModal } from '../../screens/modals/VendorKycReviewModal';

interface CategoryQueueViewProps {
  categoryKey: ApprovalCategoryKey;
  onBack: () => void;
  onRefreshSummary: () => void;
}

export const CategoryQueueView: React.FC<CategoryQueueViewProps> = ({
  categoryKey,
  onBack,
  onRefreshSummary,
}) => {
  const config = CATEGORY_CONFIGS[categoryKey];
  const [items, setItems] = useState<ApprovalQueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'HIGH'>('ALL');
  const [sortOrder, setSortOrder] = useState<'OLDEST' | 'NEWEST'>('OLDEST');

  // Modals state
  const [viewerDocs, setViewerDocs] = useState<ApprovalDocument[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [showViewer, setShowViewer] = useState<boolean>(false);

  const [activeItemForApprove, setActiveItemForApprove] = useState<ApprovalQueueItem | null>(null);
  const [activeItemForReject, setActiveItemForReject] = useState<ApprovalQueueItem | null>(null);
  const [reviewVendorId, setReviewVendorId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Fetch queue items
  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await approvalService.getCategoryQueue(categoryKey, { search });
      setItems(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [categoryKey, search]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Bulk selection toggles
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  // Open Document Viewer
  const handleOpenDocs = (docs: ApprovalDocument[], index = 0) => {
    if (!docs || docs.length === 0) {
      Alert.alert('No Documents', 'No uploaded document files found for this record.');
      return;
    }
    setViewerDocs(docs);
    setViewerIndex(index);
    setShowViewer(true);
  };

  // Approve single item
  const handleConfirmApprove = async (notes: string, extraData?: any) => {
    if (!activeItemForApprove) return;
    setActionLoading(true);
    try {
      await approvalService.approveItem(categoryKey, activeItemForApprove.id, {
        notes,
        extraData,
      });
      setItems((prev) => prev.filter((i) => i.id !== activeItemForApprove.id));
      setSelectedIds((prev) => prev.filter((id) => id !== activeItemForApprove.id));
      onRefreshSummary();
    } catch (err: any) {
      Alert.alert('Approval Failed', err.message || 'Could not approve record');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject single item
  const handleConfirmReject = async (reason: string, notes: string) => {
    if (!activeItemForReject) return;
    setActionLoading(true);
    try {
      await approvalService.rejectItem(categoryKey, activeItemForReject.id, {
        reason,
        notes,
      });
      setItems((prev) => prev.filter((i) => i.id !== activeItemForReject.id));
      setSelectedIds((prev) => prev.filter((id) => id !== activeItemForReject.id));
      onRefreshSummary();
    } catch (err: any) {
      Alert.alert('Rejection Failed', err.message || 'Could not reject record');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await approvalService.bulkAction({
        action: 'APPROVE',
        category: categoryKey,
        ids: selectedIds,
        notes: 'Bulk approved by Admin',
      });
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
      onRefreshSummary();
      Alert.alert('Success', `Approved ${selectedIds.length} items`);
    } catch (err: any) {
      Alert.alert('Bulk Action Error', err.message || 'Could not process bulk approval');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Reject
  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await approvalService.bulkAction({
        action: 'REJECT',
        category: categoryKey,
        ids: selectedIds,
        reason: 'Bulk rejection by Admin',
      });
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
      onRefreshSummary();
      Alert.alert('Success', `Rejected ${selectedIds.length} items`);
    } catch (err: any) {
      Alert.alert('Bulk Action Error', err.message || 'Could not process bulk rejection');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered & Sorted items
  const filteredItems = items
    .filter((i) => {
      if (filterPriority === 'HIGH' && i.priority !== 'HIGH') return false;
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.submittedAt).getTime();
      const timeB = new Date(b.submittedAt).getTime();
      return sortOrder === 'OLDEST' ? timeA - timeB : timeB - timeA;
    });

  return (
    <View style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={16} color={COLORS.navy} />
          <Text style={styles.backBtnText}>Hub</Text>
        </TouchableOpacity>

        <View style={styles.navTitleRow}>
          <Text style={styles.navTitle} numberOfLines={1} ellipsizeMode="tail">
            {config.title} Queue
          </Text>
          <View style={[styles.badgePill, { backgroundColor: config.badgeBg }]}>
            <Text style={[styles.badgePillText, { color: config.accentColor }]}>
              {filteredItems.length}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={loadQueue}>
          <RefreshCw size={17} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      {/* Search & Filter Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, code, phone, sponsor..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, filterPriority === 'ALL' && styles.filterPillActive]}
            onPress={() => setFilterPriority('ALL')}
          >
            <Text style={[styles.filterPillText, filterPriority === 'ALL' && styles.filterPillTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterPriority === 'HIGH' && styles.filterPillActive]}
            onPress={() => setFilterPriority('HIGH')}
          >
            <Text style={[styles.filterPillText, filterPriority === 'HIGH' && styles.filterPillTextActive]}>
              High Priority ⚡
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterPill}
            onPress={() => setSortOrder(sortOrder === 'OLDEST' ? 'NEWEST' : 'OLDEST')}
          >
            <Text style={styles.filterPillText}>
              Sort: {sortOrder === 'OLDEST' ? 'Oldest First' : 'Newest First'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bulk Action Header Bar */}
      {filteredItems.length > 0 && (
        <View style={styles.bulkBar}>
          <TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll}>
            {selectedIds.length === filteredItems.length ? (
              <CheckSquare size={18} color={config.accentColor} />
            ) : (
              <Square size={18} color="#94A3B8" />
            )}
            <Text style={styles.selectAllText}>
              Select All ({selectedIds.length}/{filteredItems.length})
            </Text>
          </TouchableOpacity>

          {selectedIds.length > 0 && (
            <View style={styles.bulkActionsRow}>
              <TouchableOpacity
                style={[styles.bulkBtn, styles.bulkApproveBtn]}
                onPress={handleBulkApprove}
                disabled={actionLoading}
              >
                <Check size={14} color={COLORS.white} />
                <Text style={styles.bulkBtnText}>Approve ({selectedIds.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bulkBtn, styles.bulkRejectBtn]}
                onPress={handleBulkReject}
                disabled={actionLoading}
              >
                <X size={14} color={COLORS.white} />
                <Text style={styles.bulkBtnText}>Reject ({selectedIds.length})</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={config.accentColor} />
          <Text style={styles.loadingText}>Fetching {config.title} requests...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCircle, { backgroundColor: config.badgeBg }]}>
            <Check size={36} color={config.accentColor} />
          </View>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>
            There are no pending {config.title} approval requests right now.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {filteredItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <View
                key={item.id}
                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
              >
                {/* Header Row */}
                <View style={styles.itemHeader}>
                  <TouchableOpacity
                    style={styles.checkboxTouch}
                    onPress={() => handleToggleSelect(item.id)}
                  >
                    {isSelected ? (
                      <CheckSquare size={20} color={config.accentColor} />
                    ) : (
                      <Square size={20} color="#94A3B8" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.itemMeta}
                    activeOpacity={categoryKey === 'vendors' ? 0.7 : 1}
                    onPress={() => {
                      if (categoryKey === 'vendors') {
                        setReviewVendorId(item.id);
                      }
                    }}
                  >
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.priority === 'HIGH' && (
                        <View style={styles.priorityBadge}>
                          <Text style={styles.priorityText}>HIGH</Text>
                        </View>
                      )}
                      {categoryKey === 'vendors' && (
                        <View style={styles.clickableChip}>
                          <Text style={styles.clickableChipText}>Click to Inspect Profile</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemSubText}>
                      {item.code} · {item.mobile} {item.email !== 'N/A' && `· ${item.email}`}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.timeBadge}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.timeText}>{item.ageHours}h ago</Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                  {Object.entries(item.details || {}).map(([key, value]) => {
                    if (value === undefined || value === null) return null;
                    return (
                      <View key={key} style={styles.detailItem}>
                        <Text style={styles.detailKey}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {String(value)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Documents Pill Strip */}
                {item.documents && item.documents.length > 0 ? (
                  <View style={styles.docsStrip}>
                    <Text style={styles.docsLabel}>DOCUMENTS ({item.documents.length}):</Text>
                    <View style={styles.docPillsRow}>
                      {item.documents.map((doc, docIdx) => (
                        <TouchableOpacity
                          key={doc.id || docIdx}
                          style={styles.docPill}
                          onPress={() => handleOpenDocs(item.documents, docIdx)}
                        >
                          <FileText size={12} color="#3B82F6" />
                          <Text style={styles.docPillText}>{doc.label} ✓</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.docsStrip}>
                    <Text style={styles.docsLabel}>DOCUMENTS (0):</Text>
                    <View style={styles.docPillsRow}>
                      <View style={[styles.docPill, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                        <AlertCircle size={12} color="#D97706" />
                        <Text style={[styles.docPillText, { color: '#B45309' }]}>No documents uploaded</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Bottom Action Buttons */}
                <View style={styles.itemActionsRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {categoryKey === 'vendors' && (
                      <TouchableOpacity
                        style={styles.viewFullProfileBtn}
                        onPress={() => setReviewVendorId(item.id)}
                      >
                        <Eye size={13} color="#FFFFFF" />
                        <Text style={styles.viewFullProfileBtnText}>View Profile & KYC</Text>
                      </TouchableOpacity>
                    )}

                    {item.documents && item.documents.length > 0 && (
                      <TouchableOpacity
                        style={styles.viewDocsBtn}
                        onPress={() => handleOpenDocs(item.documents, 0)}
                      >
                        <FileText size={13} color="#2563EB" />
                        <Text style={styles.viewDocsBtnText}>
                          Docs ({item.documents.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.actionButtonsRight}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => setActiveItemForReject(item)}
                    >
                      <X size={13} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => setActiveItemForApprove(item)}
                    >
                      <Check size={13} color={COLORS.white} />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        visible={showViewer}
        documents={viewerDocs}
        initialIndex={viewerIndex}
        onClose={() => setShowViewer(false)}
      />

      {/* Approve Modal */}
      <ApproveModal
        visible={activeItemForApprove !== null}
        item={activeItemForApprove}
        onConfirm={handleConfirmApprove}
        onClose={() => setActiveItemForApprove(null)}
      />

      {/* Reject Modal */}
      <RejectModal
        visible={activeItemForReject !== null}
        item={activeItemForReject}
        onConfirm={handleConfirmReject}
        onClose={() => setActiveItemForReject(null)}
      />

      {/* Full Screen Vendor KYC & Location Review Modal */}
      {categoryKey === 'vendors' && (
        <VendorKycReviewModal
          isOpen={reviewVendorId !== null}
          vendorId={reviewVendorId}
          onClose={() => setReviewVendorId(null)}
          onApproved={() => {
            setReviewVendorId(null);
            loadQueue();
            onRefreshSummary();
          }}
          onRejected={() => {
            setReviewVendorId(null);
            loadQueue();
            onRefreshSummary();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.sm,
    flexShrink: 0,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  navTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 0,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexShrink: 0,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  refreshBtn: {
    padding: 6,
    flexShrink: 0,
  },
  toolbar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#2563EB',
  },
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    backgroundColor: '#EEF2F6',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  bulkActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  bulkApproveBtn: {
    backgroundColor: '#16A34A',
  },
  bulkRejectBtn: {
    backgroundColor: '#DC2626',
  },
  bulkBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: SPACING.md,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  itemCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxTouch: {
    paddingTop: 2,
  },
  itemMeta: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  priorityBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  itemSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginTop: 12,
  },
  detailItem: {
    minWidth: 120,
    flex: 1,
  },
  detailKey: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 1,
  },
  docsStrip: {
    marginTop: 12,
    gap: 6,
  },
  docsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  docPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  docPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  docPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  itemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  viewDocsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EFF6FF',
    flexShrink: 0,
  },
  viewDocsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexShrink: 0,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#16A34A',
    flexShrink: 0,
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  viewFullProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#2563EB',
    flexShrink: 0,
  },
  viewFullProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clickableChip: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  clickableChipText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '600',
  },
});
