// One UI-inspired design tokens: bold left-aligned headers, soft rounded
// cards, generous spacing, flat/minimal shadows, pill-shaped controls.
// Monochrome accent (black in light mode, white in dark mode) — status
// colors (paid/due/overdue) stay semantic green/amber/red in both themes.

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  white: string;
  black: string;
}

export const lightColors: ThemeColors = {
  bg: '#F5F6F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F1F5',
  primary: '#14161A',
  primarySoft: '#ECEDEF',
  onPrimary: '#FFFFFF',
  success: '#1DB855',
  successSoft: '#E4F8EC',
  warning: '#F5A623',
  warningSoft: '#FEF3E1',
  danger: '#F03D3D',
  dangerSoft: '#FDEAEA',
  textPrimary: '#191A1F',
  textSecondary: '#6B7280',
  textTertiary: '#9AA0AC',
  border: '#EDEEF2',
  white: '#FFFFFF',
  black: '#000000',
};

export const darkColors: ThemeColors = {
  bg: '#0B0B0D',
  surface: '#18191D',
  surfaceAlt: '#232429',
  primary: '#FFFFFF',
  primarySoft: '#2A2B31',
  onPrimary: '#101114',
  success: '#34D399',
  successSoft: 'rgba(52,211,153,0.15)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.15)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.15)',
  textPrimary: '#F5F6F7',
  textSecondary: '#A1A3AA',
  textTertiary: '#6E7078',
  border: '#2A2B31',
  white: '#FFFFFF',
  black: '#000000',
};

export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  pill: 999,
};

export const spacing = (n: number) => n * 4;

export const shadow = {
  none: {},
  flat: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
};

export type PaymentStatusName = 'Paid' | 'Due' | 'Overdue';

export const getStatusColors = (colors: ThemeColors): Record<PaymentStatusName, { fg: string; bg: string }> => ({
  Paid: { fg: colors.success, bg: colors.successSoft },
  Due: { fg: colors.warning, bg: colors.warningSoft },
  Overdue: { fg: colors.danger, bg: colors.dangerSoft },
});
