/** Horizontal progress track + fill (0–100). */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@theme';
import { clamp } from '@utils';

export interface ProgressBarProps {
  /** 0–100 (clamped). */
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  color = colors.primary,
  trackColor = colors.borderSubtle,
  height = 8,
  style,
}: ProgressBarProps): React.JSX.Element {
  const pct = clamp(progress);

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }, style]}>
      <View
        style={[
          styles.fill,
          { width: `${pct}%`, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
