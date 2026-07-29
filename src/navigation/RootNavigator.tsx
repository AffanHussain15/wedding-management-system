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
} from '@screens';

import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const {
    ready,
    isAuthenticated,
    needsWeddingSetup,
    activeWeddingId,
    weddings,
    profileError,
    profileLoaded,
  } = useAuth();

  // Hold the branded splash until the stored session has been read, so an
  // already-signed-in user never sees the login screen flash by.
  if (!ready) return <SplashScreen />;

  // Signed in, but `GET /users/me` hasn't answered yet and there's no
  // remembered wedding to fall back on. Keep waiting: treating unknown
  // memberships as "none" would drop an existing couple into the setup wizard
  // for as long as the request takes.
  if (isAuthenticated && !profileLoaded && !activeWeddingId) return <SplashScreen />;

  // Signed in, but we couldn't load which weddings they belong to and have no
  // remembered one either. Offer a retry rather than dropping into the setup
  // wizard, which would invite them to create a duplicate wedding.
  if (isAuthenticated && profileError && !activeWeddingId) {
    return <ProfileErrorScreen />;
  }

  const noWeddingSelected = needsWeddingSetup || !activeWeddingId;

  // `Setup`, `SelectWedding` and `FamilyLink` are deliberately registered in
  // both the noWeddingSelected and authenticated trees below (so an
  // already-signed-in user can still reach them, e.g. "Create Another
  // Wedding"). That means when `noWeddingSelected` flips — e.g. finishing the
  // setup wizard — "Setup" is a valid route in the *new* tree too, so the
  // navigator has no reason to move off it on its own; only forcing a fresh
  // mount (via `key`) makes it land on that tree's first screen instead of
  // silently staying put until the app is restarted.
  const mode = !isAuthenticated ? 'guest' : noWeddingSelected ? 'setup' : 'app';

  return (
    <Stack.Navigator
      key={mode}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: { fontFamily: typography.title.fontFamily },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      {!isAuthenticated ? (
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Group>
      ) : noWeddingSelected ? (
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
