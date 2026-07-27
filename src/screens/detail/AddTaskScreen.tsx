/** Creates a task, optionally attached to a function and a family member. */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Button,
  Input,
  FilterChip,
  FieldError,
  FormBanner,
} from '@components';
import { useWedding } from '@store';
import { TASK_PRIORITIES } from '@constants';
import type { ID, TaskPriorityLabel } from '@types';
import { colors, spacing } from '@theme';
import { toApiDate } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function AddTaskScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, actions } = useWedding();

  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState<ID | null>(null);
  const [assignedTo, setAssignedTo] = useState<ID | null>(null);
  const [priority, setPriority] = useState<TaskPriorityLabel>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: Record<string, string> = {};
    // The API requires a 2–200 character title.
    if (title.trim().length < 2) next.title = 'Enter a title of at least 2 characters.';
    if (dueDate.trim()) {
      if (!ISO_DATE.test(dueDate.trim())) next.dueDate = 'Use the format YYYY-MM-DD.';
      else if (!toApiDate(dueDate.trim())) next.dueDate = "That date doesn't exist.";
    }
    setErrors(next);
    setBanner(null);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const result = await actions.addTask({
      title: title.trim(),
      eventId,
      assignedTo,
      priority,
      dueDate: dueDate.trim(),
    });
    setSaving(false);

    if (!result.ok) {
      setErrors(result.error.fieldErrors);
      setBanner(result.message);
      return;
    }
    nav.goBack();
  };

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <FormBanner message={banner} />

        <Input
          label="Task"
          placeholder="e.g. Confirm final headcount with caterer"
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
          editable={!saving}
        />
        <FieldError message={errors.title} />

        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Priority
          </AppText>
          <View style={styles.chipRow}>
            {TASK_PRIORITIES.map(p => (
              <FilterChip
                key={p}
                label={p}
                active={p === priority}
                onPress={() => setPriority(p)}
                style={styles.chip}
              />
            ))}
          </View>
        </View>

        <Input
          label="Due date (optional)"
          placeholder="YYYY-MM-DD"
          value={dueDate}
          onChangeText={setDueDate}
          autoCapitalize="none"
          editable={!saving}
        />
        <FieldError message={errors.dueDate} />

        {state.functions.length > 0 ? (
          <View>
            <AppText variant="label" color={colors.textSecondary} style={styles.label}>
              For which function? (optional)
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chips}>
                <FilterChip label="None" active={eventId === null} onPress={() => setEventId(null)} />
                {state.functions.map(fn => (
                  <FilterChip
                    key={fn.id}
                    label={fn.name}
                    active={fn.id === eventId}
                    onPress={() => setEventId(fn.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        {/* The API rejects an assignee who isn't a member of this wedding, so
            only current members are offered. */}
        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Assign to (optional)
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chips}>
              <FilterChip
                label="Unassigned"
                active={assignedTo === null}
                onPress={() => setAssignedTo(null)}
              />
              {state.members.map(member => (
                <FilterChip
                  key={member.userId}
                  label={member.fullName}
                  active={member.userId === assignedTo}
                  onPress={() => setAssignedTo(member.userId)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
        <FieldError message={errors.assignedTo} />
      </View>

      <Button label="Save Task" onPress={save} loading={saving} style={styles.cta} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: spacing.base,
    paddingBottom: spacing.xxl,
  },
  form: {
    gap: spacing.base,
  },
  label: {
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
  },
  cta: {
    marginTop: spacing.xl,
  },
});
