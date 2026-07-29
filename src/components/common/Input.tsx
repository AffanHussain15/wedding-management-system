/** Text field styled to match the design's form inputs. */

import React, { useRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '@theme';
import { AppText } from './AppText';
import { useScrollAssist } from './ScreenContainer';

export interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, style, onFocus, ...rest }: InputProps): React.JSX.Element {
  const field = useRef<TextInput>(null);
  // Null outside a scrollable ScreenContainer, in which case there is nothing
  // to scroll and focus needs no special handling.
  const assist = useScrollAssist();

  // Typed from the prop itself: RN's focus event shape has changed between
  // versions, and this can't drift from whatever TextInput expects.
  const handleFocus: NonNullable<TextInputProps['onFocus']> = event => {
    // Keeps the field visible when focus moves to it while the keyboard is
    // already open — no keyboard event fires for that.
    assist?.ensureVisible(field.current);
    onFocus?.(event);
  };

  return (
    <View>
      {label ? (
        <AppText variant="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={field}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        onFocus={handleFocus}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    ...typography.callout,
  },
});
