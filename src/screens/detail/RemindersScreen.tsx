import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Card, BackButton, Icon, type IconName } from '@components';
import { useWedding } from '@store';
import type { Reminder, ReminderType } from '@types';
import { colors, radius, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

const META: Record<ReminderType, { icon: IconName; bg: string; color: string }> = {
  payment: { icon: 'card', bg: 'rgba(138,33,66,0.12)', color: colors.primaryLight },
  booking: { icon: 'calendar', bg: colors.warningBg, color: colors.warning },
  task: { icon: 'tasks', bg: colors.successBg, color: colors.successText },
};

export function RemindersScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state } = useWedding();

  return (
    <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
      <BackButton onPress={() => nav.goBack()} />
      <AppText style={[typography.serifValue, styles.title]}>Reminders & Alerts</AppText>

      <View style={styles.list}>
        {state.reminders.map(r => (
          <ReminderRow key={r.id} reminder={r} />
        ))}
      </View>
    </ScreenContainer>
  );
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
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
        <AppText variant="caption" color={colors.textSecondary} style={styles.sub}>
          {reminder.date}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: spacing.xs, paddingBottom: spacing.xl },
  title: { marginTop: spacing.base, marginBottom: spacing.lg },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, borderRadius: radius.lg },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  sub: { marginTop: spacing.xxs },
});
