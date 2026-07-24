/** View with a linear-gradient background (SVG-backed, no extra native dep). */

import React, { type PropsWithChildren, useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export interface GradientViewProps extends PropsWithChildren {
  /** Two or more colors, applied corner-to-corner. */
  colors: readonly string[];
  style?: StyleProp<ViewStyle>;
}

export function GradientView({
  colors: gradientColors,
  style,
  children,
}: GradientViewProps): React.JSX.Element {
  const last = Math.max(1, gradientColors.length - 1);
  // Percentage dimensions on react-native-svg don't resolve reliably (the
  // gradient renders narrower than its container). Measure actual pixels.
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize(prev => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <View style={[styles.wrap, style]} onLayout={onLayout}>
      {size.width > 0 && size.height > 0 ? (
        <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              {gradientColors.map((c, i) => (
                <Stop key={c + i} offset={i / last} stopColor={c} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.width} height={size.height} fill="url(#grad)" />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
