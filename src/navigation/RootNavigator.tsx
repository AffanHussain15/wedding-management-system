/**
 * Root stack, gated on auth state.
 *
 * Rather than one flat stack anything can navigate into, exactly one of four
 * trees is mounted at a time:
 *
 *   1. session still loading  → SplashScreen (rendered directly, not a route)
 *   2. signed out             → onboarding / login / password-reset
 *   3. signed in, no wedding  → wedding picker or setup wizard
 *   4. signed in with wedding → the app
 *
 * Because the signed-out routes don't exist while authenticated (and vice
 * versa), logging in or out swaps the whole tree — no `reset()` calls, and no
 * way to reach an app screen without a session.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors, typography } from '@theme';
import { useAuth } from '@store';
import {
  SplashScreen,
  ProfileErrorScreen,
  OnboardingScreen,
  SignupScreen,
  LoginScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  FamilyLinkScreen,
  SetupScreen,
  SelectWeddingScreen,
  VendorDetailScreen,
  AddVendorScreen,
  AddGuestScreen,
  ImportContactsScreen,
  AddExpenseScreen,
  FunctionDetailScreen,
  AddFunctionScreen,
  RemindersScreen,
  TasksScreen,
  AddTaskScreen,
  SeatingScreen,
  ProfileScreen,
  AiAssistantScreen,
} from '@screens';

import { MainTabNavigator } from './MainTabNavigator';
import { useRootTree } from './hooks';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * `Setup`, `SelectWedding` and `FamilyLink` are deliberately registered in both
 * the setup and app trees below, so an already-signed-in user can still reach
 * them ("Create Another Wedding", "Switch Wedding"). The cost is that swapping
 * trees cannot be left to the navigator: `NavigationContainer` keeps its
 * navigation state across the swap, and a stack rehydrates every route whose
 * name still exists in the new tree — so finishing the wizard used to re-mount
 * `Setup` (a *fresh* one, back at step 1) instead of landing on `Main`, with
 * the wedding created and no way into the app but to sign out.
 *
 * Re-mounting the navigator alone doesn't help: the retained state lives one
 * level up. `App` therefore keys the whole `NavigationContainer` on
 * `useRootTree()`, so each swap starts from the new tree's first screen.
 */
export function RootNavigator(): React.JSX.Element {
  const { weddings } = useAuth();
  const tree = useRootTree();

  if (tree === 'loading') return <SplashScreen />;
  if (tree === 'profileError') return <ProfileErrorScreen />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: { fontFamily: typography.title.fontFamily },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      {tree === 'guest' ? (
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Group>
      ) : tree === 'setup' ? (
        <Stack.Group screenOptions={{ headerShown: false }}>
          {/*
            Signed in with nothing selected. Existing members get the picker
            first; a brand-new account goes straight into setup.
          */}
          {weddings.length > 0 ? (
            <Stack.Screen name="SelectWedding" component={SelectWeddingScreen} />
          ) : null}
          <Stack.Screen name="Setup" component={SetupScreen} />
          <Stack.Screen name="FamilyLink" component={FamilyLinkScreen} />
        </Stack.Group>
      ) : (
        <>
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="VendorDetail" component={VendorDetailScreen} />
            <Stack.Screen name="FunctionDetail" component={FunctionDetailScreen} />
            <Stack.Screen name="Reminders" component={RemindersScreen} />
            <Stack.Screen name="Tasks" component={TasksScreen} />
            <Stack.Screen name="Seating" component={SeatingScreen} />
            <Stack.Screen name="AiAssistant" component={AiAssistantScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="FamilyLink" component={FamilyLinkScreen} />
            <Stack.Screen name="SelectWedding" component={SelectWeddingScreen} />
            <Stack.Screen name="Setup" component={SetupScreen} />
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
              name="ImportContacts"
              component={ImportContactsScreen}
              options={{ title: 'Import Contacts' }}
            />
            <Stack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{ title: 'Add Expense' }}
            />
            <Stack.Screen
              name="AddFunction"
              component={AddFunctionScreen}
              options={{ title: 'Add Function' }}
            />
            <Stack.Screen
              name="AddTask"
              component={AddTaskScreen}
              options={{ title: 'Add Task' }}
            />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
}
