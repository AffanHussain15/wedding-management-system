import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function BudgetScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Budget"
      subtitle="Spend vs. allotted"
      links={[{ label: 'Add Expense', onPress: () => nav.navigate('AddExpense') }]}
    />
  );
}
