import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Card,
  BackButton,
  FilterChip,
  Icon,
  Toast,
  Fab,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@components';
import { useWedding } from '@store';
import { canContribute, canEdit } from '@services';
import { TASK_FILTERS } from '@constants';
import type { ID, Task } from '@types';
import { colors, radius, spacing, statusColors, typography } from '@theme';
import { formatDate } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

type Filter = (typeof TASK_FILTERS)[number];

const PRIORITY_STYLE = {
  High: statusColors.notComing,
  Medium: statusColors.pending,
  Low: statusColors.planned,
} as const;

export function TasksScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, actions, loading, refreshing, error, refresh, hasData } = useWedding();
  const [filter, setFilter] = useState<Filter>('All');
  const [toast, setToast] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 2400);
  }, []);

  const mayAdd = canContribute(state.wedding.role);
  const mayDelete = canEdit(state.wedding.role);

  const toggle = useCallback(
    async (id: ID) => {
      const result = await actions.toggleTask(id);
      // A FAMILY_MEMBER may only flip the status of a task assigned to them,
      // so a 403 here is expected and worth explaining rather than swallowing.
      if (!result.ok) showToast(result.message);
    },
    [actions, showToast],
  );

  const remove = useCallback(
    (task: Task) => {
      Alert.alert(
        'Delete task?',
        task.title,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const result = await actions.removeTask(task.id);
              if (!result.ok) showToast(result.message);
            },
          },
        ],
        { cancelable: true },
      );
    },
    [actions, showToast],
  );

  const tasks = state.tasks.filter(t =>
    filter === 'All' ? true : filter === 'Done' ? t.done : !t.done,
  );

  if (loading && !hasData) {
    return (
      <ScreenContainer edges={['top']}>
        <LoadingState message="Loading tasks…" />
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
    <View style={styles.screen}>
      <ScreenContainer
        scroll
        padded={false}
        edges={['top']}
        contentContainerStyle={styles.content}
        onRefresh={refresh}
        refreshing={refreshing}>
        <BackButton onPress={() => nav.goBack()} />
        <AppText style={[typography.serifValue, styles.title]}>Task Checklist</AppText>

        <View style={styles.filters}>
          {TASK_FILTERS.map(f => (
            <FilterChip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />
          ))}
        </View>

        <View style={styles.list}>
          {tasks.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={toggle}
              onDelete={mayDelete ? remove : undefined}
            />
          ))}

          {tasks.length === 0 ? (
            state.tasks.length === 0 ? (
              <EmptyState
                icon="tasks"
                title="No tasks yet"
                message="Break the planning down into steps and assign them to your family."
                actionLabel={mayAdd ? 'Add Task' : undefined}
                onAction={mayAdd ? () => nav.navigate('AddTask') : undefined}
              />
            ) : (
              <AppText variant="callout" color={colors.textMuted} center style={styles.empty}>
                Nothing in this filter.
              </AppText>
            )
          ) : null}
        </View>
      </ScreenContainer>

      {mayAdd ? <Fab onPress={() => nav.navigate('AddTask')} /> : null}
      <Toast message={toast} visible={!!toast} />
    </View>
  );
}

// Memoized: toggling one task leaves every other row's props referentially
// identical, so they skip re-rendering.
const TaskRow = React.memo(function TaskRowItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: ID) => void;
  onDelete?: (task: Task) => void;
}) {
  const priority = PRIORITY_STYLE[task.priority];
  // A due date in the past on an unfinished task is worth flagging.
  const overdue =
    !task.done && task.dueDate !== '' && task.dueDate < new Date().toISOString().slice(0, 10);

  const meta = [
    task.function || null,
    task.owner,
    task.dueDate ? `due ${formatDate(task.dueDate, 'monthDay', '')}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card style={styles.row}>
      <Pressable
        onPress={() => onToggle(task.id)}
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
        <AppText
          variant="caption"
          color={overdue ? colors.danger : colors.textSecondary}
          style={styles.sub}>
          {meta}
          {overdue ? ' · overdue' : ''}
        </AppText>
        {/* The API keeps the assignment when a member leaves, so say so. */}
        {task.assigneeIsActiveMember === false ? (
          <AppText variant="caption" color={colors.warning}>
            Assignee has left this wedding
          </AppText>
        ) : null}
      </View>

      {!task.done ? (
        <StatusBadge label={task.priority} bg={priority.bg} color={priority.text} />
      ) : null}

      {onDelete ? (
        <Pressable onPress={() => onDelete(task)} hitSlop={8}>
          <Icon name="trash" size={16} color={colors.danger} />
        </Pressable>
      ) : null}
    </Card>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginTop: spacing.base,
    marginBottom: spacing.base,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.6,
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
  done: {
    textDecorationLine: 'line-through',
  },
  empty: {
    marginTop: spacing.xxl,
  },
});
