/** Deterministic color pickers for avatars and chart segments. */

import { avatarPalette, chartPalette } from '@theme';

/** Stable avatar color for a name (seeded by name length). */
export const getAvatarColor = (name: string): string =>
  avatarPalette[name.length % avatarPalette.length];

export const getChartColor = (index: number): string =>
  chartPalette[index % chartPalette.length];
