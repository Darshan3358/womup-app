export const COLORS = {
  // Main brand colors
  navy: '#05062A',
  hotPink: '#F562AF',
  purple: '#8364E6',
  blue: '#515FEA',
  deepPurple: '#BF54D0',
  darkBlue: '#214CB3',

  // Background & neutral colors
  white: '#FEFEFE',
  cardBackground: '#F4F4FA',
  lightBlueLavender: '#E2E6F9',
  lightPink: '#FCE1F5',
  border: '#D2D1E1',
  textMuted: '#636375',
  secondaryText: '#B0B1C2',
  textPrimary: '#333450',

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
} as const;

export const GRADIENTS = {
  primary: ['#F562AF', '#BF54D0', '#8364E6'] as [string, string, string],
  pinkPurple: ['#FCE1F5', '#F562AF', '#8364E6'] as [string, string, string],
  purpleBlue: ['#BF54D0', '#8364E6', '#515FEA'] as [string, string, string],
  logo: ['#F562AF', '#BF54D0', '#8364E6', '#515FEA'] as [string, string, string, string],
  cardBadge: ['#F562AF', '#8364E6'] as [string, string],
  navyHeader: ['#05062A', '#13154A'] as [string, string],
} as const;
