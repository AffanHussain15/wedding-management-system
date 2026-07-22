import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function AddVendorScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Add Vendor"
      subtitle="New booking"
      links={[{ label: 'Done', onPress: () => nav.goBack() }]}
    />
  );
}
