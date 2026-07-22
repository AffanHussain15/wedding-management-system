/** Line icons rendered with react-native-svg (paths taken from the design). */

import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@theme';

export type IconName =
  | 'bell'
  | 'tasks'
  | 'seating'
  | 'profile'
  | 'check'
  | 'chevronRight';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 20,
  color = colors.primary,
  strokeWidth = 2,
}: IconProps): React.JSX.Element {
  const p = {
    stroke: color,
    strokeWidth,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  const svgProps = { width: size, height: size, viewBox: '0 0 24 24' };

  switch (name) {
    case 'bell':
      return (
        <Svg {...svgProps}>
          <Path d="M6 10a6 6 0 1 1 12 0c0 3 1 4.5 2 6H4c1-1.5 2-3 2-6z" {...p} />
        </Svg>
      );
    case 'tasks':
      return (
        <Svg {...svgProps}>
          <Rect x={4} y={4} width={16} height={16} rx={3} {...p} />
          <Path d="M8 12l2 2 4-4" {...p} />
        </Svg>
      );
    case 'seating':
      return (
        <Svg {...svgProps}>
          <Rect x={4} y={4} width={7} height={7} rx={1} {...p} />
          <Rect x={13} y={4} width={7} height={7} rx={1} {...p} />
          <Rect x={4} y={13} width={7} height={7} rx={1} {...p} />
          <Rect x={13} y={13} width={7} height={7} rx={1} {...p} />
        </Svg>
      );
    case 'profile':
      return (
        <Svg {...svgProps}>
          <Circle cx={12} cy={8} r={4} {...p} />
          <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" {...p} />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...svgProps}>
          <Path d="M20 6L9 17l-5-5" {...p} />
        </Svg>
      );
    case 'chevronRight':
      return (
        <Svg {...svgProps}>
          <Path d="M9 6l6 6-6 6" {...p} />
        </Svg>
      );
  }
}
