import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';
import { RiderNotification } from '../../types/rider.types';
import { COLORS } from '../../theme/colors';

export const NotificationsScreen: React.FC = () => {
  const { setSubScreen, setCurrentTab } = useRider();
  const [notifications, setNotifications] = useState<RiderNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    const list = await RiderApiService.getNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkRead = async (id: string) => {
    await RiderApiService.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    let updated = notifications;
    for (const n of notifications) {
      if (!n.isRead) {
        updated = await RiderApiService.markNotificationRead(n.id);
      }
    }
    setNotifications(updated);
  };

  const handleClearAll = () => {
    Alert.alert('Clear All Alerts?', 'This will permanently remove all past notifications.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await RiderApiService.clearAllNotifications();
          setNotifications([]);
        },
      },
    ]);
  };

  const getTypeBadge = (type: any): { icon: keyof typeof Ionicons.glyphMap; color: string; label: string } => {
    const t = String(type || '').toUpperCase();
    if (t.includes('NEW_DELIVERY') || t.includes('ASSIGNED')) {
      return { icon: 'bicycle-outline', color: '#3B82F6', label: 'NEW JOB' };
    }
    if (t.includes('COMPLETED') || t.includes('DELIVERED')) {
      return { icon: 'checkmark-done-circle-outline', color: '#10B981', label: 'COMPLETED' };
    }
    if (t.includes('CANCEL')) {
      return { icon: 'close-circle-outline', color: '#EF4444', label: 'CANCELLED' };
    }
    if (t.includes('KYC_APPROVED')) {
      return { icon: 'shield-checkmark-outline', color: '#10B981', label: 'KYC APPROVED' };
    }
    if (t.includes('KYC_REJECTED')) {
      return { icon: 'alert-circle-outline', color: '#EF4444', label: 'KYC REJECTED' };
    }
    if (t.includes('EARNING') || t.includes('PAYOUT') || t.includes('INCENTIVE')) {
      return { icon: 'wallet-outline', color: '#10B981', label: 'EARNINGS' };
    }
    if (t.includes('SAFETY') || t.includes('COMPLIANCE')) {
      return { icon: 'shield-outline', color: COLORS.blue, label: 'COMPLIANCE' };
    }
    return { icon: 'notifications-outline', color: COLORS.navy, label: 'DISPATCH' };
  };

  const handleItemClick = async (item: RiderNotification) => {
    await handleMarkRead(item.id);

    const t = String(item.type || '').toUpperCase();
    if (item.orderId || t.includes('ORDER') || t.includes('DELIVERY') || t.includes('ASSIGN')) {
      setSubScreen('None');
      setCurrentTab('Deliveries');
      return;
    }
    if (t.includes('KYC') || t.includes('DOCUMENT')) {
      setSubScreen('Documents');
      return;
    }
    if (t.includes('EARNING') || t.includes('PAYOUT')) {
      setSubScreen('None');
      setCurrentTab('Earnings');
      return;
    }
    setSubScreen('None');
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity style={[styles.backRow, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={() => setSubScreen('None')}>
        <Ionicons name="arrow-back" size={16} color={COLORS.hotPink} />
        <Text style={styles.backArrow}>Back to Menu</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Hub Broadcasts & Alerts</Text>
          <Text style={styles.screenSubtitle}>Operational updates from Dark Store fleet manager</Text>
        </View>
      </View>

      {/* Action Bar */}
      {notifications.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="checkmark-done-outline" size={14} color={COLORS.primary} />
            <Text style={styles.actionText}>Mark All as Read</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="trash-outline" size={14} color={COLORS.error} />
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="notifications-off-outline" size={32} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySub}>You have no unread hub announcements or dispatch alerts.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {notifications.map((item) => {
            const badge = getTypeBadge(item.type);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.notifCard, !item.isRead && styles.unreadCard]}
                onPress={() => handleItemClick(item)}
                activeOpacity={0.8}
              >
                <View style={styles.notifHeader}>
                  <View style={[styles.badgeRow, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <Ionicons name={badge.icon} size={14} color={badge.color} />
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                  <Text style={styles.timeText}>{item.timestamp}</Text>
                </View>

                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifMsg}>{item.message}</Text>

                {!item.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  backRow: {
    marginBottom: 12,
  },
  backArrow: {
    color: COLORS.hotPink,
    fontWeight: '800',
    fontSize: 14,
  },
  headerRow: {
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
  },
  list: {
    gap: 12,
  },
  notifCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  unreadCard: {
    borderColor: COLORS.hotPink,
    backgroundColor: '#FFFBFE',
    borderWidth: 1.5,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeEmoji: {
    fontSize: 14,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.secondaryText,
    fontWeight: '600',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  notifMsg: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.hotPink,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 30,
  },
});
