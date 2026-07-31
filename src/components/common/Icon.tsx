/** Line icons rendered with react-native-svg (Feather/Lucide-style geometry). */

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
  | 'trash'
  | 'pencil'
  | 'close'
  | 'search'
  | 'eye'
  | 'eyeOff'
  | 'phone'
  | 'message'
  | 'send'
  | 'card'
  | 'calendar'
  | 'home'
  | 'vendors'
  | 'guests'
  | 'budget'
  | 'timeline'
  | 'contacts'
  // Wedding functions — see `functionIcon` for the name → glyph mapping.
  | 'dholki'
  | 'mayun'
  | 'mehndi'
  | 'baraat'
  | 'walima';

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
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...p} />
          <Path d="M13.73 21a2 2 0 0 1-3.46 0" {...p} />
        </Svg>
      );
    case 'tasks':
      return (
        <Svg {...svgProps}>
          <Path d="M9 11l3 3L22 4" {...p} />
          <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" {...p} />
        </Svg>
      );
    case 'seating':
      return (
        <Svg {...svgProps}>
          <Rect x={3} y={3} width={7} height={7} rx={1.5} {...p} />
          <Rect x={14} y={3} width={7} height={7} rx={1.5} {...p} />
          <Rect x={3} y={14} width={7} height={7} rx={1.5} {...p} />
          <Rect x={14} y={14} width={7} height={7} rx={1.5} {...p} />
        </Svg>
      );
    case 'profile':
      return (
        <Svg {...svgProps}>
          <Circle cx={12} cy={7} r={4} {...p} />
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...p} />
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
          <Path d="M9 18l6-6-6-6" {...p} />
        </Svg>
      );
    case 'link':
      return (
        <Svg {...svgProps}>
          <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" {...p} />
          <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" {...p} />
        </Svg>
      );
    case 'code':
      return (
        <Svg {...svgProps}>
          <Path d="M16 18l6-6-6-6" {...p} />
          <Path d="M8 6l-6 6 6 6" {...p} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...svgProps}>
          <Path d="M12 5v14M5 12h14" {...p} />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...svgProps}>
          <Path d="M3 6h18" {...p} />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" {...p} />
          <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...p} />
          <Path d="M10 11v6M14 11v6" {...p} />
        </Svg>
      );
    case 'pencil':
      return (
        <Svg {...svgProps}>
          <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" {...p} />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...svgProps}>
          <Path d="M18 6L6 18M6 6l12 12" {...p} />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...svgProps}>
          <Circle cx={11} cy={11} r={8} {...p} />
          <Path d="M21 21l-4.35-4.35" {...p} />
        </Svg>
      );
    case 'eye':
      return (
        <Svg {...svgProps}>
          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...p} />
          <Circle cx={12} cy={12} r={3} {...p} />
        </Svg>
      );
    // The open eye with a stroke through it: the lids are drawn as two arcs so
    // the slash can cut across an outline rather than a closed shape.
    case 'eyeOff':
      return (
        <Svg {...svgProps}>
          <Path
            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
            {...p}
          />
          <Path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" {...p} />
          <Path d="M1 1l22 22" {...p} />
        </Svg>
      );
    case 'phone':
      return (
        <Svg {...svgProps}>
          <Path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
            {...p}
          />
        </Svg>
      );
    case 'message':
      return (
        <Svg {...svgProps}>
          <Path
            d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
            {...p}
          />
          <Path d="M22 6l-10 7L2 6" {...p} />
        </Svg>
      );
    case 'send':
      return (
        <Svg {...svgProps}>
          <Path d="M22 2L11 13" {...p} />
          <Path d="M22 2l-7 20-4-9-9-4 20-7z" {...p} />
        </Svg>
      );
    case 'card':
      return (
        <Svg {...svgProps}>
          <Rect x={2} y={5} width={20} height={14} rx={2} {...p} />
          <Path d="M2 10h20" {...p} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...svgProps}>
          <Rect x={3} y={4} width={18} height={18} rx={2} {...p} />
          <Path d="M16 2v4M8 2v4M3 10h18" {...p} />
        </Svg>
      );
    case 'home':
      return (
        <Svg {...svgProps}>
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...p} />
          <Path d="M9 22V12h6v10" {...p} />
        </Svg>
      );
    case 'vendors':
      return (
        <Svg {...svgProps}>
          <Path d="M4 9l1.2-4.5A1 1 0 0 1 6.16 4h11.68a1 1 0 0 1 .96.72L20 9" {...p} />
          <Path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" {...p} />
          <Path d="M9 20v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5" {...p} />
        </Svg>
      );
    case 'guests':
      return (
        <Svg {...svgProps}>
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...p} />
          <Circle cx={9} cy={7} r={4} {...p} />
          <Path d="M23 21v-2a4 4 0 0 0-3-3.87" {...p} />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" {...p} />
        </Svg>
      );
    case 'budget':
      return (
        <Svg {...svgProps}>
          <Rect x={2} y={5} width={20} height={14} rx={2} {...p} />
          <Path d="M2 10h20" {...p} />
          <Circle cx={17} cy={15} r={1.35} fill={color} />
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
    case 'contacts':
      return (
        <Svg {...svgProps}>
          <Rect x={4} y={2} width={16} height={20} rx={2} {...p} />
          <Circle cx={12} cy={10} r={2.5} {...p} />
          <Path d="M8 17a4 4 0 0 1 8 0" {...p} />
          </Svg>
      );
    // Dholki — a drum: barrel sides, an elliptical head, and its lacing.
    case 'dholki':
      return (
        <Svg {...svgProps}>
          <Path d="M7 8v8M17 8v8" {...p} />
          <Path d="M7 8a5 2.5 0 0 1 10 0a5 2.5 0 0 1-10 0" {...p} />
          <Path d="M7 16a5 2.5 0 0 0 10 0" {...p} />
          <Path d="M8 10l8 4M16 10l-8 4" {...p} />
        </Svg>
      );
    // Mayun — the turmeric bowl, with the rim above it.
    case 'mayun':
      return (
        <Svg {...svgProps}>
          <Path d="M3 12h18" {...p} />
          <Path d="M5 12a7 7 0 0 0 14 0" {...p} />
          <Path d="M12 4v3M9 5.5l1 1.8M15 5.5l-1 1.8" {...p} />
        </Svg>
      );
    // Mehndi — a henna leaf with its midrib.
    case 'mehndi':
      return (
        <Svg {...svgProps}>
          <Path d="M5 19c0-7 5-13 13-14 1 8-4 14-13 14z" {...p} />
          <Path d="M5 19c3-3.5 6.5-5.5 10-6.5" {...p} />
        </Svg>
      );
    // Baraat — the procession, as the car that carries it.
    case 'baraat':
      return (
        <Svg {...svgProps}>
          <Path d="M3 17v-4l2.2-4.4A2 2 0 0 1 7 7.5h10a2 2 0 0 1 1.8 1.1L21 13v4" {...p} />
          <Path d="M2 17h20" {...p} />
          <Path d="M6.5 13h11" {...p} />
          <Circle cx={7.5} cy={19} r={1.6} {...p} />
          <Circle cx={16.5} cy={19} r={1.6} {...p} />
        </Svg>
      );
    // Walima — the reception dinner: a cloche over the plate.
    case 'walima':
      return (
        <Svg {...svgProps}>
          <Path d="M3 17h18" {...p} />
          <Path d="M5 17a7 7 0 0 1 14 0" {...p} />
          <Path d="M12 7V5.5" {...p} />
          <Circle cx={12} cy={4.5} r={1} {...p} />
        </Svg>
      );
  }
}
