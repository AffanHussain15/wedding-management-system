/**
 * The Ek diya: a gold flame over its wishbone stand. Geometry traced from
 * src/assets/images/splashScreen.png, normalised to a 64x100 box.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@theme';

const VIEW_W = 64;
const VIEW_H = 100;

/** Apex at the top, bulb centred on (32, 39.45) with r=20.65. */
const FLAME =
  'M32 0 C33 9 51.5 24 52.3 35.45 A20.65 20.65 0 1 1 11.7 35.45 C12.5 24 31 9 32 0 Z';

/** The same shape at ~44%, sitting low in the bulb. */
const DROP =
  'M32 24.4 C33 30 40.77 35 40.77 40.9 A9 9 0 1 1 23.23 40.9 C23.23 35 31 30 32 24.4 Z';

/**
 * The arms cross behind the bulb, which is drawn over them — start them any
 * lower and the overlap shows as a collar under the flame.
 */
const LEG_LEFT = 'M38 52 C33 68 5 76 3.7 95.7';
const LEG_RIGHT = 'M26 52 C31 68 59 76 60.3 95.7';
const LEG_WIDTH = 7.3;

export interface BrandMarkProps {
  /** Height in points. Width follows the mark's aspect ratio. */
  size?: number;
  flameColor?: string;
  legColor?: string;
  /** The droplet cut out of the flame — set it to whatever sits behind. */
  dropColor?: string;
}

export function BrandMark({
  size = 100,
  flameColor = colors.goldSoft,
  legColor = colors.accent,
  dropColor = colors.primary,
}: BrandMarkProps): React.JSX.Element {
  const leg = {
    stroke: legColor,
    strokeWidth: LEG_WIDTH,
    strokeLinecap: 'round',
    fill: 'none',
  } as const;

  return (
    <Svg width={(size * VIEW_W) / VIEW_H} height={size} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <Path d={LEG_LEFT} {...leg} />
      <Path d={LEG_RIGHT} {...leg} />
      <Path d={FLAME} fill={flameColor} />
      <Path d={DROP} fill={dropColor} />
    </Svg>
  );
}
