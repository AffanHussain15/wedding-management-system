import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function LoginScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Log In"
      subtitle="Welcome back"
      links={[
        { label: 'Log In', onPress: () => nav.replace('Main') },
        { label: 'Create an account', onPress: () => nav.navigate('Signup') },
      ]}
    />
  );
}
