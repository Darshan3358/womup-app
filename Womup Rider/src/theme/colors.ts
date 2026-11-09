export const COLORS = {
  // Brand Main Colors (WormUp Delivery Partner SRS Redesign)
  navy: '#101D59',
  deepNavy: '#101D59',
  darkBlue: '#101B79',
  hotPink: '#F51BA0',
  mainPink: '#F51BA0',
  primaryPink: '#F51BA0',
  brightMagenta: '#E914A7',
  purple: '#8428E8',
  violet: '#5927E6',
  blue: '#2676F4',
  green: '#06BF7B',
  orange: '#F28B37',
  red: '#F43E53',
  deepPurple: '#0D153B',

  // Rider Operational Status Colors
  onlineGreen: '#06BF7B',
  onlineGreenDark: '#059669',
  onlineGreenLight: '#D1FAE5',
  offlineGray: '#657493',
  offlineGrayLight: '#F1F5F9',
  busyOrange: '#F28B37',
  busyOrangeLight: '#FEF3C7',

  // Neutrals & Surface
  white: '#FFFFFF',
  cardBackground: '#FFFFFF',
  cardWhite: '#FFFFFF',
  mainBackground: '#F8F9FD',
  lightBlueLavender: '#F4EAFE',
  lightPink: '#FDF2F8',
  lightPinkBorder: '#F0D7FA',
  border: '#EAEFF8',
  textMuted: '#9AA5BC',
  secondaryText: '#657493',
  textPrimary: '#10215A',
  primaryText: '#10215A',
  darkSurface: '#101D59',

  // Functional / Alert
  success: '#06BF7B',
  error: '#F43E53',
  errorLight: '#FEE2E2',
  warning: '#F28B37',
  info: '#2676F4',

  // Rider Action Accents
  primary: '#F51BA0',
  secondary: '#101D59',
  accent: '#F51BA0',
  background: '#F8F9FD',
} as const;

export const GRADIENTS = {
  primary: ['#F51BA0', '#E11D48'] as [string, string],
  primaryPink: ['#F51BA0', '#E11D48'] as [string, string],
  pinkMagenta: ['#F51BA0', '#8428E8'] as [string, string],
  header: ['#FF21A7', '#8B22DA', '#101B82'] as [string, string, string],
  mainEarnings: ['#F922A4', '#C30CB6', '#7227DF', '#233DF0'] as [string, string, string, string],
  promoBanner: ['#F922A4', '#C30CB6', '#7227DF', '#233DF0'] as [string, string, string, string],
  actionGreen: ['#06BF7B', '#059669'] as [string, string],
  actionBlue: ['#2676F4', '#1E40AF'] as [string, string],
  riderOnline: ['#06BF7B', '#059669'] as [string, string],
  riderOffline: ['#657493', '#334155'] as [string, string],
  navyHeader: ['#101D59', '#0D153B'] as [string, string],
  splashNavy: ['#101D59', '#0D153B'] as [string, string],
  purpleBlue: ['#8428E8', '#2676F4'] as [string, string],
  goldEarnings: ['#F28B37', '#D97706'] as [string, string],
} as const;
