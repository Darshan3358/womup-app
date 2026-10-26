export const COLORS = {
  // Global Design System Palette (Navy & Pink Premium SRS)
  primaryNavy: '#071B52',
  navy: '#071B52',
  primaryPink: '#FF3B98',
  pink: '#FF3B98',
  hotPink: '#FF3B98',
  successGreen: '#13B978',
  green: '#13B978',
  warningOrange: '#F59E0B',
  orange: '#F59E0B',
  dangerRed: '#EF4444',
  danger: '#EF4444',
  red: '#EF4444',
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardWhite: '#FFFFFF',
  white: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Primary & Accents
  primary: '#FF3B98', // Main Brand Pink
  primaryDark: '#E11D48',
  primaryLight: '#FDF2F8',
  primaryGlow: 'rgba(255, 59, 152, 0.15)',

  // Secondary & Accents
  accentCyan: '#06B6D4',
  accentBlue: '#3B82F6',
  accentPurple: '#8B5CF6',

  // Status & Alerts
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.12)',
  dangerBg: 'rgba(239, 68, 68, 0.12)',
  success: '#13B978',
  successBg: 'rgba(19, 185, 120, 0.12)',
  info: '#3B82F6',

  // Typography
  textPrimary: '#071B52',
  textSecondary: '#64748B',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  // Hub Special Elements
  shelfBadgeBg: '#EEF2FF',
  shelfBadgeText: '#4F46E5',
  barcodeOverlay: 'rgba(255, 59, 152, 0.25)',
  laserColor: '#FF3B98',
};

export const GRADIENTS = {
  primaryPink: ['#FF3B98', '#E11D48'] as [string, string],
  primary: ['#FF3B98', '#E11D48'] as [string, string],
  navyHeader: ['#071B52', '#0A0F2E'] as [string, string],
  motivation: ['#FF3B98', '#8B5CF6'] as [string, string],
  successGreen: ['#13B978', '#059669'] as [string, string],
} as const;
