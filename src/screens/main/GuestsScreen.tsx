import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function GuestsScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Guests"
      subtitle="RSVP tracking"
      links={[{ label: 'Add Guest', onPress: () => nav.navigate('AddGuest') }]}
    />
  );
}
