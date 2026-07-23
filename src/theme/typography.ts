/**
 * Typography tokens. Two families: Inter (UI/body) and Playfair Display
 * (serif — headings and big numbers), matching the design.
 *
 * Fonts aren't bundled yet. Until they are, the app uses the system font at
 * the correct weight (and a platform serif for headings) so the UI still
 * reads correctly. After adding the font files to src/assets/fonts and
 * running `npx react-native-asset`, flip FONTS_LOADED to true.
 */

import { Platform, type TextStyle } from 'react-native';

/** Set true once the custom font files are added and linked. */
export const FONTS_LOADED = true;

const INTER = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

const PLAYFAIR = {
  regular: 'PlayfairDisplay-Regular',
  bold: 'PlayfairDisplay-Bold',
} as const;

export const fontFamily = {
  ...INTER,
  serif: PLAYFAIR.regular,
  serifBold: PLAYFAIR.bold,
} as const;

type Weight = keyof typeof INTER;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const satisfies Record<Weight, TextStyle['fontWeight']>;

// System serif fallback used until Playfair Display is linked.
const PLATFORM_SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

/**
 * Weight helper — the correct way to select a weight. When the custom fonts are
 * loaded it picks the named Inter file (e.g. `Inter-Bold`) via `fontFamily`;
 * otherwise it falls back to `fontWeight` on the system font.
 *
 * Exported so one-off styles outside the `typography` variants (badges, chart
 * labels, avatar initials) stay bold after FONTS_LOADED is flipped — a bare
 * `fontWeight` is ignored once a custom `fontFamily` is set (notably on iOS).
 */
export const weight = (w: Weight): TextStyle =>
  FONTS_LOADED ? { fontFamily: INTER[w] } : { fontWeight: fontWeight[w] };

/** Playfair when loaded, else a platform serif at bold weight. */
const serif = (): TextStyle =>
  FONTS_LOADED ? { fontFamily: PLAYFAIR.bold } : { fontFamily: PLATFORM_SERIF, fontWeight: '700' };

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
    ...weight('bold'),
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    letterSpacing: 0.4,
  },
  // Serif (Playfair) — hero numbers, stat values and section titles.
  serifDisplay: { ...serif(), fontSize: 44, lineHeight: 48 },
  serifTitle: { ...serif(), fontSize: fontSize.lg, lineHeight: lineHeight.lg },
  serifHeading: {
    ...serif(),
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  serifValue: { ...serif(), fontSize: fontSize.xl, lineHeight: lineHeight.xl },
  h1: { ...weight('bold'), fontSize: fontSize.xxl, lineHeight: lineHeight.xxl },
  h2: { ...weight('semiBold'), fontSize: fontSize.xl, lineHeight: lineHeight.xl },
  h3: { ...weight('semiBold'), fontSize: fontSize.lg, lineHeight: lineHeight.lg },
  title: {
    ...weight('semiBold'),
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  body: {
    ...weight('regular'),
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  bodyMedium: {
    ...weight('medium'),
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  callout: {
    ...weight('regular'),
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  caption: {
    ...weight('regular'),
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  overline: {
    ...weight('medium'),
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  label: {
    ...weight('medium'),
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  button: {
    ...weight('semiBold'),
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    letterSpacing: 0.2,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
export type Typography = typeof typography;

export default typography;
