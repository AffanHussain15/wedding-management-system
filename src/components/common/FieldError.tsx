/**
 * Inline validation message under a field. Renders nothing when there is no
 * message, so callers can pass a possibly-undefined value directly.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { colors, spacing } from '@theme';
import { AppText } from './AppText';

export interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps): React.JSX.Element | null {
  if (!message) return null;

  return (
    <AppText variant="caption" color={colors.danger} style={styles.text}>
      {message}
    </AppText>
  );
}

const styles = StyleSheet.create({
  text: {
    // Pulls up against the field's own bottom gap.
    marginTop: -spacing.xs,
  },
});
