import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Button, Input, Icon } from '@components';
import { colors, radius, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

export function LoginScreen(): React.JSX.Element {
  const nav = useAppNavigation();

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.root}>
      <Pressable style={styles.back} onPress={() => nav.navigate('Onboarding')}>
        <Icon name="chevronRight" size={18} color={colors.primary} />
      </Pressable>

      <AppText style={typography.serifValue}>Welcome back</AppText>
      <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
        Log in to continue planning.
      </AppText>

      <View style={styles.form}>
        <Input placeholder="Email or phone number" autoCapitalize="none" keyboardType="email-address" />
        <Input placeholder="Password" secureTextEntry />
      </View>

      <AppText variant="caption" color={colors.primary} style={styles.forgot}>
        Forgot password?
      </AppText>

      <Button label="Log In" onPress={() => nav.replace('Main')} />

      <AppText variant="caption" color={colors.textSecondary} center style={styles.footer}>
        New here?{' '}
        <AppText variant="caption" color={colors.primary} onPress={() => nav.navigate('Signup')}>
          Sign Up
        </AppText>
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    transform: [{ scaleX: -1 }],
  },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl },
  form: { gap: spacing.md },
  forgot: { alignSelf: 'flex-end', marginTop: spacing.md, marginBottom: spacing.xl },
  footer: { marginTop: spacing.xl },
});
