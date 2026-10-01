export const COLORS = {
  // Main brand colors from SRS
  navy: '#0B1755',
  navy800: '#07113F',
  navy700: '#162A6E',
  navyText: '#101A4D',

  // Pink brand colors from SRS
  hotPink: '#EC4A9D',
  pink400: '#F06BB2',
  pink100: '#FCEAF5',
  pink50: '#FFF1F8',

  purple: '#8364E6',
  blue: '#515FEA',
  deepPurple: '#BF54D0',
  darkBlue: '#214CB3',

  // Backgrounds from SRS
  white: '#FFFFFF',
  background: '#FAFBFE',
  bgHero: '#F9ECF8',
  bgBenefits: '#F2EEFF',
  bgPurpleSoft: '#EDE8FF',
  cardBackground: '#FAFBFE',
  lightPink: '#FCEAF5',
  lightBlueLavender: '#E2E6F9',

  // Category card pastel backgrounds
  catVeg: '#EEF9F3',
  catChips: '#FFF8E9',
  catDairy: '#EDF5FF',
  catOil: '#FFF0E8',
  catBakery: '#FFF4E9',
  catDrinks: '#EEF9F3',
  catHousehold: '#EDF5FF',
  catPersonal: '#FCEAF5',
  catBaby: '#FFF1F8',
  catPet: '#EEF9F3',
  catFrozen: '#EDF5FF',
  catMore: '#FCEAF5',

  // Text tokens
  textPrimary: '#101A4D',
  textSecondary: '#62677A',
  textMuted: '#9296A7',
  secondaryText: '#62677A',
  border: '#E9EAF1',
  borderLight: '#F1F3F8',

  // Status & Utility
  success: '#1FA463',
  error: '#EF4444',
  warning: '#F59E0B',
  softPinkGradient: '#FCEAF5',

  // Functional aliases
  primary: '#EC4A9D',
  secondary: '#0B1755',
  accent: '#1FA463',
  card: '#FFFFFF',
} as const;

export const GRADIENTS = {
  primary: ['#EC4A9D', '#F06BB2', '#8364E6'] as [string, string, string],
  pinkPurple: ['#FCEAF5', '#EC4A9D', '#8364E6'] as [string, string, string],
  purpleBlue: ['#BF54D0', '#8364E6', '#515FEA'] as [string, string, string],
  logo: ['#EC4A9D', '#BF54D0', '#8364E6', '#515FEA'] as [string, string, string, string],
  cardBadge: ['#EC4A9D', '#8364E6'] as [string, string],
  navyHeader: ['#0B1755', '#07113F'] as [string, string],
  heroPastel: ['#F9ECF8', '#F4EEFF'] as [string, string],
  promoProduce: ['#EDE8FF', '#F9ECF8'] as [string, string],
  promoDairy: ['#FFF0E8', '#FCEAF5'] as [string, string],
} as const;

