/** Small tinted status pill. Pass the tint pair from the status helpers. */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography, weight } from '@theme';
import { AppText } from './AppText';

export interface StatusBadgeProps {
  label: string;
  bg?: string;
  color?: string;
  /**
   * Shows a spinner in the pill while the status this badge reports is being
   * written — for a badge you can tap to change, the gap between the tap and
   * the new status otherwise looks like nothing happened.
   */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function StatusBadge({
  label,
  bg = colors.warningBg,
  color = colors.warning,
  loading = false,
  style,
}: StatusBadgeProps): React.JSX.Element {
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {/* The label stays mounted while loading, just invisible: it is what
          gives the pill its width, and swapping it for the spinner would
          shrink the badge and shuffle the row it sits in. */}
      <AppText
        style={[typography.caption, styles.label, { color }, loading ? styles.hidden : null]}>
        {label}
      </AppText>
      {loading ? (
        <View style={styles.spinner} pointerEvents="none">
          {/* Scaled down: the smallest indicator RN offers is still taller
              than a caption-sized pill. */}
          <ActivityIndicator size="small" color={color} style={styles.spinnerScale} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.pill,
  },
  label: {
    ...weight('semiBold'),
  },
  hidden: {
    opacity: 0,
  },
  spinner: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerScale: {
    transform: [{ scale: 0.7 }],
  },
});
