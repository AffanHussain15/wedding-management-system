/**
 * Date input: looks like `Input`, but taps open a `Calendar` sheet instead of
 * the keyboard, so the value is always a real "YYYY-MM-DD" day.
 *
 * The sheet keeps a draft until the user confirms — paging through months
 * shouldn't commit anything, and Cancel has to be able to put the old date
 * back.
 */

import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '@theme';
import { formatDate } from '@utils';
import { AppText } from './AppText';
import { Button } from './Button';
import { Calendar } from './Calendar';
import { Icon } from './Icon';

export interface DateFieldProps {
  label?: string;
  /** Selected day as "YYYY-MM-DD", or '' when unset. */
  value: string;
  onChange: (iso: string) => void;
  /** Shown in the field while no date is set. */
  placeholder?: string;
  /** Heading inside the calendar sheet. */
  title?: string;
  disabled?: boolean;
  /** Earliest selectable day, inclusive, as "YYYY-MM-DD". */
  min?: string;
  /** Latest selectable day, inclusive, as "YYYY-MM-DD". */
  max?: string;
  /** Offers a Clear action in the sheet, for dates that may be left unset. */
  clearable?: boolean;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  title = 'Select a date',
  disabled = false,
  min,
  max,
  clearable = false,
}: DateFieldProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const show = () => {
    setDraft(value);
    setOpen(true);
  };

  const commit = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  return (
    <View>
      {label ? (
        <AppText variant="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <Pressable
        onPress={show}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label ?? title}
        accessibilityValue={{ text: value ? formatDate(value, 'long') : 'Not set' }}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.field,
          pressed && !disabled && styles.fieldPressed,
          disabled && styles.fieldDisabled,
        ]}>
        <AppText variant="callout" color={value ? colors.text : colors.textMuted}>
          {value ? formatDate(value, 'long') : placeholder}
        </AppText>
        <Icon name="calendar" size={18} color={colors.primary} />
      </Pressable>

      {/* Mounted only while open, so the calendar always opens on the current
          value's month rather than wherever it was last left. */}
      {open ? (
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            {/* Swallows taps on the card so they don't dismiss the sheet. */}
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHeader}>
                <AppText style={typography.serifHeading}>{title}</AppText>
                <Pressable
                  onPress={() => setOpen(false)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close">
                  <Icon name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <Calendar value={draft} onChange={setDraft} min={min} max={max} />

              <View style={styles.actions}>
                {clearable ? (
                  <Button
                    label="Clear"
                    variant="outline"
                    fullWidth={false}
                    style={styles.secondaryBtn}
                    onPress={() => commit('')}
                  />
                ) : null}
                <Button
                  label="Done"
                  fullWidth={false}
                  style={styles.primaryBtn}
                  disabled={!draft}
                  onPress={() => commit(draft)}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
  },
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  fieldPressed: {
    borderColor: colors.borderStrong,
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  secondaryBtn: {
    flex: 1,
  },
  primaryBtn: {
    flex: 2,
  },
});
