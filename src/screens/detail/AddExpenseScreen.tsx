import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function AddExpenseScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Add Expense"
      subtitle="Log a payment"
      links={[{ label: 'Done', onPress: () => nav.goBack() }]}
    />
  );
}
