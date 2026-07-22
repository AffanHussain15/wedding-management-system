/** Section title (serif) with an optional right-aligned action link. */

import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '@theme';
import { AppText } from './AppText';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.row, style]}>
      <AppText style={typography.serifHeading}>{title}</AppText>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <AppText style={typography.label} color={colors.primary}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
