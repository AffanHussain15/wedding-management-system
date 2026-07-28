/**
 * Two striped placeholder circles joined by interlocking gold rings — the
 * "you + partner" motif used on onboarding and the family-link screen.
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, spacing } from '@theme';
import { AppText } from './AppText';
import { StripedPlaceholder } from './StripedPlaceholder';

export interface LinkedCirclesProps {
  leftLabel?: string;
  rightLabel?: string;
  /** Diameter of each placeholder circle. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function LinkedCircles({
  leftLabel = 'You',
  rightLabel = 'Partner',
  size = 96,
  style,
}: LinkedCirclesProps): React.JSX.Element {
  // Labels sit below the circles, so nudge the rings up to stay on their centers.
  const ringsOffset: ViewStyle = { marginBottom: leftLabel || rightLabel ? size * 0.2 : 0 };

  return (
    <View style={[styles.row, style]}>
      <View style={styles.item}>
        <StripedPlaceholder width={size} height={size} borderRadius={size / 2} />
        {leftLabel ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {leftLabel}
          </AppText>
        ) : null}
      </View>

      <Rings size={size * 0.26} style={ringsOffset} />

      <View style={styles.item}>
        <StripedPlaceholder width={size} height={size} borderRadius={size / 2} />
        {rightLabel ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {rightLabel}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

/** Two overlapping gold rings, read as an infinity mark at small sizes. */
function Rings({
  size,
  style,
}: {
  size: number;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const stroke = Math.max(1.5, size * 0.14);
  const r = (size - stroke) / 2;
  const width = size * 1.75;
  const cy = size / 2;

  return (
    <View style={style}>
      <Svg width={width} height={size}>
        <Circle cx={r + stroke / 2} cy={cy} r={r} stroke={colors.accent} strokeWidth={stroke} fill="none" />
        <Circle
          cx={width - r - stroke / 2}
          cy={cy}
          r={r}
          stroke={colors.accent}
          strokeWidth={stroke}
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  item: {
    alignItems: 'center',
    gap: spacing.sm,
  },
});
