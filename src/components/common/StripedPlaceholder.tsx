/**
 * Art placeholder filled with 45° stripes — a rounded box by default, or a
 * circle when `borderRadius` is half of a square's side. Children render on top.
 */

import React, { useId, useState, type PropsWithChildren } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Rect } from 'react-native-svg';

import { colors, radius } from '@theme';

/** Stripe thickness and horizontal spacing, tuned to read as an even hatch. */
const STRIPE_WIDTH = 7;
const STRIPE_GAP = 20;

export interface StripedPlaceholderProps extends PropsWithChildren {
  /** Fixed width; omit to fill the parent (measured on layout). */
  width?: number;
  height?: number;
  borderRadius?: number;
  /** Fill behind the stripes. */
  backgroundColor?: string;
  /** Stripe color — keep it close to the background for a soft placeholder. */
  stripeColor?: string;
  stripeWidth?: number;
  /** Horizontal center-to-center distance between stripes. */
  stripeGap?: number;
  /** `'right'` leans the stripes like `/`, `'left'` like `\`. */
  lean?: 'right' | 'left';
  style?: StyleProp<ViewStyle>;
}

export function StripedPlaceholder({
  width,
  height = 190,
  borderRadius = radius.card,
  backgroundColor = colors.surfaceSand,
  stripeColor = 'rgba(255,255,255,0.85)',
  stripeWidth = STRIPE_WIDTH,
  stripeGap = STRIPE_GAP,
  lean = 'right',
  style,
  children,
}: StripedPlaceholderProps): React.JSX.Element {
  // SVG ids share one namespace, so keep them unique per mounted instance.
  const clipId = `stripedFill${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  // A parent-filling placeholder only learns its width once laid out.
  const [measured, setMeasured] = useState(0);
  const w = width ?? measured;

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    setMeasured(prev => (prev === next ? prev : next));
  };

  // Walk x past both edges so every diagonal that crosses the shape is drawn,
  // then let the clip path trim the overflow.
  const stripes: React.JSX.Element[] = [];
  for (let x = -height; x <= w + height; x += stripeGap) {
    stripes.push(
      <Line
        key={x}
        x1={x}
        y1={lean === 'right' ? height : 0}
        x2={x + height}
        y2={lean === 'right' ? 0 : height}
        stroke={stripeColor}
        strokeWidth={stripeWidth}
      />,
    );
  }

  return (
    <View
      style={[styles.wrap, { width: width ?? '100%', height, borderRadius }, style]}
      onLayout={onLayout}>
      {w > 0 ? (
        <Svg width={w} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <ClipPath id={clipId}>
              <Rect
                x={0}
                y={0}
                width={w}
                height={height}
                rx={borderRadius}
                ry={borderRadius}
              />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#${clipId})`}>
            <Rect x={0} y={0} width={w} height={height} fill={backgroundColor} />
            {stripes}
          </G>
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
