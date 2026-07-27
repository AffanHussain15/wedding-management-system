import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

import {
  ScreenContainer,
  AppText,
  BackButton,
  Button,
  Input,
  FieldError,
  FormBanner,
} from '@components';
import { api } from '@services';
import { useMutation } from '@hooks';
import { colors, spacing, typography } from '@theme';
import type { RootStackParamList } from '@navigation/types';
import { useAppNavigation } from '@navigation/hooks';

/** Same rule the backend's ResetPasswordDto enforces. */
const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export function ResetPasswordScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'ResetPassword'>>();

  const [email, setEmail] = useState(params?.email ?? '');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const { run, loading, error, fieldErrors } = useMutation(api.auth.resetPassword);
  const errors = { ...localErrors, ...fieldErrors };
  const hasFieldErrors = Object.keys(errors).length > 0;

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!email.trim().includes('@')) next.email = 'Enter the email you requested the reset for.';
    if (!token.trim()) next.token = 'Paste the token from your reset link.';
    if (!PASSWORD_RULE.test(password)) {
      next.newPassword = 'At least 8 characters, with one uppercase letter and one number.';
    } else if (password !== confirm) {
      next.confirm = 'Passwords do not match.';
    }
    setLocalErrors(next);
    if (Object.keys(next).length > 0) return;

    const result = await run({
      email: email.trim(),
      token: token.trim(),
      newPassword: password,
    });
    if (result.ok) setDone(true);
  };

  if (done) {
    return (
      <ScreenContainer scroll padded={false} contentContainerStyle={styles.root}>
        <AppText style={[typography.serifValue, styles.title]}>Password updated</AppText>
        <View style={styles.form}>
          {/* The server revokes every refresh token on reset, so all devices
              have to sign in again — worth saying out loud. */}
          <FormBanner
            tone="success"
            message="Your password has been changed. You've been signed out of all devices."
          />
          <Button label="Log In" onPress={() => nav.navigate('Login')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.root}>
      <BackButton onPress={() => nav.goBack()} />

      <AppText style={[typography.serifValue, styles.title]}>Set a new password</AppText>
      <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
        Paste the token from your reset link, then choose a new password.
      </AppText>

      <View style={styles.form}>
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
        <FieldError message={errors.email} />

        <Input
          label="Reset token"
          placeholder="Paste the token"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <FieldError message={errors.token} />

        <Input
          label="New password"
          placeholder="8+ chars, 1 uppercase, 1 number"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <FieldError message={errors.newPassword} />

        <Input
          label="Confirm new password"
          placeholder="Re-enter it"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          editable={!loading}
        />
        <FieldError message={errors.confirm} />

        <Button
          label="Update Password"
          onPress={submit}
          loading={loading}
          style={styles.cta}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginTop: spacing.base,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  cta: {
    marginTop: spacing.base,
  },
});
