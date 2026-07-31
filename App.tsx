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
import { RootNavigator, navigationTheme, useRootTree } from '@navigation';

/**
 * Bridges the two providers. Split out because it has to call `useAuth`, which
 * is only available below `AuthProvider`.
 */
function AuthedApp(): React.JSX.Element {
  const { activeWeddingId } = useAuth();
  // Signing in, finishing the setup wizard or signing out swaps which tree
  // `RootNavigator` registers. The container is keyed on that so the swap also
  // discards the previous tree's navigation state — see `RootNavigator`, where
  // routes shared by two trees would otherwise survive the swap and strand the
  // user on the screen they just finished. The wedding store sits outside, so
  // this costs a fresh navigation state and no refetching.
  const tree = useRootTree();

  return (
    <WeddingProvider weddingId={activeWeddingId}>
      <NavigationContainer key={tree} theme={navigationTheme}>
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
