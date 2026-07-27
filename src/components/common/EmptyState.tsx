/** "Nothing here yet" state, with an optional call to action. */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.root}>
      {icon ? (
        <View style={styles.iconBox}>
          <Icon name={icon} size={20} color={colors.primary} />
        </View>
      ) : null}
      <AppText variant="title" color={colors.text} center>
        {title}
      </AppText>
      {message ? (
        <AppText variant="callout" color={colors.textSecondary} center style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="outline" fullWidth={false} onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  message: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
});
