/** AI assistant. Shell only — nothing here talks to a model yet. */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, BackButton, GradientView, Icon } from '@components';
import { colors, radius, shadows, spacing, typography, weight } from '@theme';
import type { IconName } from '@components';
import { useAppNavigation } from '@navigation/hooks';

const HERO_GRADIENT = ['#8A2142', '#4A0A1C'] as const;

interface Starter {
  icon: IconName;
  title: string;
  detail: string;
}

const STARTERS: Starter[] = [
  {
    icon: 'budget',
    title: 'Where is my money going?',
    detail: 'Break the budget down by category and flag what is trending over.',
  },
  {
    icon: 'vendors',
    title: 'Which vendors still owe me a decision?',
    detail: 'Surface unconfirmed bookings and outstanding balances.',
  },
  {
    icon: 'guests',
    title: 'Who has not replied yet?',
    detail: 'Group pending RSVPs by function so the follow-ups write themselves.',
  },
  {
    icon: 'timeline',
    title: 'Is the timeline realistic?',
    detail: 'Check function dates against the tasks that have to land first.',
  },
];

export function AiAssistantScreen(): React.JSX.Element {
  const nav = useAppNavigation();

  return (
    <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
      <BackButton onPress={() => nav.goBack()} />

      <GradientView colors={HERO_GRADIENT} style={styles.hero}>
        <View style={styles.heroBadge}>
          <Icon name="sparkles" size={22} color={colors.accentBright} strokeWidth={2} />
        </View>
        <AppText style={[typography.serifValue, styles.heroTitle]} color={colors.textOnPrimary}>
          AI Assistant
        </AppText>
        <AppText variant="callout" color={colors.goldSoft} style={styles.heroSubtitle}>
          Ask anything about your wedding — budget, guests, vendors or what needs doing next.
        </AppText>
      </GradientView>

      <AppText style={[typography.serifHeading, styles.sectionTitle]}>Try asking</AppText>

      {STARTERS.map(s => (
        <View key={s.title} style={styles.starter}>
          <View style={styles.starterIcon}>
            <Icon name={s.icon} size={18} color={colors.primary} />
          </View>
          <View style={styles.starterBody}>
            <AppText variant="title" style={styles.starterTitle}>
              {s.title}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {s.detail}
            </AppText>
          </View>
        </View>
      ))}

      {/* Inert until the assistant is wired up. */}
      <View style={styles.composer}>
        <AppText variant="callout" color={colors.textMuted} style={styles.composerText}>
          Ask about your wedding…
        </AppText>
        <View style={styles.sendButton}>
          <Icon name="send" size={16} color={colors.textMuted} />
        </View>
      </View>

      <AppText variant="caption" color={colors.textMuted} center style={styles.footnote}>
        The assistant is not connected yet — this is a preview of where it will live.
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  hero: {
    borderRadius: radius.card,
    padding: spacing.xl,
    marginTop: spacing.base,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.5)',
    backgroundColor: 'rgba(253,246,233,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  heroTitle: {
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    maxWidth: 300,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  starter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  starterIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  starterTitle: {
    ...weight('semiBold'),
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingLeft: spacing.base,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  composerText: {
    flex: 1,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: {
    marginTop: spacing.base,
  },
});
