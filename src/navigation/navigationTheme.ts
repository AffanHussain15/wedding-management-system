/** Maps the app palette onto React Navigation's theme to avoid color flashes. */

import { DefaultTheme, type Theme } from '@react-navigation/native';

import { colors } from '@theme';

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.borderSubtle,
    notification: colors.accent,
  },
};
