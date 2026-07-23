/** Small tinted status pill. Pass the tint pair from the status helpers. */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@theme';
import { AppText } from './AppText';

export interface StatusBadgeProps {
  label: string;
  bg?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function StatusBadge({
  label,
  bg = colors.warningBg,
  color = colors.warning,
  style,
}: StatusBadgeProps): React.JSX.Element {
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <AppText style={[typography.caption, styles.label, { color }]}>{label}</AppText>
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
    fontWeight: '600',
  },
});
