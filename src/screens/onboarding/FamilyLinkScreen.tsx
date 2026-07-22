import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function FamilyLinkScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Link Family"
      subtitle="Invite family to plan together"
      links={[
        { label: 'Continue', onPress: () => nav.navigate('Setup') },
        { label: 'Skip for now', onPress: () => nav.navigate('Setup') },
      ]}
    />
  );
}
