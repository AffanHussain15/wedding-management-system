import { colors, statusColors, avatarPalette, chartPalette } from './colors';
import { typography, fontFamily, fontWeight, fontSize, lineHeight } from './typography';
import { spacing, layout } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';

export { colors, statusColors, avatarPalette, chartPalette } from './colors';
export {
  typography,
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  FONTS_LOADED,
} from './typography';
export { spacing, layout } from './spacing';
export { radius } from './radius';
export { shadows } from './shadows';

export type { Colors, ColorKey } from './colors';
export type { Typography, TypographyVariant } from './typography';
export type { Spacing, Layout } from './spacing';
export type { Radius } from './radius';
export type { Shadows } from './shadows';

/** Aggregate theme object for single-import access. */
export const theme = {
  colors,
  statusColors,
  avatarPalette,
  chartPalette,
  typography,
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  spacing,
  layout,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;

export default theme;
