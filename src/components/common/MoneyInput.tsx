/**
 * Amount field that shows thousands separators as you type — 10000000 reads
 * back as "10,000,000", which is the difference between checking a figure at a
 * glance and counting zeros.
 *
 * The grouping is display-only: `value` and `onChangeText` both speak raw
 * digits, so callers keep doing `Number(value)` and sending it straight to the
 * API. Seed it the same way as a plain `Input` (`String(existing.amount)`) —
 * the commas are added on render.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@theme';
import { groupAmount, parseAmountInput, shortAmount } from '@utils';
import { AppText } from './AppText';
import { Input, type InputProps } from './Input';

export interface MoneyInputProps
  extends Omit<InputProps, 'value' | 'onChangeText' | 'keyboardType'> {
  /** Raw digits, e.g. "10000000" — never the grouped display string. */
  value: string;
  /** Receives raw digits, with the separators stripped back out. */
  onChangeText: (value: string) => void;
}

export function MoneyInput({
  value,
  onChangeText,
  ...rest
}: MoneyInputProps): React.JSX.Element {
  // The figure in lac/crore, under the field. Commas tell you a number is big;
  // "1 lac" tells you *how* big without counting the groups. Empty under a
  // thousand, so a small amount doesn't get a line that says nothing.
  const short = shortAmount(Number(value));

  return (
    <View>
      <Input
        {...rest}
        value={groupAmount(value)}
        onChangeText={text => onChangeText(parseAmountInput(text))}
        keyboardType="number-pad"
      />
      {short ? (
        <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
          {short}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginTop: spacing.xs,
  },
});
