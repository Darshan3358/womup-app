export const COLORS = {
  // Main brand colors
  navy: '#05062A',
  hotPink: '#F562AF',
  purple: '#8364E6',
  blue: '#515FEA',
  deepPurple: '#281078',
  darkBlue: '#214CB3',

  // Background & neutral colors
  white: '#FEFEFE',
  cardBackground: '#F4F4FA',
  lightBlueLavender: '#E2E6F9',
  lightPink: '#FCE1F5',
  border: '#D2D1E1',
  textMuted: '#636375',
  secondaryText: '#565477',
  textPrimary: '#111044',

  // Supporting / Status colors
  success: '#22A86B',
  error: '#E8596C',
  warning: '#F1B562',
  softPinkGradient: '#F1A4CD',

  // Functional aliases
  primary: '#F562AF',
  secondary: '#8364E6',
  accent: '#515FEA',
  background: '#FEFEFE',
  card: '#F4F4FA',

  // SRS Design Tokens (Mobile Dashboard UI/UX Refresh)
  screenBackground: '#F8F4FF',
  surface: '#FFFFFF',
  primaryPurple: '#762DEB',
  magenta: '#F12A9B',
  metricBlue: '#268BFA',
  metricGreen: '#13C783',
  metricOrange: '#FF922E',
  lavenderBorder: '#E7D9FF',
  mutedSurface: '#F0E9FF',
} as const;

export const GRADIENTS = {
  primary: ['#F562AF', '#BF54D0', '#8364E6'] as [string, string, string],
  pinkPurple: ['#FCE1F5', '#F562AF', '#8364E6'] as [string, string, string],
  purpleBlue: ['#BF54D0', '#8364E6', '#515FEA'] as [string, string, string],
  logo: ['#F562AF', '#BF54D0', '#8364E6', '#515FEA'] as [string, string, string, string],
  cardBadge: ['#F562AF', '#8364E6'] as [string, string],
  navyHeader: ['#05062A', '#13154A'] as [string, string],
  welcomeCard: ['#8C52FF', '#A855F7', '#7B2CBF'] as [string, string, string],
  salesOverview: ['#281078', '#1A0B52'] as [string, string],
  systemStatus: ['#4F46E5', '#7C3AED', '#9333EA'] as [string, string, string],
} as const;
