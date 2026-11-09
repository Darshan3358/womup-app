export const COLORS = {
  // Global Design System Palette (Navy & Pink Premium SRS)
  primaryNavy: '#071B52',
  navy: '#071B52',
  primaryPink: '#F52B99',
  pink: '#F52B99',
  hotPink: '#F52B99',
  mainPink: '#F52B99',
  primaryPurple: '#7031E8',
  deepPurple: '#4327C9',
  headerNavy: '#151A59',
  primaryText: '#101A4B',
  secondaryText: '#697493',
  mainBackground: '#FAF9FF',
  pinkBorder: '#F5C8E7',
  purpleBorder: '#E4D5FF',
  blueAccent: '#278BFA',
  successGreen: '#24B96F',
  green: '#24B96F',
  successBg: '#DDF8E9',
  mutedText: '#929CB5',
  warningOrange: '#F59E0B',
  orange: '#F59E0B',
  dangerRed: '#EF4444',
  danger: '#EF4444',
  red: '#EF4444',
  background: '#FAF9FF',
  card: '#FFFFFF',
  cardWhite: '#FFFFFF',
  white: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Primary & Accents
  primary: '#F52B99', // Main Brand Pink
  primaryDark: '#E11D48',
  primaryLight: '#FDF2F8',
  primaryGlow: 'rgba(245, 43, 153, 0.15)',

  // Secondary & Accents
  accentCyan: '#06B6D4',
  accentBlue: '#278BFA',
  accentPurple: '#7031E8',

  // Status & Alerts
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.12)',
  dangerBg: 'rgba(239, 68, 68, 0.12)',
  success: '#24B96F',
  info: '#278BFA',

  // Typography
  textPrimary: '#101A4B',
  textSecondary: '#697493',
  textMuted: '#929CB5',
  textInverse: '#FFFFFF',

  // Hub Special Elements
  shelfBadgeBg: '#EEF2FF',
  shelfBadgeText: '#4F46E5',
  barcodeOverlay: 'rgba(245, 43, 153, 0.25)',
  laserColor: '#F52B99',
};

export const GRADIENTS = {
  primaryPink: ['#F52B99', '#E11D48'] as [string, string],
  primary: ['#F52B99', '#E11D48'] as [string, string],
  navyHeader: ['#071B52', '#0A0F2E'] as [string, string],
  header: ['#FA35A5', '#A72CC7', '#34229E'] as [string, string, string],
  motivation: ['#FF2B98', '#7031E8', '#4327C9'] as [string, string, string],
  banner: ['#FA35A5', '#A72CC7', '#5129ED'] as [string, string, string],
  successGreen: ['#24B96F', '#059669'] as [string, string],
} as const;
