/** Call-to-action button: primary (maroon gradient) / secondary / outline / ghost. */

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
import { GradientView } from './GradientView';

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

const PRIMARY_GRADIENT = ['#8A2142', '#6D0F2B'] as const;

interface VariantStyle {
  bg: string;
  text: string;
  border?: string;
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: { bg: colors.transparent, text: colors.textOnPrimary },
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
  const isPrimary = variant === 'primary';

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
        isPrimary && styles.primaryShadow,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {isPrimary ? <GradientView colors={PRIMARY_GRADIENT} style={styles.gradientFill} /> : null}
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
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  md: {
    height: 54,
    paddingHorizontal: spacing.xl,
  },
  sm: {
    height: 40,
    paddingHorizontal: spacing.base,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  gradientFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
  },
  primaryShadow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
});
