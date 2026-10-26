import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationCenterModal } from '../../components/common/NotificationCenterModal';

interface WomupHeaderProps {
  location?: string;
  onOpenMenu?: () => void;
  onSelectLocation?: () => void;
  onOpenNotifications?: () => void;
}

export const WomupHeader: React.FC<WomupHeaderProps> = ({
  location = 'Ahmedabad',
  onSelectLocation,
  onOpenNotifications,
}) => {
  const { unreadCount } = useNotifications();
  const [isNotificationModalVisible, setNotificationModalVisible] = useState(false);

  const handleNotificationsPress = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    } else {
      setNotificationModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.headerRow}>
        {/* Left: Brand Name without hamburger icon */}
        <View style={styles.leftActionsRow}>
          <Text style={styles.headerBrandText}>WOMART</Text>
        </View>

        {/* Right: Location & Notifications */}
        <View style={styles.rightActionsRow}>
          {/* Location Selector */}
          <TouchableOpacity
            style={styles.locationSelector}
            activeOpacity={0.7}
            onPress={onSelectLocation}
          >
            <Ionicons name="location-sharp" size={15} color="#E11D48" />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
            <Ionicons name="chevron-down" size={13} color="#E11D48" />
          </TouchableOpacity>

          {/* Notifications with real badge & popup modal */}
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            onPress={handleNotificationsPress}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={24} color="#0F172A" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Modal Popup (matching customer app) */}
      <NotificationCenterModal
        visible={isNotificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 2,
  },
  backButtonText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '800',
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBrandText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginLeft: 2,
    letterSpacing: -0.2,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wIconBadge: {
    position: 'relative',
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wIconLetter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  wArrow: {
    position: 'absolute',
    top: -5,
    right: -4,
    backgroundColor: '#9333EA',
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  womupText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#1E1B4B',
  },
  taglineText: {
    fontSize: 8,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#FECDD3',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
    maxWidth: 130,
  },
  bellButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
