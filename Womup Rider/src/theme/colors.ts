export const COLORS = {
  // Brand Main Colors (WormUp Delivery Partner SRS)
  navy: '#071B52',
  hotPink: '#FF3B98',
  primaryPink: '#FF3B98',
  purple: '#7C3AED',
  blue: '#3B82F6',
  deepPurple: '#0A0F2E',
  darkBlue: '#071B52',

  // Rider Operational Status Colors
  onlineGreen: '#13B978',
  onlineGreenDark: '#059669',
  onlineGreenLight: '#D1FAE5',
  offlineGray: '#64748B',
  offlineGrayLight: '#F1F5F9',
  busyOrange: '#F59E0B',
  busyOrangeLight: '#FEF3C7',

  // Neutrals & Surface
  white: '#FFFFFF',
  cardBackground: '#FFFFFF',
  cardWhite: '#FFFFFF',
  lightBlueLavender: '#F1F5F9',
  lightPink: '#FDF2F8',
  border: '#E2E8F0',
  textMuted: '#64748B',
  secondaryText: '#94A3B8',
  textPrimary: '#071B52',
  darkSurface: '#071B52',

  // Functional / Alert
  success: '#13B978',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Rider Action Accents
  primary: '#FF3B98',
  secondary: '#071B52',
  accent: '#FF3B98',
  background: '#F8FAFC',
} as const;

export const GRADIENTS = {
  primary: ['#FF3B98', '#E11D48'] as [string, string],
  primaryPink: ['#FF3B98', '#E11D48'] as [string, string],
  pinkMagenta: ['#FF3B98', '#D946EF'] as [string, string],
  riderOnline: ['#13B978', '#059669'] as [string, string],
  riderOffline: ['#64748B', '#334155'] as [string, string],
  navyHeader: ['#071B52', '#0A0F2E'] as [string, string],
  splashNavy: ['#071B52', '#0A0F2E'] as [string, string],
  purpleBlue: ['#7C3AED', '#3B82F6'] as [string, string],
  goldEarnings: ['#F59E0B', '#D97706'] as [string, string],
} as const;
