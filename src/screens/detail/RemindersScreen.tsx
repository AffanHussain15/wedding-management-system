/**
 * Reminders.
 *
 * The backend's notifications and background-jobs modules aren't implemented
 * yet — there is no reminders endpoint to call — so rather than invent rows,
 * this derives the same signals client-side from data the API *does* return:
 * vendor balances due, upcoming functions, and overdue or due-soon tasks.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Card,
  BackButton,
  Icon,
  EmptyState,
  LoadingState,
  ErrorState,
  type IconName,
} from '@components';
import { useWedding, selectReminders, type DerivedReminder } from '@store';
import type { ReminderType } from '@types';
import { colors, radius, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

const META: Record<ReminderType, { icon: IconName; bg: string; color: string }> = {
  payment: { icon: 'card', bg: 'rgba(138,33,66,0.12)', color: colors.primaryLight },
  booking: { icon: 'calendar', bg: colors.warningBg, color: colors.warning },
  task: { icon: 'tasks', bg: colors.successBg, color: colors.successText },
};

export function RemindersScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, loading, refreshing, error, refresh, hasData } = useWedding();

  // Derived in a selector so the Home screen's preview and this list can never
  // disagree about what needs attention.
  const reminders = useMemo(() => selectReminders(state), [state]);

  if (loading && !hasData) {
    return (
      <ScreenContainer edges={['top']}>
        <LoadingState message="Loading reminders…" />
      </ScreenContainer>
    );
  }

  if (error && !hasData) {
    return (
      <ScreenContainer edges={['top']}>
        <ErrorState message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scroll
      padded={false}
      edges={['top']}
      contentContainerStyle={styles.content}
      onRefresh={refresh}
      refreshing={refreshing}>
      <BackButton onPress={() => nav.goBack()} />
      <AppText style={[typography.serifValue, styles.title]}>Reminders & Alerts</AppText>
      <AppText variant="caption" color={colors.textMuted} style={styles.note}>
        Worked out on this device from your vendors, functions and tasks. Push and
        email reminders arrive when the backend's notifications module ships.
      </AppText>

      {reminders.length > 0 ? (
        <View style={styles.list}>
          {reminders.map(reminder => (
            <ReminderRow key={reminder.id} reminder={reminder} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="bell"
          title="Nothing needs attention"
          message="No outstanding balances, upcoming functions or tasks due soon."
        />
      )}
    </ScreenContainer>
  );
}

function ReminderRow({ reminder }: { reminder: DerivedReminder }) {
  const meta = META[reminder.type];

  return (
    <Card style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
        <Icon name={meta.icon} size={16} color={meta.color} />
      </View>
      <View style={styles.rowBody}>
        <AppText variant="label" color={colors.text}>
          {reminder.text}
        </AppText>
        <AppText
          variant="caption"
          color={reminder.date === 'Overdue' ? colors.danger : colors.textSecondary}
          style={styles.sub}>
          {reminder.date}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  title: {
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  note: {
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  sub: {
    marginTop: spacing.xxs,
  },
});
