import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Vendors: undefined;
  Guests: undefined;
  Budget: undefined;
  Timeline: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Signup: undefined;
  Login: undefined;
  FamilyLink: undefined;
  Setup: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  VendorDetail: { vendorId: number };
  AddVendor: undefined;
  AddGuest: undefined;
  AddExpense: undefined;
  FunctionDetail: { functionId: number };
  Reminders: undefined;
  Tasks: undefined;
  Seating: undefined;
  Profile: undefined;
};

// Makes useNavigation / useRoute typed app-wide without per-call generics.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
