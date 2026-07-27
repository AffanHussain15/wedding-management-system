/**
 * Inline banner for a form-level message — a failed submit, or a server
 * warning such as an overpayment. Renders nothing without a message.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@theme';
import { AppText } from './AppText';

export type BannerTone = 'error' | 'warning' | 'success';

export interface FormBannerProps {
  message?: string | null;
  tone?: BannerTone;
}

const TONES: Record<BannerTone, { bg: string; text: string }> = {
  error: { bg: colors.dangerBg, text: colors.danger },
  warning: { bg: colors.warningBg, text: colors.warning },
  success: { bg: colors.successBg, text: colors.successText },
};

export function FormBanner({
  message,
  tone = 'error',
}: FormBannerProps): React.JSX.Element | null {
  if (!message) return null;
  const palette = TONES[tone];

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <AppText variant="caption" color={palette.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
});
