/** Spacing scale (4px rhythm) and shared layout constants. */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const layout = {
  screenPadding: 16,
  cardPadding: 16,
  gutter: 12,
  tabBarHeight: 64,
  fabSize: 56,
} as const;

export type Spacing = typeof spacing;
export type Layout = typeof layout;

export default spacing;
