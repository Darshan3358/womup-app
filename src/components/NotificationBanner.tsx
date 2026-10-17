import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Package,
  Bike,
  Coins,
  ShieldCheck,
  Bell,
  ChevronRight,
  X,
} from 'lucide-react-native';

export interface BannerNotificationData {
  id: string;
  title: string;
  body: string;
  type?: string;
  role?: string;
  deepLink?: string;
  data?: Record<string, any>;
  onPress?: () => void;
  onDismiss?: () => void;
}

interface NotificationBannerProps {
  notification: BannerNotificationData | null;
  onDismiss: () => void;
  onPress?: (notification: BannerNotificationData) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
  onPress,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (notification) {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 5 seconds
      dismissTimer.current = setTimeout(() => {
        handleDismiss();
      }, 5000);
    } else {
      handleDismiss();
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [notification]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -20 || gestureState.vy < -0.5) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  if (!notification) return null;

  const renderIcon = () => {
    const type = (notification.type || '').toUpperCase();
    if (type.includes('ORDER') || type.includes('CONFIRMED')) {
      return <Package size={20} color="#10B981" />;
    }
    if (type.includes('RIDER') || type.includes('DELIVERY')) {
      return <Bike size={20} color="#3B82F6" />;
    }
    if (type.includes('COIN') || type.includes('WALLET') || type.includes('EARN')) {
      return <Coins size={20} color="#F59E0B" />;
    }
    if (type.includes('KYC') || type.includes('VERIFIED')) {
      return <ShieldCheck size={20} color="#8B5CF6" />;
    }
    if (type.includes('FAIL') || type.includes('REJECT') || type.includes('CANCEL')) {
      return <XCircle size={20} color="#EF4444" />;
    }
    return <Bell size={20} color="#071B52" />;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => {
          handleDismiss();
          if (onPress) onPress(notification);
          else if (notification.onPress) notification.onPress();
        }}
      >
        <View style={styles.iconBox}>{renderIcon()}</View>

        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        <View style={styles.actionCol}>
          {notification.deepLink ? (
            <ChevronRight size={18} color="#94A3B8" />
          ) : (
            <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 14,
    right: 14,
    zIndex: 99999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#071B52',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  actionCol: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
