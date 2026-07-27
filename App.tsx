/**
 * Smart Wedding Management App — root.
 *
 * Provider order matters: `AuthProvider` owns the session and which wedding is
 * active, and `WeddingProvider` needs that wedding id to fetch anything — so
 * the wedding store is mounted inside it and keyed off `activeWeddingId`.
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { AuthProvider, WeddingProvider, useAuth } from '@store';
import { RootNavigator, navigationTheme } from '@navigation';

/**
 * Bridges the two providers. Split out because it has to call `useAuth`, which
 * is only available below `AuthProvider`.
 */
function AuthedApp(): React.JSX.Element {
  const { activeWeddingId } = useAuth();

  return (
    <WeddingProvider weddingId={activeWeddingId}>
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
    </WeddingProvider>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <AuthProvider>
        <AuthedApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
