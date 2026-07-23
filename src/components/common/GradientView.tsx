/** View with a linear-gradient background (SVG-backed, no extra native dep). */

import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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

  return (
    <View style={[styles.wrap, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            {gradientColors.map((c, i) => (
              <Stop key={c + i} offset={i / last} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
