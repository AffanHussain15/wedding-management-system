/** Centred spinner for a screen's initial load. */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@theme';
import { AppText } from './AppText';

export interface LoadingStateProps {
  message?: string;
  /** Fills its parent instead of adding fixed vertical padding. */
  fill?: boolean;
}

export function LoadingState({ message, fill = true }: LoadingStateProps): React.JSX.Element {
  return (
    <View style={[styles.root, fill ? styles.fill : styles.inline]}>
      <ActivityIndicator color={colors.primary} />
      {message ? (
        <AppText variant="caption" color={colors.textSecondary} center style={styles.message}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    flex: 1,
  },
  inline: {
    paddingVertical: spacing.xxl,
  },
  message: {
    marginTop: spacing.md,
  },
});
