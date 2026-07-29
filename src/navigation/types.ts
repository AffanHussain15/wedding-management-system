import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Vendors: undefined;
  Guests: undefined;
  Budget: undefined;
  Timeline: undefined;
};

/**
 * Ids are the server's UUID strings, so route params are `string`.
 *
 * `RootNavigator` splits this stack by auth state: while signed out only the
 * onboarding routes are registered, and while signed in only the app routes —
 * so a screen can never be reached without the session it needs.
 */
export type RootStackParamList = {
  // Unauthenticated
  Onboarding: undefined;
  Signup: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string } | undefined;

  // Authenticated, before a wedding exists
  Setup: undefined;
  SelectWedding: undefined;

  // Authenticated
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  FamilyLink: undefined;
  VendorDetail: { vendorId: string };
  AddVendor: undefined;
  AddGuest: undefined;
  ImportContacts: undefined;
  AddExpense: undefined;
  FunctionDetail: { functionId: string };
  AddFunction: undefined;
  Reminders: undefined;
  Tasks: undefined;
  AddTask: undefined;
  Seating: undefined;
  Profile: undefined;
};

// Makes useNavigation / useRoute typed app-wide without per-call generics.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
