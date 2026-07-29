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
import { E164_PHONE } from '@constants';
import { colors, radius, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

/** Mirrors the backend's RegisterDto rule: 8+ chars, one uppercase, one digit. */
const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export function SignupScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const { run, loading, error, fieldErrors } = useMutation(register);

  // Server messages win over stale local ones for the same field.
  const errors = { ...localErrors, ...fieldErrors };
  const hasFieldErrors = Object.keys(errors).length > 0;

  const submit = async () => {
    // Checked here as well as server-side so the password rule is visible
    // before a request is spent on it.
    const next: Record<string, string> = {};
    if (fullName.trim().length < 2) {
      next.fullName = 'Enter your full name (at least 2 characters).';
    }
    if (!email.trim().includes('@')) {
      next.email = 'Enter a valid email address.';
    }
    if (!PASSWORD_RULE.test(password)) {
      next.password = 'At least 8 characters, with one uppercase letter and one number.';
    }
    if (phone.trim() && !E164_PHONE.test(phone.trim())) {
      next.phone = 'Use international format, e.g. +923001234567.';
    }
    setLocalErrors(next);
    if (Object.keys(next).length > 0) return;

    // On success the root navigator switches stacks by itself.
    await run({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    });
  };

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.root}>
      <Pressable style={styles.back} onPress={() => nav.navigate('Onboarding')}>
        <Icon name="chevronRight" size={18} color={colors.primary} />
      </Pressable>

      <AppText style={typography.serifValue}>Create your account</AppText>
      <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
        Start planning together — Shaadi ki shuruaat.
      </AppText>

      <View style={styles.form}>
        <FormBanner message={hasFieldErrors ? null : error?.message} />

        <Input
          label="Full name"
          placeholder="Ayesha Khan"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          editable={!loading}
        />
        <FieldError message={errors.fullName} />

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
        <FieldError message={errors.email} />

        <Input
          label="Phone (optional)"
          placeholder="+923001234567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
          editable={!loading}
        />
        <FieldError message={errors.phone} />

        <Input
          label="Password"
          placeholder="8+ chars, 1 uppercase, 1 number"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <FieldError message={errors.password} />
      </View>

      <Button label="Sign Up" onPress={submit} loading={loading} style={styles.cta} />

      {/*
        Google sign-in needs a native ID token. `api.auth.google(idToken)` and
        `useAuth().loginWithGoogle` are both wired; installing
        @react-native-google-signin/google-signin and handing its idToken to
        loginWithGoogle is all that remains — so this stays disabled rather
        than looking functional.
      */}
      <View style={styles.divider}>
        <View style={styles.line} />
        <AppText variant="caption" color={colors.textMuted}>
          or continue with
        </AppText>
        <View style={styles.line} />
      </View>
      <Button label="Google (setup required)" variant="outline" disabled />

      <AppText variant="caption" color={colors.textSecondary} center style={styles.footer}>
        Already have an account?{' '}
        <AppText variant="caption" color={colors.primary} onPress={() => nav.navigate('Login')}>
          Log In
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
  cta: {
    marginTop: spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  footer: {
    marginTop: spacing.xl,
  },
});
