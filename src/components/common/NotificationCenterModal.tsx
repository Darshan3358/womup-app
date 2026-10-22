import React, { useState } from 'react';
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
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { InAppNotification } from '../../services/notificationService';

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  visible,
  onClose,
}) => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refreshNotifications } =
    useNotifications();
  const { setActiveScreen, setSelectedTrackingOrderId } = useApp() as any;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (item: InAppNotification) => {
    const id = item._id || item.id;
    if (id && !item.isRead) {
      await markAsRead(id);
    }

    onClose();

    // Deep link action handling
    const orderId = item.orderId || (item.entityType === 'ORDER' ? item.entityId : null);
    if (orderId) {
      if (typeof setSelectedTrackingOrderId === 'function') {
        setSelectedTrackingOrderId(orderId);
      }
      setActiveScreen('C24_OrderTracking');
      return;
    }

    if (item.type?.includes('KYC') || item.actionType === 'KYC_STATUS') {
      setActiveScreen('Blinkit_Profile');
      return;
    }

    if (item.type?.includes('WALLET') || item.type?.includes('COIN')) {
      setActiveScreen('Blinkit_Money');
      return;
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
    switch (type.toUpperCase()) {
      case 'ORDER_PLACED':
        return <Text style={styles.iconEmoji}>🛒</Text>;
      case 'ORDER_CONFIRMED':
        return <Feather name="check-circle" size={20} color="#10B981" />;
      case 'ORDER_PACKING':
      case 'ORDER_PACKED':
        return <Text style={styles.iconEmoji}>📦</Text>;
      case 'RIDER_ASSIGNED':
      case 'OUT_FOR_DELIVERY':
        return <Text style={styles.iconEmoji}>🛵</Text>;
      case 'RIDER_NEARBY':
        return <Text style={styles.iconEmoji}>📍</Text>;
      case 'ORDER_DELIVERED':
        return <Feather name="check" size={20} color="#10B981" />;
      case 'ORDER_CANCELLED':
        return <Feather name="x-circle" size={20} color="#EF4444" />;
      case 'REFUND_INITIATED':
      case 'REFUND_COMPLETED':
        return <Text style={styles.iconEmoji}>💰</Text>;
      case 'PAYMENT_SUCCESS':
        return <Feather name="credit-card" size={20} color="#10B981" />;
      case 'PAYMENT_FAILED':
        return <Feather name="alert-triangle" size={20} color="#EF4444" />;
      case 'CUSTOMER_KYC_APPROVED':
        return <Feather name="shield" size={20} color="#10B981" />;
      case 'CUSTOMER_KYC_REJECTED':
        return <Feather name="alert-circle" size={20} color="#EF4444" />;
      default:
        return <Feather name="bell" size={20} color={COLORS.hotPink} />;
    }
  };

  // Group notifications into Today vs Earlier
  const today = new Date().toDateString();
  const todayItems: InAppNotification[] = [];
  const earlierItems: InAppNotification[] = [];

  notifications.forEach((item) => {
    try {
      const itemDate = new Date(item.createdAt).toDateString();
      if (itemDate === today) {
        todayItems.push(item);
      } else {
        earlierItems.push(item);
      }
    } catch {
      earlierItems.push(item);
    }
  });

  const sectionData = [
    ...(todayItems.length > 0 ? [{ title: 'TODAY', data: todayItems }] : []),
    ...(earlierItems.length > 0 ? [{ title: 'EARLIER', data: earlierItems }] : []),
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Notifications</Text>
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
                  onPress={markAllAsRead}
                  style={styles.markAllButton}
                >
                  <Text style={styles.markAllText}>Mark all ✓</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Close notifications"
              >
                <Feather name="x" size={20} color="#333333" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body */}
          {loading && notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.hotPink} />
              <Text style={styles.emptySubtext}>Loading your notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Feather name="bell-off" size={36} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>
                We'll notify you when your orders are placed, dispatched, or delivered.
              </Text>
            </View>
          ) : (
            <FlatList
              data={sectionData}
              keyExtractor={(item) => item.title}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[COLORS.hotPink]}
                />
              }
              contentContainerStyle={styles.listContent}
              renderItem={({ item: section }) => (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionHeader}>{section.title}</Text>
                  {section.data.map((item) => {
                    const isUnread = !item.isRead;
                    return (
                      <TouchableOpacity
                        key={item._id || item.id}
                        activeOpacity={0.75}
                        onPress={() => handleNotificationPress(item)}
                        style={[styles.itemCard, isUnread && styles.itemCardUnread]}
                      >
                        {/* Status indicator dot */}
                        <View style={styles.statusIndicatorColumn}>
                          {isUnread ? (
                            <View style={styles.unreadDot} />
                          ) : (
                            <View style={styles.readDot} />
                          )}
                        </View>

                        {/* Icon */}
                        <View style={styles.iconContainer}>{renderIcon(item.type)}</View>

                        {/* Content */}
                        <View style={styles.contentColumn}>
                          <View style={styles.titleRow}>
                            <Text
                              style={[styles.itemTitle, isUnread && styles.itemTitleUnread]}
                              numberOfLines={1}
                            >
                              {item.title}
                            </Text>
                            <Text style={styles.timeAgoText}>{formatTimeAgo(item.createdAt)}</Text>
                          </View>

                          <Text
                            style={[styles.itemMessage, isUnread && styles.itemMessageUnread]}
                            numberOfLines={2}
                          >
                            {item.message || item.body || ''}
                          </Text>

                          {item.orderId && (
                            <View style={styles.actionChipRow}>
                              <View style={styles.actionChip}>
                                <Text style={styles.actionChipText}>View order tracking →</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
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
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  badgePill: {
    backgroundColor: COLORS.hotPink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemCardUnread: {
    backgroundColor: '#FDF2F8', // subtle pink tint
    borderColor: '#FCE7F3',
  },
  statusIndicatorColumn: {
    paddingTop: 4,
    marginRight: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.hotPink,
  },
  readDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconEmoji: {
    fontSize: 18,
  },
  contentColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  itemTitleUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  timeAgoText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  itemMessage: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  itemMessageUnread: {
    color: '#4B5563',
  },
  actionChipRow: {
    marginTop: 6,
  },
  actionChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionChipText: {
    fontSize: 11,
    color: COLORS.hotPink,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
