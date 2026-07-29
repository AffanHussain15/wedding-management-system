/**
 * Phone field with the country code rendered as a fixed, unselectable prefix.
 *
 * Users type the national number they actually know (`0300 1234567`) and never
 * have to find a `+` on the phone keypad, which on Android sits behind a
 * secondary page. `value` is the national part; call `normalizePhone` on it
 * before sending it to the API, and `toNationalPhone` when seeding an edit form
 * from a stored E.164 number.
 *
 * A leading trunk `0` is accepted and stripped on the way out rather than
 * blocked as you type — silently deleting a keystroke reads as a broken field.
 */

import React, { useRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '@theme';
import { PK_DIAL_CODE } from '@utils';
import { AppText } from './AppText';
import { useScrollAssist } from './ScreenContainer';

export interface PhoneInputProps
  extends Omit<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'value'> {
  label?: string;
  /** National digits, e.g. "3001234567" or "03001234567". */
  value: string;
  /** Country calling code shown as the prefix, without the `+`. */
  dialCode?: string;
}

export function PhoneInput({
  label,
  value,
  style,
  onFocus,
  editable = true,
  placeholder = '300 1234567',
  dialCode = PK_DIAL_CODE,
  ...rest
}: PhoneInputProps): React.JSX.Element {
  const field = useRef<TextInput>(null);
  const assist = useScrollAssist();

  const handleFocus: NonNullable<TextInputProps['onFocus']> = event => {
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

      <View style={[styles.field, !editable && styles.fieldDisabled]}>
        {/* Part of the field's own chrome, not the text value — hence its own
            divider and muted colour, so it doesn't read as something typed. */}
        <View style={styles.prefix}>
          <AppText variant="callout" color={colors.textSecondary}>
            +{dialCode}
          </AppText>
        </View>
        <TextInput
          ref={field}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          autoCapitalize="none"
          editable={editable}
          style={[styles.input, style]}
          onFocus={handleFocus}
          accessibilityLabel={label}
          // Read out with the prefix, which is invisible to a screen reader
          // walking the text value alone.
          accessibilityHint={`Country code plus ${dialCode}`}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    // Clips the prefix divider to the rounded corner.
    overflow: 'hidden',
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  prefix: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRightWidth: 1.5,
    borderRightColor: colors.border,
  },
  input: {
    flex: 1,
    // No vertical padding: the row's minHeight already sets the field height,
    // and padding on top of it makes the text sit low against the prefix.
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...typography.callout,
  },
});
