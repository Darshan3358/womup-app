import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/storageService';
import { api } from '../services/api';

export const S01_SplashScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setActiveScreen, setUser } = useApp();

  const targetScreenRef = useRef<string>('Blinkit_Home');

  useEffect(() => {
    let isMounted = true;

    // 1. Check saved session in background
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

        // Always clear any persisted active screen to ensure reloads open Home
        await StorageService.removeItem(StorageService.KEYS.ACTIVE_SCREEN);

        if (token) {
          api.setToken(token);
          if (savedUser && isMounted) {
            setUser(savedUser);
          }
        }
        // Always reset to Home on reload / launch
        targetScreenRef.current = 'Blinkit_Home';
      } catch (e) {
        console.warn('Session check error:', e);
        targetScreenRef.current = 'Blinkit_Home';
      }
    };

    checkSession();

    // 2. Simple, non-animated display for exactly 2 seconds (both web and native)
    const timer = setTimeout(() => {
      if (isMounted) {
        setActiveScreen(targetScreenRef.current as any);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [setActiveScreen, setUser]);

  // Clean, focused logo sizing (no animations)
  const logoWidth = Math.min(width * 0.65, 270);
  const logoHeight = Math.round(logoWidth * (277 / 338));

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.centerStage}>
        <Image
          source={require('../../assets/Wormup.png')}
          style={{
            width: logoWidth,
            height: logoHeight,
          }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05052A', // Deep midnight navy brand background
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
