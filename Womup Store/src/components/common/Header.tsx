import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { COLORS } from '../../theme/colors';
import { StoreNotificationModal } from './StoreNotificationModal';

export const Header: React.FC = () => {
  const { staff, store, subScreen, setSubScreen, toggleShift, shiftLoading, setSidebarOpen, storeUnreadCount, refreshUnreadCount } = useStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNotificationModalVisible, setNotificationModalVisible] = useState(false);

  const isOnShift = staff?.isOnShift ?? false;

  // Pulse animation for ON SHIFT green dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnShift) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnShift, pulseAnim]);

  useEffect(() => {
    refreshUnreadCount?.();
  }, [store?.id]);

  // Clean Store Name Truncation Rule
  let displayStoreName = store?.name || 'Prahlad Nagar Dark Store';
  if (displayStoreName.startsWith('Wom Up ')) {
    displayStoreName = displayStoreName.slice(7).trim();
  }
  if (displayStoreName.length > 25 && displayStoreName.endsWith(' Dark Store')) {
    displayStoreName = displayStoreName.replace(/\s*Dark\s*Store$/i, '').trim();
  }

  // Location info
  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Prahlad Nagar');

  const cityName = store?.cityName || store?.city || 'Ahmedabad';

  // Compact picker code (#782 or last 4-5 chars)
  const rawCode = staff?.employeeCode || store?.code || 'HUB-01';
  const cleanCode = rawCode.replace(/^STF-STORE-/, '').replace(/^STF-/, '');
  const pickerDisplay = cleanCode.length > 8 ? `#${cleanCode.slice(-4)}` : `#${cleanCode}`;

  const handleToggleShift = async () => {
    if (shiftLoading) return;
    const targetState = !isOnShift;
    try {
      await toggleShift(targetState);
      setToastMessage(targetState ? '🟢 Shift Started · Ready to receive orders' : '⚪ Shift Ended · Store off-duty');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (e: any) {
      setToastMessage('⚠️ Failed to update shift. Please try again.');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Row 1: 🏪 Store Name + [ON SHIFT] Toggle */}
      <View style={styles.rowOne}>
        <View style={styles.leftRowOne}>
          {subScreen ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSubScreen(null)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.storeBadge}>
              <Ionicons name="storefront" size={17} color={COLORS.primary} />
            </View>
          )}

          <Text style={styles.storeName} numberOfLines={1} ellipsizeMode="tail">
            {displayStoreName}
          </Text>
        </View>

        <View style={styles.rightRowOne}>
          {/* ON SHIFT Toggle Pill Button */}
          <TouchableOpacity
            style={[
              styles.shiftPill,
              isOnShift ? styles.shiftPillOn : styles.shiftPillOff,
            ]}
            onPress={handleToggleShift}
            activeOpacity={0.8}
            disabled={shiftLoading}
          >
            {shiftLoading ? (
              <ActivityIndicator size="small" color={isOnShift ? COLORS.primary : COLORS.danger} />
            ) : (
              <>
                <Animated.View
                  style={[
                    styles.pulseDot,
                    {
                      backgroundColor: isOnShift ? COLORS.primary : COLORS.danger,
                      transform: isOnShift ? [{ scale: pulseAnim }] : [],
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.shiftPillText,
                    { color: isOnShift ? COLORS.primary : COLORS.danger },
                  ]}
                >
                  {isOnShift ? 'ON SHIFT' : 'OFF SHIFT'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* 🔔 Notification Bell Button */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => setNotificationModalVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Store Notifications"
          >
            <Ionicons name="notifications" size={19} color="#FFF" />
            {storeUnreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{storeUnreadCount > 99 ? '99+' : storeUnreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ☰ Hamburger Menu Button */}
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={() => setSidebarOpen(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="menu" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Row 2: 📍 Area · City (Left) + Picker Code (Right) */}
      <View style={styles.rowTwo}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-sharp" size={12} color={COLORS.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {areaName} <Text style={styles.dotSeparator}>·</Text> {cityName}
          </Text>
        </View>

        <View style={styles.pickerCodeBadge}>
          <Text style={styles.pickerCodeText}>Picker: {pickerDisplay}</Text>
        </View>
      </View>

      {/* Feedback Toast Notification */}
      {toastMessage && (
        <View style={styles.toastBox}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Unified Scoped Store Notification Modal */}
      <StoreNotificationModal
        visible={isNotificationModalVisible}
        onClose={() => {
          setNotificationModalVisible(false);
          refreshUnreadCount?.();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0A1449',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    minHeight: 68,
    justifyContent: 'center',
  },
  rowOne: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftRowOne: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 10,
    gap: 8,
  },
  storeBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  storeName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.1,
  },
  rightRowOne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  hamburgerBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bellBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  shiftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    flexShrink: 0,
    minWidth: 92,
    justifyContent: 'center',
    height: 32,
  },
  shiftPillOn: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  shiftPillOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  shiftPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rowTwo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
    paddingLeft: 40, // Aligns under the store title
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 11.5,
    fontWeight: '500',
  },
  dotSeparator: {
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 2,
  },
  pickerCodeBadge: {
    flexShrink: 0,
  },
  pickerCodeText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  toastBox: {
    position: 'absolute',
    bottom: -32,
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
