import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function SetupScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Wedding Setup"
      subtitle="Couple · Date · Functions"
      links={[{ label: 'Finish Setup', onPress: () => nav.replace('Main') }]}
    />
  );
}
