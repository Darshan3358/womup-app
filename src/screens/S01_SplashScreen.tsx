import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export const S01_SplashScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setActiveScreen } = useApp();

  const setActiveScreenRef = useRef(setActiveScreen);
  setActiveScreenRef.current = setActiveScreen;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNavigatedRef = useRef<boolean>(false);

  const navigateToHome = () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (setActiveScreenRef.current) {
      setActiveScreenRef.current('Blinkit_Home');
    }
  };

  useEffect(() => {
    // Exactly 2-second splash screen display, guaranteed to complete without restart
    timerRef.current = setTimeout(() => {
      navigateToHome();
    }, 2000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []); // Run ONCE on mount

  // Clean, focused logo sizing (no animations)
  const logoWidth = Math.min(width * 0.65, 270);
  const logoHeight = Math.round(logoWidth * (277 / 338));

  return (
    <Pressable
      onPress={navigateToHome}
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
    </Pressable>
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
