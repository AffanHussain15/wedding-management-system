/** Border-radius scale. `card` matches the design's grouped-list cards. */

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  card: 26,
  pill: 9999,
  full: 9999,
} as const;

export type Radius = typeof radius;

export default radius;
