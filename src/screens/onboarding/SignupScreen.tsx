import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Button, Input, Icon } from '@components';
import { colors, radius, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

export function SignupScreen(): React.JSX.Element {
  const nav = useAppNavigation();

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
        <Input placeholder="Full name" autoCapitalize="words" />
        <Input
          placeholder="Email or phone number"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input placeholder="Password" secureTextEntry />
      </View>

      <Button label="Sign Up" onPress={() => nav.replace('FamilyLink')} style={styles.cta} />

      <View style={styles.divider}>
        <View style={styles.line} />
        <AppText variant="caption" color={colors.textMuted}>
          or continue with
        </AppText>
        <View style={styles.line} />
      </View>

      <View style={styles.social}>
        <Button label="Google" variant="outline" fullWidth={false} style={styles.socialButton} />
        <Button label="OTP" variant="outline" fullWidth={false} style={styles.socialButton} />
      </View>

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
  cta: { marginTop: spacing.xl },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.borderSubtle },
  social: { flexDirection: 'row', gap: spacing.md },
  socialButton: { flex: 1 },
  footer: { marginTop: spacing.xl },
});
