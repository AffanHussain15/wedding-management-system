import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ScreenContainer, AppText, Button, Card, Avatar, Icon, type IconName } from '@components';
import { colors, radius, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

const LINKED = [
  { name: 'Danyal Ahmed', role: 'Partner' },
  { name: 'Ammi', role: 'Mother' },
];

export function FamilyLinkScreen(): React.JSX.Element {
  const nav = useAppNavigation();

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.root}>
      <AppText style={typography.serifValue}>You're not planning this alone</AppText>
      <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
        Link your partner and family to one shared account — a single source of truth for everyone.
      </AppText>

      <Card style={styles.hero}>
        <View style={styles.heroAvatar} />
        <Svg width={34} height={20} viewBox="0 0 34 20">
          <Circle cx={10} cy={10} r={7} fill="none" stroke={colors.accent} strokeWidth={2} />
          <Circle cx={24} cy={10} r={7} fill="none" stroke={colors.accent} strokeWidth={2} />
        </Svg>
        <View style={styles.heroAvatar} />
      </Card>

      <View style={styles.options}>
        <InviteRow icon="link" title="Invite via link" subtitle="Share a one-tap join link" />
        <InviteRow icon="code" title="Invite via code" subtitle="WEDD-8421 — share with Khandaan" />
      </View>

      <AppText variant="overline" color={colors.textMuted} style={styles.linkedLabel}>
        Already linked
      </AppText>
      <View style={styles.linked}>
        {LINKED.map(m => (
          <View key={m.name} style={styles.linkedRow}>
            <Avatar name={m.name} size={34} />
            <AppText variant="label" style={styles.flex}>
              {m.name.split(' ')[0]} ({m.role})
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Joined
            </AppText>
          </View>
        ))}
      </View>

      <Button label="Continue" onPress={() => nav.navigate('Setup')} />
      <Pressable onPress={() => nav.navigate('Setup')} style={styles.skip} hitSlop={8}>
        <AppText variant="caption" color={colors.textMuted}>
          Skip for now
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
}

function InviteRow({ icon, title, subtitle }: { icon: IconName; title: string; subtitle: string }) {
  return (
    <Card onPress={() => {}} style={styles.inviteRow}>
      <Icon name={icon} size={20} />
      <View style={styles.flex}>
        <AppText variant="label" color={colors.text}>
          {title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {subtitle}
        </AppText>
      </View>
      <Icon name="chevronRight" size={14} color={colors.textMuted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceSand,
  },
  options: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  linkedLabel: {
    marginBottom: spacing.md,
  },
  linked: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skip: {
    alignSelf: 'center',
    marginTop: spacing.base,
  },
});
