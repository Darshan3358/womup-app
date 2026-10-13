import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export const ST01_SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071B52" translucent />
      <Image
        source={require('../../../assets/splashstorescreen.png')}
        style={styles.splashImage}
        resizeMode="cover"
      />
      {/* Subtle bottom loader */}
      <View style={styles.loaderArea}>
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
  loaderArea: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(7, 27, 82, 0.4)',
  },
});
