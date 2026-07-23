import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Card, BackButton, FilterChip, Icon } from '@components';
import { useWedding } from '@store';
import { TASK_FILTERS } from '@constants';
import type { Task } from '@types';
import { colors, radius, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

type Filter = (typeof TASK_FILTERS)[number];

export function TasksScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, actions } = useWedding();
  const [filter, setFilter] = useState<Filter>('All');

  const tasks = state.tasks.filter(t =>
    filter === 'All' ? true : filter === 'Done' ? t.done : !t.done,
  );

  return (
    <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
      <BackButton onPress={() => nav.goBack()} />
      <AppText style={[typography.serifValue, styles.title]}>Task Checklist</AppText>

      <View style={styles.filters}>
        {TASK_FILTERS.map(f => (
          <FilterChip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />
        ))}
      </View>

      <View style={styles.list}>
        {tasks.map(t => (
          <TaskRow key={t.id} task={t} onToggle={() => actions.toggleTask(t.id)} />
        ))}
      </View>
    </ScreenContainer>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <Card style={styles.row}>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        style={[
          styles.checkbox,
          {
            borderColor: task.done ? colors.success : colors.borderStrong,
            backgroundColor: task.done ? colors.success : colors.surface,
          },
        ]}>
        {task.done ? <Icon name="check" size={14} color={colors.textOnPrimary} /> : null}
      </Pressable>
      <View style={styles.rowBody}>
        <AppText
          variant="label"
          color={task.done ? colors.textMuted : colors.text}
          style={task.done ? styles.done : undefined}>
          {task.title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.sub}>
          {task.function} · {task.owner}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: spacing.xs, paddingBottom: spacing.xl },
  title: { marginTop: spacing.base, marginBottom: spacing.base },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  sub: { marginTop: spacing.xxs },
  done: { textDecorationLine: 'line-through' },
});
