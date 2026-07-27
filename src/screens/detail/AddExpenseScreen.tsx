import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Button,
  Input,
  FilterChip,
  FieldError,
  FormBanner,
} from '@components';
import { useWedding } from '@store';
import { BUDGET_CATEGORIES, PAYMENT_METHODS } from '@constants';
import type { BudgetCategoryName, PaymentMethodLabel } from '@types';
import { colors, spacing } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

export function AddExpenseScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { actions } = useWedding();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BudgetCategoryName>('Catering');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethodLabel>('Cash');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: Record<string, string> = {};
    // The API requires a 2–150 character title and a positive amount.
    if (title.trim().length < 2) next.title = 'Enter a title of at least 2 characters.';
    const value = Number(amount);
    if (!(value > 0)) next.amount = 'Enter an amount greater than zero.';
    setErrors(next);
    setBanner(null);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const result = await actions.addExpense({
      category,
      title: title.trim(),
      amount: value,
      method,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    setSaving(false);

    if (!result.ok) {
      setErrors(result.error.fieldErrors);
      setBanner(result.message);
      return;
    }
    nav.goBack();
  };

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <FormBanner message={banner} />

        <Input
          label="What was it for?"
          placeholder="e.g. Mehndi stage decor"
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
          editable={!saving}
        />
        <FieldError message={errors.title} />

        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Category
          </AppText>
          {/* Fixed server-side enum, so every option is always offered — not
              only the categories that already have spend against them. */}
          <View style={styles.chips}>
            {BUDGET_CATEGORIES.map(c => (
              <FilterChip key={c} label={c} active={c === category} onPress={() => setCategory(c)} />
            ))}
          </View>
        </View>
        <FieldError message={errors.category} />

        <Input
          label="Amount (Rs)"
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          editable={!saving}
        />
        <FieldError message={errors.amount} />

        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Paid by
          </AppText>
          <View style={styles.chipRow}>
            {PAYMENT_METHODS.map(m => (
              <FilterChip
                key={m}
                label={m}
                active={m === method}
                onPress={() => setMethod(m)}
                style={styles.chip}
              />
            ))}
          </View>
        </View>

        <Input
          label="Notes (optional)"
          placeholder="Anything worth remembering"
          value={notes}
          onChangeText={setNotes}
          multiline
          editable={!saving}
        />
      </View>

      <Button label="Save Expense" onPress={save} loading={saving} style={styles.cta} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: spacing.base,
    paddingBottom: spacing.xxl,
  },
  form: {
    gap: spacing.base,
  },
  label: {
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexGrow: 1,
  },
  cta: {
    marginTop: spacing.xl,
  },
});
