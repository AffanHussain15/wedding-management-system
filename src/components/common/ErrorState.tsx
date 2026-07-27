/** Failed-request state with a retry affordance. */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon } from './Icon';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Fills its parent instead of adding fixed vertical padding. */
  fill?: boolean;
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Try Again',
  fill = true,
}: ErrorStateProps): React.JSX.Element {
  return (
    <View style={[styles.root, fill ? styles.fill : styles.inline]}>
      <View style={styles.iconBox}>
        <Icon name="bell" size={20} color={colors.danger} />
      </View>
      <AppText variant="callout" color={colors.text} center style={styles.message}>
        {message}
      </AppText>
      {onRetry ? (
        <Button label={retryLabel} variant="outline" fullWidth={false} onPress={onRetry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  fill: {
    flex: 1,
  },
  inline: {
    paddingVertical: spacing.xxl,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  message: {
    marginBottom: spacing.lg,
  },
});
