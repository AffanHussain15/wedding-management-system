/**
 * Root stack: onboarding/auth flow (no header) → Main tabs → detail screens
 * (with header, pushed over the tabs). Detail "Add" screens present modally.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors, typography } from '@theme';
import {
  SplashScreen,
  OnboardingScreen,
  SignupScreen,
  LoginScreen,
  FamilyLinkScreen,
  SetupScreen,
  VendorDetailScreen,
  AddVendorScreen,
  AddGuestScreen,
  AddExpenseScreen,
  FunctionDetailScreen,
  RemindersScreen,
  TasksScreen,
  SeatingScreen,
  ProfileScreen,
} from '@screens';

import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: { fontFamily: typography.title.fontFamily },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Group screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="FamilyLink" component={FamilyLinkScreen} />
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Group>

      <Stack.Group>
        <Stack.Screen
          name="VendorDetail"
          component={VendorDetailScreen}
          options={{ title: 'Vendor' }}
        />
        <Stack.Screen
          name="FunctionDetail"
          component={FunctionDetailScreen}
          options={{ title: 'Function' }}
        />
        <Stack.Screen name="Reminders" component={RemindersScreen} />
        <Stack.Screen name="Tasks" component={TasksScreen} />
        <Stack.Screen name="Seating" component={SeatingScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Group>

      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen
          name="AddVendor"
          component={AddVendorScreen}
          options={{ title: 'Add Vendor' }}
        />
        <Stack.Screen
          name="AddGuest"
          component={AddGuestScreen}
          options={{ title: 'Add Guest' }}
        />
        <Stack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{ title: 'Add Expense' }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}
