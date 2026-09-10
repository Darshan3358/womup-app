import { TextStyle } from 'react-native';
import { COLORS } from './colors';

export const TYPOGRAPHY = {
  // Hero / ETA display headline ("9 minutes", "Prints in 10 minutes")
  hero: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.white,
    lineHeight: 34,
  },
  displayLg: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 34,
  },
  // Section titles ("Bestsellers", "Print Store", "Featured this week")
  headingLg: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  // Product titles, screen titles ("Citizen Raincoat...", "Profile", "Documents")
  headingMd: {
    fontSize: 17,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  // Body copy, list row labels, card descriptions
  bodyMd: {
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  bodyMdMedium: {
    fontSize: 15,
    fontWeight: '500' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  // Subtext, timestamps, category labels
  bodySm: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  bodySmMedium: {
    fontSize: 13,
    fontWeight: '500' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  bodySmBold: {
    fontSize: 13,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  // Badges, "+149 more", stock counters, review counts
  caption: {
    fontSize: 11,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textMuted,
    lineHeight: 15,
  },
  captionBold: {
    fontSize: 11,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 15,
  },
  captionWhite: {
    fontSize: 11,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.white,
    lineHeight: 15,
  },
  // Selling price
  priceLg: {
    fontSize: 18,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
  },
  // Strikethrough MRP
  priceStrike: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textMuted,
    textDecorationLine: 'line-through' as TextStyle['textDecorationLine'],
  },
  // Primary CTA buttons ("Add to cart", "Shop now", "Upload Files")
  button: {
    fontSize: 15,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.white,
    textAlign: 'center' as TextStyle['textAlign'],
  },
  // Backward compatibility aliases
  titleLarge: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.textPrimary,
    lineHeight: 22,
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
} as const;
