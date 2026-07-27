/**
 * Shown when the user is signed in but `GET /users/me` failed, so the app
 * doesn't know which weddings they belong to.
 *
 * This exists to prevent a specific bad outcome: without it, an offline start
 * would fall through to the setup wizard and invite the user to create a second
 * wedding they already have.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Button, ErrorState } from '@components';
import { useAuth } from '@store';
import { colors, spacing, typography } from '@theme';

export function ProfileErrorScreen(): React.JSX.Element {
  const { profileError, refreshProfile, logout } = useAuth();

  return (
    <ScreenContainer contentContainerStyle={styles.root}>
      <AppText style={[typography.serifValue, styles.title]} center>
        Can't reach your weddings
      </AppText>
      <ErrorState
        fill={false}
        message={profileError ?? 'Something went wrong loading your account.'}
        onRetry={() => {
          refreshProfile();
        }}
      />
      <View style={styles.footer}>
        <AppText variant="caption" color={colors.textMuted} center style={styles.hint}>
          Check that the API is running and that the app is pointed at the right
          host (see `src/services/config.ts`).
        </AppText>
        <Button label="Log Out" variant="ghost" onPress={() => { logout(); }} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: spacing.base,
  },
  footer: {
    marginTop: spacing.xl,
  },
  hint: {
    marginBottom: spacing.md,
  },
});
