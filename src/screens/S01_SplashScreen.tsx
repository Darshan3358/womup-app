import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storageService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const S01_SplashScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen } = useApp();
  const { isAuthenticated, isLoading } = useAuth();

  const setActiveScreenRef = useRef(setActiveScreen);
  setActiveScreenRef.current = setActiveScreen;

  const authStateRef = useRef({ isAuthenticated, isLoading });
  authStateRef.current = { isAuthenticated, isLoading };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNavigatedRef = useRef<boolean>(false);

  // Smooth animation values to prevent any flash or abrupt jump
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(0.95)).current;

  const navigateNext = async () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Smooth exit fade transition
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(async () => {
      if (setActiveScreenRef.current) {
        try {
          const isOnboardingDone = await StorageService.getItem<boolean>(
            StorageService.KEYS.ONBOARDING_DONE,
            false
          );

          if (authStateRef.current.isAuthenticated || isOnboardingDone) {
            setActiveScreenRef.current('Blinkit_Home');
          } else {
            setActiveScreenRef.current('C02_Onboarding1');
          }
        } catch (e) {
          setActiveScreenRef.current('C02_Onboarding1');
        }
      }
    });
  };

  useEffect(() => {
    // Smooth initial stabilization
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 1.6-second balanced splash display
    timerRef.current = setTimeout(() => {
      navigateNext();
    }, 1600);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const logoWidth = Math.min(SCREEN_WIDTH * 0.72, 310);
  const logoHeight = logoWidth * (338 / 366); // Exact preserved aspect ratio of clean logo

  const illustrationHeight = Math.min(SCREEN_HEIGHT * 0.32, 240);
  const bottomSafePadding = Math.max(insets.bottom, Platform.OS === 'android' ? 20 : 12);

  return (
    <Pressable onPress={navigateNext} style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FED2EB"
        translucent={Platform.OS === 'android'}
      />

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: bottomSafePadding,
          },
        ]}
      >
        {/* CENTER STAGE: Approved WOMART Logo with strict aspect ratio */}
        <Animated.View
          style={[
            styles.centerLogoContainer,
            {
              opacity: contentFade,
            },
          ]}
        >
          <Image
            source={require('../../assets/womart_logo_clean.png')}
            style={[
              styles.logoImage,
              {
                width: logoWidth,
                height: logoHeight,
              },
            ]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* BOTTOM STAGE: Shopping Line-Art Illustration safely padded above navigation bar */}
        <View style={[styles.bottomIllustrationContainer, { height: illustrationHeight }]}>
          <Image
            source={require('../../assets/womart_illustration_clean.png')}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FED2EB',
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FED2EB',
  },
  centerLogoContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  logoImage: {
    alignSelf: 'center',
  },
  bottomIllustrationContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
    maxWidth: 440,
  },
});
