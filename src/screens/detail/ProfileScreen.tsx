import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function ProfileScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Profile"
      subtitle="Account & settings"
      links={[
        {
          label: 'Log out',
          onPress: () =>
            nav.reset({ index: 0, routes: [{ name: 'Login' }] }),
        },
      ]}
    />
  );
}
