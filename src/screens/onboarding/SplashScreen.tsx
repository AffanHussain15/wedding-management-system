import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function SplashScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Smart Wedding"
      subtitle="Splash"
      links={[
        { label: 'Get Started', onPress: () => nav.replace('Onboarding') },
        { label: 'Skip to App', onPress: () => nav.replace('Main') },
      ]}
    />
  );
}
