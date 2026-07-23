/** Themed Text wrapper: applies a typography variant + color. */

import React from 'react';
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { typography, colors, type TypographyVariant } from '@theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
}

export function AppText({
  variant = 'body',
  color = colors.text,
  center = false,
  style,
  ...rest
}: AppTextProps): React.JSX.Element {
  return (
    <RNText style={[typography[variant], { color }, center && styles.center, style]} {...rest} />
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
});
