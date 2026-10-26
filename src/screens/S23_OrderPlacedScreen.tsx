import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';

// Resolve video asset for Metro / Web
const orderVideoAsset = require('../../assets/order_placed_video.mp4');

const getVideoSourceUrl = () => {
  if (typeof orderVideoAsset === 'string') return orderVideoAsset;
  if (orderVideoAsset?.uri) return orderVideoAsset.uri;
  if (orderVideoAsset?.default) return orderVideoAsset.default;
  try {
    const resolved = Image.resolveAssetSource(orderVideoAsset);
    if (resolved?.uri) return resolved.uri;
  } catch (e) {}
  return '/assets/assets/order_placed_video.mp4';
};

const videoSourceUrl = getVideoSourceUrl();

export const S23_OrderPlacedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { currentOrder, setActiveScreen } = useApp();

  const [showVideo, setShowVideo] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(5);

  const videoFadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const isFinishedRef = useRef(false);

  const orderNum = currentOrder?.orderNumber || '#W' + Math.floor(10000000 + Math.random() * 90000000);
  const total = currentOrder?.totalAmount || 348;

  // Gracefully finish the video after 5s and reveal order placed screen
  const handleFinishVideo = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (err) {}
    }

    // Smooth dissolve from video to order confirmation
    Animated.parallel([
      Animated.timing(videoFadeAnim, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowVideo(false);
    });
  }, [videoFadeAnim, contentFadeAnim]);

  useEffect(() => {
    // Animate progress bar over exactly 5.0 seconds
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // 5-second countdown timer
    let count = 5;
    timerRef.current = setInterval(() => {
      count -= 1;
      setSecondsRemaining(Math.max(count, 0));
      if (count <= 0) {
        handleFinishVideo();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleFinishVideo, progressAnim]);

  const handleTimeUpdate = (e: any) => {
    // Strictly cap video playback to first 5 seconds
    if (e.target && e.target.currentTime >= 5.0) {
      e.target.pause();
      handleFinishVideo();
    }
  };

  return (
    <View style={styles.rootContainer}>
      {/* 1. Full-Screen Order Placement Celebration Video (First 5 Seconds Only) */}
      {showVideo && (
        <Animated.View
          style={[
            styles.fullscreenVideoOverlay,
            {
              opacity: videoFadeAnim,
            },
          ]}
        >
          {Platform.OS === 'web' ? (
            // @ts-ignore
            <video
              ref={videoRef}
              src={videoSourceUrl}
              autoPlay
              playsInline
              muted
              onTimeUpdate={handleTimeUpdate}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: '#05052A',
              }}
            />
          ) : (
            <View style={styles.nativeFallback}>
              <View style={styles.pulseRing} />
              <Ionicons name="checkmark-circle" size={88} color="#EC4A9D" />
            </View>
          )}

          {/* Top Floating Header with Timer & Skip */}
          <View style={[styles.videoHeaderRow, { top: insets.top + 16 }]}>
            <View style={styles.badgePill}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeText}>Order Confirmed</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleFinishVideo}
              style={styles.skipButton}
              accessibilityLabel="Skip intro video"
            >
              <Text style={styles.skipText}>Skip ({secondsRemaining}s) →</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Glowing 5-Second Progress Bar */}
          <View style={[styles.videoFooter, { bottom: insets.bottom + 24 }]}>
            <Text style={styles.videoFooterTitle}>Placing your 9-minute order...</Text>
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* 2. Order Placed Confirmation Screen */}
      <Animated.View
        style={[
          styles.container,
          {
            opacity: showVideo ? contentFadeAnim : 1,
            paddingTop: insets.top + 30,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.content}>
          {/* Success Checkmark Circle */}
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={48} color={COLORS.white} />
          </View>

          <Text style={styles.title}>Order Placed Successfully!</Text>
          <Text style={styles.subtitle}>
            Your order <Text style={styles.orderNumberBold}>{orderNum}</Text> has been placed.
          </Text>
          <Text style={styles.note}>
            Delivery partner will be assigned shortly and order delivered in 9 minutes.
          </Text>

          {/* Mini Order Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order Total</Text>
              <Text style={styles.summaryValue}>₹{total}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Delivery</Text>
              <Text style={styles.deliveryTime}>9 – 12 mins</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <GradientButton
            title="Track Order"
            onPress={() => setActiveScreen('C24_OrderTracking')}
            style={styles.trackButton}
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveScreen('Blinkit_Home')}
            style={styles.homeButton}
          >
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  fullscreenVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#05052A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  nativeFallback: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#05052A',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(236, 74, 157, 0.4)',
  },
  videoHeaderRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10001,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  videoFooter: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10001,
    gap: 10,
  },
  videoFooterTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EC4A9D',
    borderRadius: 2,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    marginTop: 40,
  },
  checkmarkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  orderNumberBold: {
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  note: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: SPACING.xl,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deliveryTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  trackButton: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  homeButton: {
    padding: SPACING.sm,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
