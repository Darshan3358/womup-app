export const COLORS = {
  navy: '#05062A',
  darkNavy: '#03041C',
  hotPink: '#F562AF',
  rose: '#E11D48',
  purple: '#8364E6',
  blue: '#515FEA',
  emerald: '#10B981',
  amber: '#D97706',
  gold: '#F59E0B',
  
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  bgLight: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;

export const GRADIENTS = {
  navyHeader: ['#05062A', '#13154A'] as [string, string],
  pinkGlow: ['#F562AF', '#8364E6'] as [string, string],
  goldBanner: ['#FEF3C7', '#FDE68A'] as [string, string],
  emeraldBanner: ['#D1FAE5', '#A7F3D0'] as [string, string],
  cardBorder: ['#E2E8F0', '#CBD5E1'] as [string, string],
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;
