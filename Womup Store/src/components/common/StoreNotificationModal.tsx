import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { COLORS } from '../../theme/colors';

interface StoreNotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StoreNotificationModal: React.FC<StoreNotificationModalProps> = ({
  visible,
  onClose,
}) => {
  const { store, setSubScreen, setCurrentTab, selectOrderForDetail } = useStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const storeId = store?.id || (store as any)?._id || '';

  const loadNotifications = async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      const res = await StoreApiService.getNotifications(storeId, 1, 30);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (e) {
      console.warn('[StoreNotificationModal] fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && storeId) {
      loadNotifications();
    }
  }, [visible, storeId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    if (!storeId) return;
    await StoreApiService.markAllNotificationsRead(storeId);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleItemPress = async (item: any) => {
    const notifId = item._id || item.id;
    if (notifId && !item.isRead && storeId) {
      StoreApiService.markNotificationRead(notifId, storeId);
      setNotifications((prev) =>
        prev.map((n) => ((n._id === notifId || n.id === notifId) ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    onClose();

    // Deep navigation
    const orderId = item.orderId || (item.entityType === 'ORDER' ? item.entityId : null);
    if (orderId) {
      if (typeof selectOrderForDetail === 'function') {
        selectOrderForDetail(orderId);
      }
      setSubScreen('OrderDetail');
      return;
    }

    const type = (item.type || '').toUpperCase();
    if (type.includes('STOCK') || type.includes('INVENTORY')) {
      setCurrentTab('Inventory');
    } else {
      setCurrentTab('Incoming');
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
    const t = type.toUpperCase();
    if (t.includes('NEW_ORDER')) {
      return <Ionicons name="cart" size={20} color="#10B981" />;
    }
    if (t.includes('READY')) {
      return <Ionicons name="checkmark-done-circle" size={20} color="#10B981" />;
    }
    if (t.includes('CANCEL')) {
      return <Ionicons name="close-circle" size={20} color="#EF4444" />;
    }
    if (t.includes('RIDER')) {
      return <Ionicons name="bicycle" size={20} color="#3B82F6" />;
    }
    if (t.includes('STOCK') || t.includes('INVENTORY')) {
      return <Ionicons name="alert-circle" size={20} color="#F59E0B" />;
    }
    return <Ionicons name="notifications" size={20} color={COLORS.primary} />;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.title}>Store Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
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
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* List Content */}
          {loading && notifications.length === 0 ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Fetching store alerts...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="checkmark-circle-outline" size={44} color="#10B981" />
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySubtext}>
                No pending notifications for this dark store. New incoming orders will trigger instant sound and alerts.
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item._id || item.id || String(Math.random())}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
              }
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isUnread = !item.isRead;
                return (
                  <TouchableOpacity
                    style={[styles.itemCard, isUnread && styles.itemCardUnread]}
                    activeOpacity={0.75}
                    onPress={() => handleItemPress(item)}
                  >
                    <View style={styles.iconCircle}>{renderIcon(item.type)}</View>

                    <View style={styles.itemBody}>
                      <View style={styles.itemTopRow}>
                        <View style={styles.titleWrap}>
                          {isUnread && <View style={styles.dot} />}
                          <Text style={[styles.itemTitle, isUnread && styles.itemTitleBold]} numberOfLines={1}>
                            {item.title}
                          </Text>
                        </View>
                        <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
                      </View>

                      <Text style={styles.itemMessage} numberOfLines={2}>
                        {item.message || item.body || ''}
                      </Text>

                      {item.orderId && (
                        <View style={styles.orderPill}>
                          <Text style={styles.orderPillText}>Order #{item.metadata?.orderNumber || item.orderId.slice(-6)} →</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 27, 82, 0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '45%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgePill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  itemCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemBody: {
    flex: 1,
  },
  itemTopRow: {
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
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  itemTitleBold: {
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
  orderPill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  centerBox: {
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
