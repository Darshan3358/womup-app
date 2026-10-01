import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/storageService';
import { AuthService } from '../services/authService';
import { api } from '../services/api';

export const S01_SplashScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { setActiveScreen, setUser } = useApp();

  // Animation controllers for pure 4-second splash
  const screenFadeOut = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;

  const targetScreenRef = useRef<string>('Blinkit_Home');

  useEffect(() => {
    let isMounted = true;

    // Check saved session in parallel with 4s splash
    const checkSession = async () => {
      try {
        const token = await StorageService.getItem<string | null>(
          StorageService.KEYS.AUTH_TOKEN,
          null
        );
        const savedUser = await StorageService.getItem<any | null>(
          StorageService.KEYS.USER,
          null
        );
        const savedScreen = await StorageService.getItem<string | null>(
          StorageService.KEYS.ACTIVE_SCREEN,
          null
        );

        if (token) {
          api.setToken(token);
          if (savedUser && isMounted) {
            setUser(savedUser);
          }

          const validTarget =
            savedScreen &&
            savedScreen !== 'C01_Splash' &&
            savedScreen !== 'C02_Onboarding1' &&
            savedScreen !== 'C03_Onboarding2' &&
            savedScreen !== 'C04_Onboarding3' &&
            savedScreen !== 'C05_Onboarding4' &&
            savedScreen !== 'C06_MobileNumber' &&
            savedScreen !== 'C07_OtpVerification'
              ? (savedScreen as any)
              : 'Blinkit_Home';
          targetScreenRef.current = validTarget;
        } else {
          targetScreenRef.current = 'Blinkit_Home';
        }
      } catch (e) {
        console.warn('Session check error:', e);
        targetScreenRef.current = 'Blinkit_Home';
      }
    };

    checkSession();

    // Exactly 4-second splash animation sequence:
    // 0.0s - 0.8s: Logo fades in and smoothly scales up to full size
    // 0.8s - 3.4s: Logo remains crisp, full, and prominent with subtle ambient aura
    // 3.4s - 4.0s: Graceful fade-out into the main app (total: 4000ms)
    Animated.parallel([
      // Logo Entrance
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.85,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 1.15,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Hold full display
        Animated.delay(2200),
        // Smooth transition out at 3.4s
        Animated.parallel([
          Animated.timing(screenFadeOut, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1.04,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      if (isMounted) {
        setActiveScreen(targetScreenRef.current as any);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [logoOpacity, logoScale, glowOpacity, glowScale, screenFadeOut, setActiveScreen, setUser]);

  // Clean, focused logo sizing
  const logoWidth = Math.min(width * 0.65, 270);
  const logoHeight = Math.round(logoWidth * (277 / 338));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenFadeOut,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.centerStage}>
        {/* Soft atmospheric radial glow behind logo */}
        <Animated.View
          style={[
            styles.radialGlow,
            {
              width: logoWidth * 1.5,
              height: logoWidth * 1.5,
              borderRadius: (logoWidth * 1.5) / 2,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
          pointerEvents="none"
        />

        {/* Central Clear WOM UP Logo from assets/Wormup.png */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              width: logoWidth,
              height: logoHeight,
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/Wormup.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05052A', // Deep midnight navy brand background
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  radialGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(236, 74, 157, 0.18)',
    shadowColor: '#EC4A9D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
