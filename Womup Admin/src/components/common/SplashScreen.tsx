import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Dimensions, ActivityIndicator, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#05062A" translucent />
      <Image
        source={require('../../../assets/admin_splash.png')}
        style={styles.splashImage}
        resizeMode="cover"
      />
      <View style={styles.loaderArea}>
        <ActivityIndicator size="small" color="#FF3B98" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#05062A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  splashImage: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loaderArea: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 6, 42, 0.4)',
  },
});
