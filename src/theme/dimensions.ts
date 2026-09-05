import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base screen reference (standard 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

export const scaleWidth = (size: number): number => {
  return Math.round((SCREEN_WIDTH / BASE_WIDTH) * size);
};

export const scaleHeight = (size: number): number => {
  return Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);
};

export const moderateScale = (size: number, factor = 0.5): number => {
  return Math.round(size + (scaleWidth(size) - size) * factor);
};

export const DIMENSIONS = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH <= 360,
  isTablet: SCREEN_WIDTH > 430,
  baseBottomNavHeight: 60,
};
