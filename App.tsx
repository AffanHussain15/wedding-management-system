/**
 * Smart Wedding Management App — root.
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { WeddingProvider } from '@store';
import { RootNavigator, navigationTheme } from '@navigation';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <WeddingProvider>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </WeddingProvider>
    </SafeAreaProvider>
  );
}

export default App;
