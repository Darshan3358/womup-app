import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Bell, CheckCircle2, AlertTriangle, ShieldCheck, ShoppingCart, Truck, Store, X, Check } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { adminNotificationService, AdminNotification } from '../../services/adminNotificationService';

interface AdminNotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AdminNotificationModal: React.FC<AdminNotificationModalProps> = ({
  visible,
  onClose,
}) => {
  const { setActiveTab } = useAdminState();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await adminNotificationService.getNotifications(1, 40);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.warn('[AdminNotificationModal] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    await adminNotificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif: AdminNotification) => {
    const id = notif._id || notif.id;
    if (id && !notif.isRead) {
      adminNotificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => ((n._id === id || n.id === id) ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    onClose();

    // Map notification types to Admin navigation tabs
    const type = notif.type?.toUpperCase() || '';
    if (type.includes('CUSTOMER_KYC') || type.includes('CUSTOMER')) {
      setActiveTab('Users');
    } else if (type.includes('RIDER_KYC') || type.includes('RIDER')) {
      setActiveTab('Approvals');
    } else if (type.includes('STORE_KYC') || type.includes('STORE')) {
      setActiveTab('Stores');
    } else if (type.includes('ORDER') || type.includes('REFUND')) {
      setActiveTab('Orders');
    } else if (type.includes('WITHDRAWAL') || type.includes('FINANCE') || type.includes('WALLET')) {
      setActiveTab('Wallets');
    } else if (type.includes('STOCK') || type.includes('INVENTORY')) {
      setActiveTab('Inventory');
    } else if (type.includes('PRICE') || type.includes('PRICING')) {
      setActiveTab('Prices');
    } else {
      setActiveTab('Approvals');
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const now = new Date().getTime();
      const past = new Date(dateStr).getTime();
      const diffSec = Math.floor((now - past) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const renderIcon = (type: string = '') => {
    const upper = type.toUpperCase();
    if (upper.includes('KYC') || upper.includes('VERIF')) {
      return <ShieldCheck size={18} color="#6366F1" />;
    }
    if (upper.includes('RIDER')) {
      return <Truck size={18} color="#0EA5E9" />;
    }
    if (upper.includes('STORE')) {
      return <Store size={18} color="#F59E0B" />;
    }
    if (upper.includes('ORDER') || upper.includes('LARGE')) {
      return <ShoppingCart size={18} color="#10B981" />;
    }
    if (upper.includes('CANCEL') || upper.includes('ALERT') || upper.includes('STOCK')) {
      return <AlertTriangle size={18} color="#EF4444" />;
    }
    return <Bell size={18} color={COLORS.navy} />;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.title}>Admin Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleMarkAllRead}
                  style={styles.markAllBtn}
                >
                  <Text style={styles.markAllText}>Mark all ✓</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>

          {/* List Content */}
          {loading && notifications.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={COLORS.navy} />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.centerContainer}>
              <Bell size={40} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtext}>No new alerts or KYC submissions requiring action.</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item._id || item.id || String(Math.random())}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.navy]} />
              }
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => {
                const isUnread = !item.isRead;
                return (
                  <TouchableOpacity
                    style={[styles.itemCard, isUnread && styles.itemCardUnread]}
                    activeOpacity={0.75}
                    onPress={() => handleNotificationClick(item)}
                  >
                    <View style={styles.iconCircle}>{renderIcon(item.type)}</View>

                    <View style={styles.itemContent}>
                      <View style={styles.itemTitleRow}>
                        <View style={styles.titleWrap}>
                          {isUnread && <View style={styles.unreadDot} />}
                          <Text style={[styles.itemTitle, isUnread && styles.itemTitleUnread]} numberOfLines={1}>
                            {item.title}
                          </Text>
                        </View>
                        <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
                      </View>

                      <Text style={styles.itemMessage} numberOfLines={2}>
                        {item.message || item.body || ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 14,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  itemCardUnread: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  itemTitleUnread: {
    fontWeight: '700',
    color: '#0F172A',
  },
  timeAgo: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  itemMessage: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  centerContainer: {
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
