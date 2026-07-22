import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Button, Input, FilterChip } from '@components';
import { useWedding } from '@store';
import { EXPENSE_TYPES } from '@constants';
import type { ExpenseType } from '@types';
import { colors, spacing } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

export function AddExpenseScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, actions } = useWedding();

  const [category, setCategory] = useState(state.budget[0]?.name ?? '');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<ExpenseType>('Advance');

  const save = () => {
    actions.addExpense(category, parseFloat(amount) || 0);
    nav.goBack();
  };

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Category
          </AppText>
          <View style={styles.chips}>
            {state.budget.map(c => (
              <FilterChip
                key={c.name}
                label={c.name}
                active={c.name === category}
                onPress={() => setCategory(c.name)}
              />
            ))}
          </View>
        </View>

        <Input
          label="Amount (Rs)"
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
        />

        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Type
          </AppText>
          <View style={styles.typeRow}>
            {EXPENSE_TYPES.map(t => (
              <FilterChip
                key={t}
                label={t}
                active={t === type}
                onPress={() => setType(t)}
                style={styles.typeChip}
              />
            ))}
          </View>
        </View>
      </View>

      <Button label="Save Expense" onPress={save} style={styles.cta} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: spacing.base, paddingBottom: spacing.xxl },
  form: { gap: spacing.base },
  label: { marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: { flex: 1 },
  cta: { marginTop: spacing.xl },
});
