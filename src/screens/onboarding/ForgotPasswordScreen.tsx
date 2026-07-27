import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
import { useAppNavigation } from '@navigation/hooks';

export function ForgotPasswordScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const { run, loading, error, fieldErrors } = useMutation((address: string) =>
    api.auth.forgotPassword(address),
  );

  const submit = async () => {
    const address = email.trim();
    if (!address) return;
    const result = await run(address);
    if (result.ok) setSent(true);
  };

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.root}>
      <BackButton onPress={() => nav.goBack()} />

      <AppText style={[typography.serifValue, styles.title]}>Reset your password</AppText>
      <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
        Enter your email and we'll send a reset link.
      </AppText>

      {sent ? (
        <View style={styles.form}>
          {/*
            The API always returns the same message whether or not the address
            exists, so it can't be used to discover accounts — the copy here
            reflects that rather than confirming the email is registered.
          */}
          <FormBanner
            tone="success"
            message="If that email is registered, a reset link is on its way."
          />
          <AppText variant="caption" color={colors.textSecondary}>
            Email delivery is not yet implemented on the server — the reset link is
            currently only written to the backend log. Once you have a token, enter
            it on the next screen.
          </AppText>
          <Button
            label="I have a reset token"
            variant="outline"
            onPress={() => nav.navigate('ResetPassword', { email: email.trim() })}
          />
          <Button label="Back to Log In" onPress={() => nav.navigate('Login')} />
        </View>
      ) : (
        <View style={styles.form}>
          <FormBanner message={fieldErrors.email ? null : error?.message} />

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

          <Button
            label="Send Reset Link"
            onPress={submit}
            loading={loading}
            disabled={!email.trim()}
            style={styles.cta}
          />
        </View>
      )}
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
