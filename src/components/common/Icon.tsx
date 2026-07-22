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
  | 'chevronRight'
  | 'link'
  | 'code'
  | 'plus'
  | 'search'
  | 'phone'
  | 'message'
  | 'send'
  | 'card'
  | 'calendar'
  | 'home'
  | 'vendors'
  | 'guests'
  | 'budget'
  | 'timeline';

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
    case 'link':
      return (
        <Svg {...svgProps}>
          <Circle cx={8} cy={16} r={3} {...p} />
          <Circle cx={16} cy={8} r={3} {...p} />
          <Path d="M10 14l4-4" {...p} />
        </Svg>
      );
    case 'code':
      return (
        <Svg {...svgProps}>
          <Rect x={4} y={4} width={16} height={16} rx={3} {...p} />
          <Path d="M9 12h6M12 9v6" {...p} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...svgProps}>
          <Path d="M12 5v14M5 12h14" {...p} />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...svgProps}>
          <Circle cx={11} cy={11} r={7} {...p} />
          <Path d="M20 20l-4-4" {...p} />
        </Svg>
      );
    case 'phone':
      return (
        <Svg {...svgProps}>
          <Path
            d="M4 5a1 1 0 011-1h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a1 1 0 01-1 1A16 16 0 014 5z"
            {...p}
          />
        </Svg>
      );
    case 'message':
      return (
        <Svg {...svgProps}>
          <Rect x={3} y={5} width={18} height={14} rx={3} {...p} />
          <Path d="M3 7l9 6 9-6" {...p} />
        </Svg>
      );
    case 'send':
      return (
        <Svg {...svgProps}>
          <Path d="M21 3L10 14M21 3l-7 18-4-8-8-4 19-6z" {...p} />
        </Svg>
      );
    case 'card':
      return (
        <Svg {...svgProps}>
          <Rect x={3} y={6} width={18} height={13} rx={2} {...p} />
          <Path d="M3 10h18" {...p} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...svgProps}>
          <Rect x={4} y={5} width={16} height={15} rx={2} {...p} />
          <Path d="M8 3v4M16 3v4M4 10h16" {...p} />
        </Svg>
      );
    case 'home':
      return (
        <Svg {...svgProps}>
          <Path d="M4 11 12 4l8 7" {...p} />
          <Path d="M6 10v9h12v-9" {...p} />
        </Svg>
      );
    case 'vendors':
      return (
        <Svg {...svgProps}>
          <Path d="M4 8l1.5-4h13L20 8" {...p} />
          <Path d="M4 8h16v11H4z" {...p} />
          <Path d="M9 19v-5h6v5" {...p} />
        </Svg>
      );
    case 'guests':
      return (
        <Svg {...svgProps}>
          <Circle cx={9} cy={9} r={3.2} {...p} />
          <Path d="M3.5 19c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" {...p} />
          <Circle cx={17} cy={9.5} r={2.4} {...p} />
          <Path d="M15.5 13.3c2 .5 3.3 2.4 3.3 5.7" {...p} />
        </Svg>
      );
    case 'budget':
      return (
        <Svg {...svgProps}>
          <Rect x={3} y={7} width={18} height={12} rx={2} {...p} />
          <Path d="M3 10h18" {...p} />
          <Circle cx={16} cy={14.5} r={1.1} fill={color} />
        </Svg>
      );
    case 'timeline':
      return (
        <Svg {...svgProps}>
          <Rect x={4} y={5} width={16} height={15} rx={2} {...p} />
          <Path d="M4 9h16" {...p} />
          <Path d="M8 3v4M16 3v4" {...p} />
        </Svg>
      );
  }
}
