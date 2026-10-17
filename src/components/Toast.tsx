import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  onPress?: () => void;
}

interface ToastCardProps {
  item: ToastItem;
  index: number;
  onDismiss: (id: string) => void;
}

const TYPE_CONFIG: Record<
  ToastType,
  {
    bg: string;
    border: string;
    icon: (color: string) => React.ReactNode;
    defaultDuration: number;
  }
> = {
  success: {
    bg: '#10B981',
    border: '#059669',
    icon: (c) => <CheckCircle2 size={22} color={c} />,
    defaultDuration: 3000,
  },
  error: {
    bg: '#EF4444',
    border: '#DC2626',
    icon: (c) => <XCircle size={22} color={c} />,
    defaultDuration: 4000,
  },
  warning: {
    bg: '#F59E0B',
    border: '#D97706',
    icon: (c) => <AlertTriangle size={22} color={c} />,
    defaultDuration: 4000,
  },
  info: {
    bg: '#3B82F6',
    border: '#2563EB',
    icon: (c) => <Info size={22} color={c} />,
    defaultDuration: 3000,
  },
  loading: {
    bg: '#1F2937',
    border: '#111827',
    icon: (c) => <ActivityIndicator size="small" color={c} />,
    defaultDuration: 0, // Persistent until dismissed
  },
};

export const ToastCard: React.FC<ToastCardProps> = ({ item, index, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Entrance Animation: Slide down + fade in + scale spring
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: index * 10,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1 - index * 0.04,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss timer
    const duration =
      item.duration !== undefined ? item.duration : config.defaultDuration;
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index]);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(item.id);
    });
  };

  // Swipe up gesture handler to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy < -6 || Math.abs(gestureState.dx) > 15;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(index * 10 + gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30 || gestureState.vy < -0.5) {
          dismiss();
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: index * 10,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY }, { scale }],
          opacity,
          zIndex: 1000 - index,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={item.onPress ? 0.85 : 1}
        onPress={() => {
          if (item.onPress) item.onPress();
        }}
        style={[
          styles.toastContainer,
          {
            backgroundColor: config.bg,
            borderColor: config.border,
          },
        ]}
      >
        <View style={styles.iconContainer}>{config.icon('#FFFFFF')}</View>

        <View style={styles.textContainer}>
          {item.title ? (
            <Text style={styles.titleText} numberOfLines={1}>
              {item.title}
            </Text>
          ) : null}
          <Text style={styles.messageText} numberOfLines={2}>
            {item.message}
          </Text>
        </View>

        {item.type !== 'loading' && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={dismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color="rgba(255, 255, 255, 0.85)" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

interface ToastOverlayProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastOverlay: React.FC<ToastOverlayProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  // Show top 3 toasts only (FIFO queue)
  const visibleToasts = toasts.slice(0, 3);

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {visibleToasts.map((toast, idx) => (
        <ToastCard key={toast.id} item={toast} index={idx} onDismiss={onDismiss} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 28,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  toastWrapper: {
    position: 'absolute',
    width: '92%',
    maxWidth: 480,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
});
