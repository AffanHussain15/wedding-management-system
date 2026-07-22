/** Call-to-action button: primary / secondary / outline / ghost. */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@theme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface VariantStyle {
  bg: string;
  text: string;
  border?: string;
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: { bg: colors.primary, text: colors.textOnPrimary },
  secondary: { bg: colors.accent, text: colors.textOnAccent },
  outline: { bg: colors.transparent, text: colors.primary, border: colors.primary },
  ghost: { bg: colors.transparent, text: colors.primary },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps): React.JSX.Element {
  const v = VARIANTS[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? colors.transparent,
          borderWidth: v.border ? 1.5 : 0,
        },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <AppText style={[typography.button, { color: v.text }]}>{label}</AppText>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: { height: 52, paddingHorizontal: spacing.xl },
  sm: { height: 40, paddingHorizontal: spacing.base },
  fullWidth: { alignSelf: 'stretch' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});
