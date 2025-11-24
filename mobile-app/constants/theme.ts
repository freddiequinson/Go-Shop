/**
 * Theme Configuration
 * Matches the web app's design system with OKLCH color space
 */

export const Colors = {
  light: {
    background: '#FFFFFF',
    foreground: '#262626',
    card: '#FFFFFF',
    cardForeground: '#262626',
    primary: '#343434',
    primaryForeground: '#FCFCFC',
    secondary: '#F7F7F7',
    secondaryForeground: '#343434',
    muted: '#F7F7F7',
    mutedForeground: '#8E8E8E',
    accent: '#F7F7F7',
    accentForeground: '#343434',
    destructive: '#DC2626',
    destructiveForeground: '#DC2626',
    border: '#EBEBEB',
    input: '#EBEBEB',
    ring: '#B5B5B5',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  dark: {
    background: '#262626',
    foreground: '#FCFCFC',
    card: '#262626',
    cardForeground: '#FCFCFC',
    primary: '#FCFCFC',
    primaryForeground: '#343434',
    secondary: '#454545',
    secondaryForeground: '#FCFCFC',
    muted: '#454545',
    mutedForeground: '#B5B5B5',
    accent: '#454545',
    accentForeground: '#FCFCFC',
    destructive: '#7F1D1D',
    destructiveForeground: '#FCA5A5',
    border: '#454545',
    input: '#454545',
    ring: '#707070',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  full: 9999,
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
