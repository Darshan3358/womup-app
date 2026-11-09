import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useStore } from '../../context/StoreContext';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { StoreNotificationModal } from './StoreNotificationModal';

export const Header: React.FC = () => {
  const {
    staff,
    store,
    subScreen,
    setSubScreen,
    toggleShift,
    shiftLoading,
    setSidebarOpen,
    storeUnreadCount,
    refreshUnreadCount,
  } = useStore();

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
  let displayStoreName = store?.name || 'Chandlodiya';
  if (displayStoreName.startsWith('Wom Up ')) {
    displayStoreName = displayStoreName.slice(7).trim();
  }
  if (displayStoreName.endsWith(' Dark Store')) {
    displayStoreName = displayStoreName.replace(/\s*Dark\s*Store$/i, '').trim();
  }
  if (displayStoreName.includes(' - ')) {
    displayStoreName = displayStoreName.split(' - ')[0].trim();
  }

  // Location info
  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Chandlodiya - Tragad');

  const handleToggleShift = async () => {
    if (shiftLoading) return;
    const targetState = !isOnShift;
    setToastMessage(targetState ? '🟢 Shift Started · Ready to receive orders' : '⚪ Shift Ended · Store off-duty');
    setTimeout(() => setToastMessage(null), 2500);
    try {
      await toggleShift(targetState);
    } catch (_) {
      // Non-fatal: optimistic and offline persistence already saved
    }
  };

  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={['#FA35A5', '#A72CC7', '#34229E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.9 }}
        style={styles.gradientHeader}
      >
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          {/* Left: Store Logo or Back Button + Store Identity */}
          <View style={styles.leftGroup}>
            {subScreen ? (
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => setSubScreen(null)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Go Back"
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.logoBox}>
                <Image
                  source={require('../../../assets/Wormup.png')}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
            )}

            <View style={styles.storeTextWrapper}>
              <View style={styles.storeTitleRow}>
                <Text style={styles.storeNameText} numberOfLines={1}>
                  {subScreen ? subScreen : displayStoreName}
                </Text>
                {!subScreen && (
                  <Ionicons name="chevron-down" size={15} color="#FFFFFF" style={{ marginLeft: 3 }} />
                )}
              </View>

              {!subScreen && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={11} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {areaName}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Right: Shift Pill + Bell + Menu */}
          <View style={styles.rightGroup}>
            {/* Shift Pill Button */}
            <TouchableOpacity
              style={[
                styles.shiftPill,
                isOnShift ? styles.shiftPillOn : styles.shiftPillOff,
              ]}
              onPress={handleToggleShift}
              activeOpacity={0.8}
              disabled={shiftLoading}
              accessibilityLabel={`Current shift: ${isOnShift ? 'On Shift' : 'Off Shift'}. Tap to toggle.`}
            >
              {shiftLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Animated.View
                    style={[
                      styles.shiftDot,
                      {
                        backgroundColor: isOnShift ? '#10B981' : '#F43F5E',
                        transform: isOnShift ? [{ scale: pulseAnim }] : [],
                      },
                    ]}
                  />
                  <Text style={styles.shiftPillText}>
                    {isOnShift ? 'ON SHIFT' : 'OFF SHIFT'}
                  </Text>
                  <Ionicons name="chevron-down" size={11} color="rgba(255, 255, 255, 0.8)" style={{ marginLeft: 2 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Notification Bell Button */}
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => setNotificationModalVisible(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications" size={18} color="#FFFFFF" />
              {Boolean(storeUnreadCount && storeUnreadCount > 0) && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {storeUnreadCount! > 99 ? '99+' : storeUnreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Hamburger Menu Button */}
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => setSidebarOpen(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Main Menu"
            >
              <Ionicons name="menu" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Decorative soft wave at the bottom */}
        <View style={styles.waveSvgContainer} pointerEvents="none">
          <Svg width="100%" height={20} viewBox="0 0 375 20" preserveAspectRatio="none">
            <Path
              d="M 0 0 Q 90 18 190 6 T 375 14 L 375 20 L 0 20 Z"
              fill="rgba(255, 255, 255, 0.08)"
            />
          </Svg>
        </View>
      </LinearGradient>

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
  outerContainer: {
    backgroundColor: '#FAF9FF',
    position: 'relative',
    zIndex: 10,
  },
  gradientHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#4327C9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 2,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#25105F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImg: {
    width: 30,
    height: 30,
  },
  storeTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeNameText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11.5,
    fontWeight: '500',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  shiftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 5,
    borderWidth: 1,
  },
  shiftPillOn: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  shiftPillOff: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  shiftDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  shiftPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF2B98',
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  waveSvgContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    opacity: 0.6,
  },
  toastBox: {
    position: 'absolute',
    bottom: -32,
    left: 16,
    right: 16,
    backgroundColor: '#1E1B4B',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
