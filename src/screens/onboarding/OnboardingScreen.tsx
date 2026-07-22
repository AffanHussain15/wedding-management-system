import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function OnboardingScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Welcome"
      subtitle="Onboarding slides"
      links={[
        { label: 'Continue', onPress: () => nav.navigate('Signup') },
        { label: 'I already have an account', onPress: () => nav.navigate('Login') },
      ]}
    />
  );
}
