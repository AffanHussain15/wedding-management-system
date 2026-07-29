/**
 * Logs a new expense, or edits an existing one when the route carries an
 * `expenseId` — the fields are the same either way, so one screen covers both.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

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
import type { RootStackParamList } from '@navigation/types';
import { useAppNavigation } from '@navigation/hooks';

export function AddExpenseScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'AddExpense'>>();
  const { state, actions } = useWedding();

  const expenseId = params?.expenseId;
  // `existing` only seeds the fields. The route param — not this lookup — drives
  // create-vs-edit, so a background refresh that drops the row from local state
  // mid-edit can't turn a save into a duplicate new expense.
  const existing = expenseId ? state.expenses.find(e => e.id === expenseId) : undefined;
  const isEdit = !!expenseId;

  const [title, setTitle] = useState(existing?.title ?? '');
  // `categoryName` is a free label for OTHER, so fall back rather than leaving
  // every chip inactive.
  const [category, setCategory] = useState<BudgetCategoryName>(() => {
    const label = existing?.categoryName as BudgetCategoryName | undefined;
    if (!label) return 'Catering';
    return BUDGET_CATEGORIES.includes(label) ? label : 'Other';
  });
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [method, setMethod] = useState<PaymentMethodLabel>(existing?.method ?? 'Cash');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The header title is set on the route, so editing has to override it.
  useEffect(() => {
    nav.setOptions({ title: isEdit ? 'Edit Expense' : 'Add Expense' });
  }, [nav, isEdit]);

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
    const input = {
      category,
      title: title.trim(),
      amount: value,
      method,
      // Sent even when blank, so clearing a note actually clears it.
      notes: notes.trim(),
    };
    const result = expenseId
      ? await actions.updateExpense(expenseId, input)
      : await actions.addExpense(input);
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
        {/* The server refuses amount edits on items it created from a vendor
            payment, so say where the real edit lives. */}
        <FormBanner
          tone="warning"
          message={
            existing?.fromVendorPayment
              ? 'This entry mirrors a vendor payment. Change the payment on the vendor to change the amount.'
              : null
          }
        />

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
          editable={!saving && !existing?.fromVendorPayment}
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

      <Button
        label={isEdit ? 'Save Changes' : 'Save Expense'}
        onPress={save}
        loading={saving}
        style={styles.cta}
      />
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
