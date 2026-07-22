/**
 * Typography tokens. Two families: Inter (UI/body) and Playfair Display
 * (serif — headings and big numbers), matching the design.
 * Font files aren't linked yet — see src/assets/fonts/README.md. The family
 * names below already match the expected files; until then RN falls back to
 * the system font.
 */

import type { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  serif: 'PlayfairDisplay-Regular',
  serifBold: 'PlayfairDisplay-Bold',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  display: 34,
} as const;

export const lineHeight = {
  xs: 14,
  sm: 18,
  md: 20,
  base: 22,
  lg: 26,
  xl: 30,
  xxl: 34,
  display: 41,
} as const;

/** Ready-to-spread text variants: `<Text style={typography.h1}>`. */
export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    letterSpacing: 0.4,
  },
  // Serif (Playfair) — used for hero numbers, stat values and section titles.
  serifDisplay: {
    fontFamily: fontFamily.serifBold,
    fontSize: 44,
    lineHeight: 48,
  },
  serifTitle: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
  },
  serifHeading: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  serifValue: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
  },
  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  callout: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  overline: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    letterSpacing: 0.2,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
export type Typography = typeof typography;

export default typography;
