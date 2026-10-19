import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useKYCBanner, KYCBannerData } from '../hooks/useKYCBanner';
import { useApp } from '../context/AppContext';

export interface KYCBannerProps {
  onPressAction?: (action: string) => void;
}

export const KYCBanner: React.FC<KYCBannerProps> = ({ onPressAction }) => {
  const { bannerData, isVisible, loading, dismissBanner } = useKYCBanner();
  const { setActiveScreen } = useApp();

  const translateY = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible && bannerData) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, bannerData]);

  if (!isVisible || !bannerData) return null;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handleCtaPress = () => {
    if (onPressAction) {
      onPressAction(bannerData.ctaAction);
      return;
    }

    switch (bannerData.ctaAction) {
      case 'OPEN_KYC':
      case 'RESUBMIT':
      case 'VIEW_STATUS':
      case 'VIEW_WALLET':
      default:
        setActiveScreen('KYC');
    }
  };

  const renderIcon = () => {
    switch (bannerData.bannerType) {
      case 'SUCCESS':
        return <CheckCircle2 size={26} color="#10B981" />;
      case 'INFO':
        return <Clock size={26} color="#3B82F6" />;
      case 'ERROR':
        return <XCircle size={26} color="#EF4444" />;
      case 'WARNING':
      default:
        return <AlertTriangle size={26} color="#F59E0B" />;
    }
  };

  const isVerified = bannerData.bannerType === 'SUCCESS';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bannerData.backgroundColor || '#FEF3C7',
          borderColor: bannerData.borderColor || '#FCD34D',
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleCtaPress}
        style={styles.innerRow}
      >
        <View style={styles.iconWrap}>{renderIcon()}</View>

        <View style={styles.textWrap}>
          <Text
            style={[
              styles.titleText,
              { color: bannerData.textColor || '#92400E' },
            ]}
            numberOfLines={1}
          >
            {bannerData.title}
          </Text>
          <Text
            style={[
              styles.subtitleText,
              { color: bannerData.textColor || '#B45309' },
            ]}
            numberOfLines={1}
          >
            {bannerData.subtitle}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCtaPress}
          style={[
            styles.ctaButton,
            isVerified ? styles.ctaButtonOutlined : styles.ctaButtonSolid,
            bannerData.bannerType === 'ERROR' && styles.ctaButtonRed,
            bannerData.bannerType === 'INFO' && styles.ctaButtonBlue,
          ]}
        >
          <Text
            style={[
              styles.ctaButtonText,
              isVerified ? styles.ctaButtonTextOutlined : styles.ctaButtonTextSolid,
            ]}
          >
            {bannerData.ctaText}
          </Text>
          {!isVerified && <ChevronRight size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />}
        </TouchableOpacity>

        {bannerData.isDismissible && (
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={dismissBanner}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color="rgba(0,0,0,0.4)" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
  },
  ctaButtonSolid: {
    backgroundColor: '#D97706', // Solid amber
  },
  ctaButtonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: '#166534',
  },
  ctaButtonRed: {
    backgroundColor: '#DC2626',
  },
  ctaButtonBlue: {
    backgroundColor: '#2563EB',
  },
  ctaButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ctaButtonTextSolid: {
    color: '#FFFFFF',
  },
  ctaButtonTextOutlined: {
    color: '#166534',
  },
  dismissBtn: {
    marginLeft: 6,
    padding: 3,
  },
});
