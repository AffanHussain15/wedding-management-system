/** Dashboard stat tile: label, serif value (+ optional suffix), caption/footer. */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing, typography, weight } from '@theme';
import { AppText } from './AppText';

export interface StatCardProps {
  label: string;
  value: string | number;
  /** Small trailing fraction, e.g. "/12". */
  valueSuffix?: string;
  /** Emphasis caption under the value (e.g. "confirmed"). */
  caption?: string;
  captionColor?: string;
  /** Optional custom footer (e.g. a ProgressBar) shown instead of a caption. */
  footer?: React.ReactNode;
  onPress?: () => void;
  /** Render the value at the smaller heading size (for text values). */
  compact?: boolean;
}

export function StatCard({
  label,
  value,
  valueSuffix,
  caption,
  captionColor = colors.textSecondary,
  footer,
  onPress,
  compact = false,
}: StatCardProps): React.JSX.Element {
  const content = (
    <>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <View style={styles.valueRow}>
        <AppText style={compact ? typography.serifHeading : typography.serifValue}>{value}</AppText>
        {valueSuffix ? (
          <AppText variant="caption" color={colors.textMuted}>
            {valueSuffix}
          </AppText>
        ) : null}
      </View>
      {footer ??
        (caption ? (
          <AppText variant="caption" color={captionColor} style={styles.caption}>
            {caption}
          </AppText>
        ) : null)}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  caption: {
    marginTop: spacing.sm,
    ...weight('semiBold'),
  },
  pressed: {
    opacity: 0.9,
  },
});
