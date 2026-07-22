import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function SignupScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Sign Up"
      subtitle="Create your account"
      links={[
        { label: 'Create Account', onPress: () => nav.replace('FamilyLink') },
        { label: 'Log in instead', onPress: () => nav.navigate('Login') },
      ]}
    />
  );
}
