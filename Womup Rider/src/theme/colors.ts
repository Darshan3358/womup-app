export const COLORS = {
  // Brand Main Colors
  navy: '#05062A',
  hotPink: '#F562AF',
  purple: '#8364E6',
  blue: '#515FEA',
  deepPurple: '#BF54D0',
  darkBlue: '#214CB3',

  // Rider Operational Status Colors
  onlineGreen: '#10B981',
  onlineGreenDark: '#059669',
  onlineGreenLight: '#D1FAE5',
  offlineGray: '#6B7280',
  offlineGrayLight: '#F3F4F6',
  busyOrange: '#F59E0B',
  busyOrangeLight: '#FEF3C7',

  // Neutrals & Surface
  white: '#FEFEFE',
  cardBackground: '#F4F4FA',
  lightBlueLavender: '#E2E6F9',
  lightPink: '#FCE1F5',
  border: '#D2D1E1',
  textMuted: '#636375',
  secondaryText: '#9CA3AF',
  textPrimary: '#1F2937',
  darkSurface: '#0B0D38',

  // Functional / Alert
  success: '#22A86B',
  error: '#E8596C',
  errorLight: '#FEE2E2',
  warning: '#F1B562',
  info: '#515FEA',

  // Rider Action Accents
  primary: '#F562AF',
  secondary: '#8364E6',
  accent: '#515FEA',
  background: '#F8F9FD',
} as const;

export const GRADIENTS = {
  primary: ['#F562AF', '#BF54D0', '#8364E6'] as [string, string, string],
  riderOnline: ['#10B981', '#059669'] as [string, string],
  riderOffline: ['#4B5563', '#1F2937'] as [string, string],
  navyHeader: ['#05062A', '#13154A'] as [string, string],
  purpleBlue: ['#BF54D0', '#8364E6', '#515FEA'] as [string, string, string],
  goldEarnings: ['#F59E0B', '#D97706'] as [string, string],
} as const;
