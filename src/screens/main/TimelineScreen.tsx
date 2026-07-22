import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function TimelineScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Timeline"
      subtitle="Dholki → Walima"
      links={[
        { label: 'Open a function', onPress: () => nav.navigate('FunctionDetail', { functionId: 3 }) },
      ]}
    />
  );
}
