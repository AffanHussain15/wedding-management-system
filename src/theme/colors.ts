/** Brand palette and semantic color tokens (deep-maroon + gold theme). */

const palette = {
  maroon900: '#4A0A1C',
  maroon800: '#5C1030',
  maroon700: '#6D0F2B',
  maroon600: '#8A2142',
  gold500: '#C9A24B',
  gold400: '#D4AF37',
  goldDark: '#8A6D1F',
  goldDeep: '#9C6B1F',
  bronze: '#7A5C1A',
  cream: '#FDF6E9',
  ink: '#2B1A1F',
  white: '#FFFFFF',
  iosGray: '#F2F2F7',
  green700: '#2E6B4C',
  green500: '#3D8361',
  red500: '#B23A3A',
} as const;

export const colors = {
  ...palette,

  primary: palette.maroon700,
  primaryDark: palette.maroon900,
  primaryDeep: palette.maroon800,
  primaryLight: palette.maroon600,
  accent: palette.gold500,
  accentBright: palette.gold400,

  background: palette.cream,
  surface: palette.white,
  surfaceAlt: palette.iosGray,

  text: palette.ink,
  textSecondary: 'rgba(43,26,31,0.5)',
  textMuted: 'rgba(43,26,31,0.4)',
  textOnPrimary: palette.cream,
  textOnAccent: palette.ink,

  border: 'rgba(109,15,43,0.18)',
  borderSubtle: 'rgba(109,15,43,0.12)',
  borderStrong: 'rgba(109,15,43,0.25)',
  divider: 'rgba(60,60,67,0.12)',

  success: palette.green500,
  successText: palette.green700,
  successBg: 'rgba(61,131,97,0.12)',
  warning: palette.goldDark,
  warningBg: 'rgba(201,162,75,0.16)',
  danger: palette.red500,
  dangerBg: 'rgba(178,58,58,0.10)',
  info: palette.maroon600,
  infoBg: 'rgba(138,33,66,0.10)',

  overlay: 'rgba(43,26,31,0.45)',
  transparent: 'transparent',
} as const;

/** Tint + text pairs for status pills (payment, RSVP, function state). */
export const statusColors = {
  paid: { bg: colors.successBg, text: colors.successText },
  confirmed: { bg: colors.successBg, text: colors.successText },
  done: { bg: colors.successBg, text: colors.successText },
  advance: { bg: colors.infoBg, text: colors.primaryLight },
  pending: { bg: colors.warningBg, text: colors.warning },
  upcoming: { bg: colors.warningBg, text: colors.warning },
  planned: { bg: 'rgba(109,15,43,0.08)', text: colors.textSecondary },
  notComing: { bg: colors.dangerBg, text: colors.danger },
} as const;

/** Rotating palette for avatars (indexed by name length). */
export const avatarPalette = [
  palette.maroon700,
  palette.maroon600,
  palette.goldDeep,
  palette.maroon900,
  palette.bronze,
  palette.maroon800,
] as const;

/** Rotating palette for chart segments. */
export const chartPalette = [
  palette.maroon700,
  palette.gold500,
  palette.maroon600,
  palette.goldDeep,
  palette.maroon900,
  palette.gold400,
] as const;

export type ColorKey = keyof typeof colors;
export type Colors = typeof colors;

export default colors;
