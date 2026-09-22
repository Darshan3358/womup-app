import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import {
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Printer,
  MessageSquare,
  Send,
  Phone,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { OrderStage } from '../../types/admin';

const LIFECYCLE_STAGES: OrderStage[] = [
  'Order Placed',
  'Payment Confirmed',
  'Order Accepted',
  'Picker Assigned',
  'Picking',
  'Picking Completed',
  'Packed',
  'Rider Assigned',
  'Ready for Dispatch',
  'Out for Delivery',
  'Delivered',
];

export const OrderInspectorScreen: React.FC = () => {
  const { selectedOrder, updateOrderStatus, setActiveModal, openLabelPrint } = useAdminState();

  const [activeTab, setActiveTab] = useState<'DETAILS' | 'COMMUNICATION'>('DETAILS');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isInterventionEnabled, setIsInterventionEnabled] = useState(false);

  const cleanOrderId = selectedOrder?.id ? selectedOrder.id.replace(/^#/, '') : '';

  const fetchChat = useCallback(async () => {
    if (!cleanOrderId) return;
    try {
      const res = await fetch(`http://localhost:5050/api/v1/chat/${encodeURIComponent(cleanOrderId)}/history`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setChatMessages(json.data);
        }
      }
    } catch {
      // silent
    }
  }, [cleanOrderId]);

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [fetchChat]);

  const handleSendAdminMessage = async (customText?: string) => {
    const text = (customText || adminMsg).trim();
    if (!text || !cleanOrderId) return;

    setIsSending(true);
    try {
      const res = await fetch(`http://localhost:5050/api/v1/chat/${encodeURIComponent(cleanOrderId)}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'admin_support_console',
          senderRole: 'ADMIN',
          senderName: 'Worm Up Dispatch Support',
          message: text,
        }),
      });
      if (res.ok) {
        setAdminMsg('');
        fetchChat();
      }
    } catch {
      Alert.alert('Error', 'Failed to send admin intervention message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCall = (name: string, phone?: string) => {
    if (!phone) {
      Alert.alert(`Call ${name}`, 'Phone number not available');
      return;
    }
    const clean = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {
      Alert.alert(`Call ${name}`, `Direct dialing not available. Number: ${phone}`);
    });
  };

  if (!selectedOrder) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No order selected for inspection</Text>
      </View>
    );
  }

  const currentStageIndex = LIFECYCLE_STAGES.indexOf(selectedOrder.status as OrderStage);

  const handleAdvanceStage = () => {
    if (currentStageIndex < LIFECYCLE_STAGES.length - 1) {
      const nextStage = LIFECYCLE_STAGES[currentStageIndex + 1];
      updateOrderStatus(selectedOrder.id, nextStage);
      Alert.alert('Stage Advanced', `Order ${selectedOrder.id} moved to "${nextStage}"`);
    } else {
      Alert.alert('Completed', 'Order has reached final Delivered state.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.orderId}>{selectedOrder.id}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{selectedOrder.status}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Clock size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>{selectedOrder.timestamp}</Text>
        </View>

        <View style={styles.customerRow}>
          <User size={14} color={COLORS.purple} style={{ marginRight: 6 }} />
          <Text style={styles.customerText}>
            {selectedOrder.customerName} ({selectedOrder.customerPhone})
          </Text>
        </View>

        <View style={styles.customerRow}>
          <MapPin size={14} color={COLORS.hotPink} style={{ marginRight: 6 }} />
          <Text style={styles.addressText}>
            {selectedOrder.address} • <Text style={{ fontWeight: '700' }}>{selectedOrder.zoneName}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.printHeaderBtn}
          onPress={() =>
            openLabelPrint({
              orderId: selectedOrder.id,
              type: 'GROCERY',
              customerName: selectedOrder.customerName,
              customerPhone: selectedOrder.customerPhone,
              address: selectedOrder.address,
              items: selectedOrder.items,
              total: selectedOrder.total,
              paymentMethod: 'Online UPI',
            })
          }
        >
          <Printer size={15} color={COLORS.purple} style={{ marginRight: 6 }} />
          <Text style={styles.printHeaderBtnText}>Print Dispatch Shipping Label / Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Mode Tabs: Details vs Communication */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabSelectorBtn, activeTab === 'DETAILS' && styles.tabSelectorBtnActive]}
          onPress={() => setActiveTab('DETAILS')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabSelectorText, activeTab === 'DETAILS' && styles.tabSelectorTextActive]}>
            📦 Order Details & Fleet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabSelectorBtn, activeTab === 'COMMUNICATION' && styles.tabSelectorBtnActive]}
          onPress={() => setActiveTab('COMMUNICATION')}
          activeOpacity={0.8}
        >
          <MessageSquare size={14} color={activeTab === 'COMMUNICATION' ? COLORS.white : COLORS.textMuted} style={{ marginRight: 6 }} />
          <Text style={[styles.tabSelectorText, activeTab === 'COMMUNICATION' && styles.tabSelectorTextActive]}>
            Live Communication ({chatMessages.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'DETAILS' ? (
        <>
          {/* Items Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ordered Fresh Items</Text>
            {selectedOrder.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemWeight}>{item.quantityKg} kg @ ₹{item.pricePerKg}/kg</Text>
                </View>
                <Text style={styles.itemSubtotal}>₹{item.subtotal}</Text>
              </View>
            ))}

            <View style={styles.pricingSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryVal}>₹{selectedOrder.subtotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryVal}>₹{selectedOrder.deliveryFee}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalVal}>₹{selectedOrder.total}</Text>
              </View>
            </View>
          </View>

          {/* Staff Operational Assignments */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Operational Fleet</Text>
            <View style={styles.staffRow}>
              <Text style={styles.staffLabel}>Picker:</Text>
              <Text style={styles.staffVal}>{selectedOrder.pickerName || 'Unassigned'}</Text>
            </View>
            <View style={styles.staffRow}>
              <Text style={styles.staffLabel}>Rider:</Text>
              <Text style={styles.staffVal}>{selectedOrder.riderName || 'Unassigned'}</Text>
            </View>
          </View>

          {/* 11-Stage Interactive Timeline */}
          <View style={styles.card}>
            <View style={styles.timelineHeader}>
              <Text style={styles.cardTitle}>11-Stage Order Lifecycle</Text>
              <TouchableOpacity onPress={handleAdvanceStage}>
                <Text style={styles.advanceLink}>Advance Stage</Text>
              </TouchableOpacity>
            </View>

            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isDone = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <View key={stage} style={styles.timelineStep}>
                  <View style={styles.indicatorCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        isDone && styles.dotDone,
                        isCurrent && styles.dotCurrent,
                      ]}
                    >
                      {isDone && <CheckCircle2 size={12} color={COLORS.white} />}
                    </View>
                    {idx < LIFECYCLE_STAGES.length - 1 && (
                      <View style={[styles.line, isDone && styles.lineDone]} />
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isCurrent && styles.stepTitleCurrent,
                        !isDone && styles.stepTitleFuture,
                      ]}
                    >
                      {stage}
                    </Text>
                    {isDone && (
                      <Text style={styles.stepTime}>
                        {selectedOrder.timeline.find((t) => t.stage === stage)?.timestamp || 'Recorded'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.reassignBtn}
              onPress={() => setActiveModal('StaffReassignment')}
            >
              <RefreshCw size={16} color={COLORS.purple} style={{ marginRight: 6 }} />
              <Text style={styles.reassignText}>Reassign Fleet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setActiveModal('OrderCancelRefund')}
            >
              <AlertCircle size={16} color={COLORS.error} style={{ marginRight: 6 }} />
              <Text style={styles.cancelText}>Cancel & Refund</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* COMMUNICATION & CHAT OVERSIGHT TAB */
        <View style={styles.chatSection}>
          {/* Quick Contact Bar */}
          <View style={styles.quickContactCard}>
            <View style={styles.contactItem}>
              <View>
                <Text style={styles.contactRole}>CUSTOMER</Text>
                <Text style={styles.contactName}>{selectedOrder.customerName}</Text>
                <Text style={styles.contactPhone}>{selectedOrder.customerPhone || 'No Phone'}</Text>
              </View>
              <TouchableOpacity
                style={styles.contactCallBtn}
                onPress={() => handleCall(selectedOrder.customerName, selectedOrder.customerPhone)}
              >
                <Phone size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.contactCallText}>Call</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactDivider} />

            <View style={styles.contactItem}>
              <View>
                <Text style={styles.contactRole}>DELIVERY RIDER</Text>
                <Text style={styles.contactName}>{selectedOrder.riderName || 'Unassigned'}</Text>
                <Text style={styles.contactPhone}>{(selectedOrder as any).riderPhone || '+91 98765 43210'}</Text>
              </View>
              <TouchableOpacity
                style={styles.contactCallBtn}
                onPress={() => handleCall(selectedOrder.riderName || 'Rider', (selectedOrder as any).riderPhone || '+91 98765 43210')}
              >
                <Phone size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.contactCallText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat Messages Timeline */}
          <View style={styles.chatFeedCard}>
            <View style={styles.chatFeedHeader}>
              <Text style={styles.chatFeedTitle}>Live Order Dialogue Stream</Text>
              <TouchableOpacity onPress={fetchChat} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RefreshCw size={12} color={COLORS.purple} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, color: COLORS.purple, fontWeight: '600' }}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {chatMessages.length === 0 ? (
              <View style={styles.emptyChatBox}>
                <MessageSquare size={32} color={COLORS.textMuted} />
                <Text style={styles.emptyChatText}>No messages exchanged yet</Text>
                <Text style={styles.emptyChatSub}>
                  Messages sent between the Customer and Delivery Partner will appear here in real-time.
                </Text>
              </View>
            ) : (
              <View style={styles.chatListContainer}>
                {chatMessages.map((msg, i) => {
                  const isCust = msg.senderRole === 'CUSTOMER';
                  const isRider = msg.senderRole === 'RIDER';
                  const isAdmin = msg.senderRole === 'ADMIN';

                  let badgeColor = '#6366F1';
                  let badgeBg = '#EEF2FF';
                  let roleText = 'RIDER';
                  if (isCust) {
                    badgeColor = '#DB2777';
                    badgeBg = '#FCE7F3';
                    roleText = 'CUSTOMER';
                  } else if (isAdmin) {
                    badgeColor = '#D97706';
                    badgeBg = '#FEF3C7';
                    roleText = 'ADMIN DISPATCH';
                  }

                  const timeStr = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <View key={msg._id || i} style={[styles.chatRow, isAdmin && styles.chatRowAdmin]}>
                      <View style={styles.chatBubbleCard}>
                        <View style={styles.chatBubbleHeader}>
                          <View style={[styles.roleBadge, { backgroundColor: badgeBg }]}>
                            <Text style={[styles.roleBadgeText, { color: badgeColor }]}>{roleText}</Text>
                          </View>
                          <Text style={styles.chatSenderName}>
                            {msg.senderName || (isCust ? selectedOrder.customerName : selectedOrder.riderName || 'User')}
                          </Text>
                          <Text style={styles.chatTime}>{timeStr}</Text>
                        </View>
                        <Text style={styles.chatMsgBody}>{msg.message}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Support Intervention Panel (Read-only by default) */}
            {!isInterventionEnabled ? (
              <TouchableOpacity
                style={styles.interveneBtn}
                onPress={() => setIsInterventionEnabled(true)}
                activeOpacity={0.8}
              >
                <AlertCircle size={15} color={COLORS.purple} style={{ marginRight: 8 }} />
                <Text style={styles.interveneBtnText}>Intervene as Support (Send Official Message)</Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* Quick Support Intervention Templates */}
                <View style={styles.templatesBox}>
                  <Text style={styles.templatesTitle}>Quick Support Interventions:</Text>
                  <View style={styles.chipsRow}>
                    {[
                      'Rider is 2 mins away, please be at door',
                      'Please share the 4-digit verification PIN',
                      'Customer is unreachable, please wait at gate',
                      'Delivery verified by support team',
                    ].map((chip) => (
                      <TouchableOpacity
                        key={chip}
                        style={styles.templateChip}
                        onPress={() => handleSendAdminMessage(chip)}
                      >
                        <Text style={styles.templateChipText}>{chip}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Admin Message Dispatch Input Bar */}
                <View style={styles.adminInputBar}>
                  <TextInput
                    style={styles.adminTextInput}
                    placeholder="Broadcast official support message to order..."
                    placeholderTextColor={COLORS.textMuted}
                    value={adminMsg}
                    onChangeText={setAdminMsg}
                    onSubmitEditing={() => handleSendAdminMessage()}
                  />
                  <TouchableOpacity
                    style={[styles.adminSendBtn, !adminMsg.trim() && styles.adminSendBtnDisabled]}
                    disabled={!adminMsg.trim() || isSending}
                    onPress={() => handleSendAdminMessage()}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Send size={15} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      )}
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
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusPill: {
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusText: {
    color: '#D97706',
    fontWeight: '700',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  customerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  printHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: COLORS.purple,
    borderRadius: RADIUS.sm,
    paddingVertical: 9,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  printHeaderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.purple,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemWeight: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pricingSummary: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.hotPink,
  },
  staffRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  staffLabel: {
    width: 60,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  staffVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  advanceLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 36,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotDone: {
    backgroundColor: COLORS.success,
  },
  dotCurrent: {
    backgroundColor: COLORS.hotPink,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  lineDone: {
    backgroundColor: COLORS.success,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 8,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stepTitleCurrent: {
    fontWeight: '800',
    color: COLORS.hotPink,
  },
  stepTitleFuture: {
    color: COLORS.textMuted,
  },
  stepTime: {
    fontSize: 10,
    color: COLORS.secondaryText,
  },
  actionRow: {
    flexDirection: 'row',
  },
  reassignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightBlueLavender,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    marginRight: 6,
  },
  reassignText: {
    color: COLORS.purple,
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCECEE',
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    marginLeft: 6,
  },
  cancelText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 14,
  },

  /* Communication & Tab Styles */
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabSelectorBtnActive: {
    backgroundColor: COLORS.purple,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabSelectorText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tabSelectorTextActive: {
    color: COLORS.white,
  },
  chatSection: {
    marginBottom: SPACING.md,
  },
  quickContactCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  contactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactRole: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  contactPhone: {
    fontSize: 11,
    color: COLORS.secondaryText,
  },
  contactCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginLeft: 6,
  },
  contactCallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  contactDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  chatFeedCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chatFeedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  chatFeedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptyChatBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyChatText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptyChatSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  chatListContainer: {
    marginBottom: 16,
  },
  chatRow: {
    marginBottom: 10,
  },
  chatRowAdmin: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    paddingLeft: 8,
  },
  chatBubbleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  chatSenderName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  chatTime: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  chatMsgBody: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  templatesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  templatesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  templateChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  templateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  interveneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  interveneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },
  adminInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  adminTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  adminSendBtn: {
    backgroundColor: COLORS.purple,
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminSendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});

