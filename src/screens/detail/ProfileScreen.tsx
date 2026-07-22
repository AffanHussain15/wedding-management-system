import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ScreenContainer, AppText, Card, BackButton, Avatar } from '@components';
import { useWedding } from '@store';
import { colors, radius, spacing, typography } from '@theme';
import { formatDate } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

const FAMILY = [
  { name: 'Danyal Ahmed', role: 'Partner' },
  { name: 'Ammi', role: 'Mother' },
];

export function ProfileScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state } = useWedding();
  const { wedding } = state;
  const [notifications, setNotifications] = useState(true);

  const logout = () => nav.reset({ index: 0, routes: [{ name: 'Login' }] });

  return (
    <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
      <BackButton onPress={() => nav.goBack()} />

      <Card style={styles.profile}>
        <Avatar name={`${wedding.bride} ${wedding.groom}`} size={56} />
        <View style={styles.flex}>
          <AppText style={typography.title}>
            {wedding.bride} & {wedding.groom}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.profileSub}>
            {wedding.city} · {formatDate(wedding.weddingDate, 'monthDay')}
          </AppText>
        </View>
      </Card>

      <AppText variant="overline" color={colors.textMuted} style={styles.sectionLabel}>
        Family access / Khandaan
      </AppText>
      <View style={styles.family}>
        {FAMILY.map(m => (
          <Card key={m.name} style={styles.familyRow}>
            <Avatar name={m.name} size={32} />
            <AppText variant="label" color={colors.text} style={styles.flex}>
              {m.name.split(' ')[0]}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {m.role}
            </AppText>
          </Card>
        ))}
        <Pressable onPress={() => nav.navigate('FamilyLink')} style={styles.manage}>
          <AppText variant="label" color={colors.primary}>
            + Manage family access
          </AppText>
        </Pressable>
      </View>

      <AppText variant="overline" color={colors.textMuted} style={styles.sectionLabel}>
        Preferences
      </AppText>
      <Card padded={false} style={styles.prefs}>
        <PrefRow label="Language" value="English" />
        <PrefRow label="Theme" value="Light" />
        <PrefRow
          label="Notifications"
          right={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.borderSubtle, true: colors.primary }}
              thumbColor={colors.surface}
            />
          }
          last
        />
      </Card>

      <Pressable style={styles.logout} onPress={logout}>
        <AppText variant="button" color={colors.danger}>
          Log out
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
}

function PrefRow({
  label,
  value,
  right,
  last = false,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[styles.prefRow, !last && styles.prefRowDivider]}>
      <AppText variant="callout" color={colors.text}>
        {label}
      </AppText>
      {right ?? (
        <AppText variant="callout" color={colors.textSecondary}>
          {value}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: spacing.xs, paddingBottom: spacing.xl },
  flex: { flex: 1 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    borderRadius: radius.xl,
    marginTop: spacing.base,
    marginBottom: spacing.lg,
  },
  profileSub: { marginTop: spacing.xxs },
  sectionLabel: { marginBottom: spacing.md },
  family: { gap: spacing.sm, marginBottom: spacing.lg },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
  },
  manage: { alignItems: 'center', paddingVertical: spacing.sm },
  prefs: { borderRadius: radius.lg, marginBottom: spacing.lg },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  prefRowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(109,15,43,0.06)' },
  logout: {
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(178,58,58,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
