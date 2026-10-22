import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storageService';

export const S01_SplashScreen: React.FC = () => {
  const { setActiveScreen } = useApp();
  const { isAuthenticated, isLoading } = useAuth();

  const setActiveScreenRef = useRef(setActiveScreen);
  setActiveScreenRef.current = setActiveScreen;

  const authStateRef = useRef({ isAuthenticated, isLoading });
  authStateRef.current = { isAuthenticated, isLoading };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNavigatedRef = useRef<boolean>(false);

  const navigateNext = async () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (setActiveScreenRef.current) {
      try {
        const isOnboardingDone = await StorageService.getItem<boolean>(
          StorageService.KEYS.ONBOARDING_DONE,
          false
        );

        // If user is already authenticated or already went through onboarding, go straight to dashboard
        if (authStateRef.current.isAuthenticated || isOnboardingDone) {
          setActiveScreenRef.current('Blinkit_Home');
        } else {
          // First time opening app: display onboarding screens first
          setActiveScreenRef.current('C02_Onboarding1');
        }
      } catch (e) {
        setActiveScreenRef.current('C02_Onboarding1');
      }
    }
  };

  useEffect(() => {
    // 1.5-second splash screen display, guaranteed to complete auth check and route
    timerRef.current = setTimeout(() => {
      navigateNext();
    }, 1500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []); // Run ONCE on mount

  return (
    <Pressable onPress={navigateNext} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FED2EB" translucent />
      <View style={styles.centerStage}>
        <Image
          source={require('../../assets/splashfinal.png')}
          style={styles.splashImage}
          resizeMode="cover"
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FED2EB',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  centerStage: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: '100%',
    height: '100%',
    maxWidth: 520,
  },
});
