import React, { useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export const R01_SplashScreen: React.FC = () => {
  const { checkSession } = useRider();

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSession();
    }, 2200);
    return () => clearTimeout(timer);
  }, [checkSession]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071B52" translucent />
      <Image
        source={require('../../../assets/screen1.png')}
        style={styles.splashImage}
        resizeMode="cover"
      />
      {/* Subtle loader indicator overlay */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#FF3B98" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071B52',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  loaderContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(7, 27, 82, 0.4)',
  },
});
