import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function AddGuestScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Add Guest"
      subtitle="New invitation"
      links={[{ label: 'Done', onPress: () => nav.goBack() }]}
    />
  );
}
