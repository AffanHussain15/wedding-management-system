import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Button,
  Input,
  Icon,
  FieldError,
  FormBanner,
} from '@components';
import { useAuth } from '@store';
import { useMutation } from '@hooks';
import { colors, radius, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

export function LoginScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { run, loading, error, fieldErrors } = useMutation(login);

  // Cheap client-side gate, so an obviously incomplete form never round-trips.
  const canSubmit = email.trim().length > 0 && password.length > 0;
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    // On success the root navigator swaps to the app stack on its own, so
    // there is deliberately no navigate() call here.
    await run({ email: email.trim(), password });
  };

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
        {/* Field-level messages take priority; this covers bad credentials,
            rate limiting (5 attempts / 15 min) and the server being down. */}
        <FormBanner message={hasFieldErrors ? null : error?.message} />

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
        />
        <FieldError message={fieldErrors.email} />

        <Input
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <FieldError message={fieldErrors.password} />
      </View>

      <Pressable onPress={() => nav.navigate('ForgotPassword')} hitSlop={8} style={styles.forgot}>
        <AppText variant="caption" color={colors.primary}>
          Forgot password?
        </AppText>
      </Pressable>

      <Button label="Log In" onPress={submit} loading={loading} disabled={!canSubmit} />

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
  root: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
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
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  footer: {
    marginTop: spacing.xl,
  },
});
