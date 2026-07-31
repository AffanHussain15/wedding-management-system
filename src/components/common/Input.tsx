/** Text field styled to match the design's form inputs. */

import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, radius, spacing, typography } from '@theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { useScrollAssist } from './ScreenContainer';

export interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({
  label,
  style,
  onFocus,
  secureTextEntry,
  ...rest
}: InputProps): React.JSX.Element {
  const field = useRef<TextInput>(null);
  // Null outside a scrollable ScreenContainer, in which case there is nothing
  // to scroll and focus needs no special handling.
  const assist = useScrollAssist();
  // Every `secureTextEntry` field gets a reveal toggle — on a phone keyboard a
  // password long enough to satisfy the API's rules is easy to mistype, and
  // there is nothing else to check it against.
  const [revealed, setRevealed] = useState(false);

  // Typed from the prop itself: RN's focus event shape has changed between
  // versions, and this can't drift from whatever TextInput expects.
  const handleFocus: NonNullable<TextInputProps['onFocus']> = event => {
    // Keeps the field visible when focus moves to it while the keyboard is
    // already open — no keyboard event fires for that.
    assist?.ensureVisible(field.current);
    onFocus?.(event);
  };

  const input = (
    <TextInput
      ref={field}
      placeholderTextColor={colors.textMuted}
      // `style` stays last so a caller can still override the padding the
      // toggle reserves for itself.
      style={[styles.input, secureTextEntry ? styles.inputWithToggle : null, style]}
      onFocus={handleFocus}
      secureTextEntry={secureTextEntry && !revealed}
      {...rest}
    />
  );

  return (
    <View>
      {label ? (
        <AppText variant="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      {secureTextEntry ? (
        <View>
          {input}
          <Pressable
            onPress={() => setRevealed(value => !value)}
            hitSlop={8}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}>
            <Icon
              name={revealed ? 'eyeOff' : 'eye'}
              size={20}
              color={colors.textSecondary}
              strokeWidth={1.75}
            />
          </Pressable>
        </View>
      ) : (
        input
      )}
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
  inputWithToggle: {
    // Clears the toggle's 52pt tap target, so a long password doesn't run
    // under the icon.
    paddingRight: spacing.xxxl,
  },
  toggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
});
