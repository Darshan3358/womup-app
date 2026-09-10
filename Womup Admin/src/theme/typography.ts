import { TextStyle } from 'react-native';
import { COLORS } from './colors';

export const TYPOGRAPHY = {
  hero: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 34,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  price: {
    fontSize: 18,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
  },
  priceMrp: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textMuted,
    textDecorationLine: 'line-through' as TextStyle['textDecorationLine'],
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.white,
    textAlign: 'center' as TextStyle['textAlign'],
  },
} as const;
