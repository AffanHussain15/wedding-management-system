/**
 * Function (event) detail.
 *
 * Vendors and tasks come from the API's real `eventId` links rather than the
 * category guesswork the prototype used, so what's shown here is what's
 * actually attached to this function.
 */

import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

import {
  ScreenContainer,
  AppText,
  Card,
  Avatar,
  GradientView,
  Icon,
  Input,
  DateField,
  FieldError,
  FormBanner,
  StatusBadge,
  LoadingState,
  ErrorState,
  Button,
} from '@components';
import { api, canContribute, canEdit, vendorFromApi } from '@services';
import { useWedding } from '@store';
import { useQuery } from '@hooks';
import { PAGE_SIZE } from '@constants';
import type { RootStackParamList } from '@navigation/types';
import { useAppNavigation } from '@navigation/hooks';
import { colors, radius, spacing, typography } from '@theme';
import { formatDate, formatNumber, functionStatusLabel, functionStatusStyle } from '@utils';

/** Matches `AddFunctionScreen`: the API stores startTime as 24-hour "HH:mm". */
const TIME_RULE = /^([01]\d|2[0-3]):[0-5]\d$/;

const CREAM_75 = 'rgba(253,246,233,0.75)';

/** Maps the API's computedStatus onto the app's function-status labels. */
const STATUS_MAP = {
  DONE: 'done',
  NEXT: 'next',
  UPCOMING: 'upcoming',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
} as const;

export function FunctionDetailScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'FunctionDetail'>>();
  const { state, actions } = useWedding();

  const weddingId = state.wedding.id;
  const eventId = params.functionId;
  const mayEdit = canEdit(state.wedding.role);
  const mayContribute = canContribute(state.wedding.role);

  // Edit draft, seeded when the form opens rather than on load, so cancelling
  // restores the server's values. Same shape as VendorDetailScreen's editor.
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editBanner, setEditBanner] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Detail, linked vendors and linked tasks in one pass — the detail endpoint
  // only returns counts, not the rows themselves.
  const query = useQuery(
    async signal => {
      const id = weddingId as string;
      const [event, vendors, tasks] = await Promise.all([
        api.events.get(id, eventId, { signal }),
        api.vendors.list(id, { eventId, limit: PAGE_SIZE }, { signal }),
        api.tasks.list(id, { eventId, limit: PAGE_SIZE }, { signal }),
      ]);
      return { event, vendors: vendors.items.map(vendorFromApi), tasks: tasks.items };
    },
    [weddingId, eventId],
    { enabled: !!weddingId },
  );

  if (query.loading) {
    return (
      <ScreenContainer edges={['top']}>
        <LoadingState message="Loading function…" />
      </ScreenContainer>
    );
  }

  if (query.error || !query.data) {
    return (
      <ScreenContainer edges={['top']}>
        <ErrorState
          message={query.error?.message ?? 'Function not found.'}
          onRetry={query.refetch}
        />
        <View style={styles.backFallback}>
          <Button label="Go Back" variant="ghost" onPress={() => nav.goBack()} />
        </View>
      </ScreenContainer>
    );
  }

  const { event, vendors, tasks } = query.data;
  const statusKey = STATUS_MAP[event.computedStatus] ?? 'upcoming';
  const statusStyle = functionStatusStyle(statusKey);
  const eventDate = event.eventDate.slice(0, 10);
  // 'long' rather than 'monthDay': a function years off looked identical to one
  // this season with the year hidden, which is how badly-dated functions went
  // unnoticed on the timeline.
  const dateLine = [formatDate(eventDate, 'long', 'Date not set'), event.startTime]
    .filter(Boolean)
    .join(' · ');

  const startEditing = () => {
    setName(event.name);
    setDate(eventDate);
    setTime(event.startTime ?? '');
    setVenue(event.venueName ?? '');
    setEditErrors({});
    setEditBanner(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    const next: Record<string, string> = {};
    // Mirrors the API's own rules: 2-100 char name, a real date, 24-hour time.
    if (name.trim().length < 2) next.name = 'Enter a name of at least 2 characters.';
    if (!date.trim()) next.eventDate = 'Pick a date for this function.';
    if (time.trim() && !TIME_RULE.test(time.trim())) {
      next.startTime = 'Use 24-hour HH:mm, e.g. 19:30.';
    }
    setEditErrors(next);
    setEditBanner(null);
    if (Object.keys(next).length > 0) return;

    setSavingEdit(true);
    const result = await actions.updateFunction(event.id, {
      name: name.trim(),
      date: date.trim(),
      time: time.trim(),
      venue: venue.trim(),
    });
    setSavingEdit(false);

    if (!result.ok) {
      setEditErrors(result.error.fieldErrors);
      setEditBanner(result.message);
      return;
    }
    setEditing(false);
    // The action refreshes the store's timeline; this screen reads its own copy,
    // and computedStatus can flip when the date moves.
    await query.refetch();
  };

  const confirmDelete = () => {
    Alert.alert(
      `Delete ${event.name}?`,
      'Its vendors and tasks are unlinked rather than deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await actions.removeFunction(event.id);
            // Going back on success: this screen's own event no longer exists,
            // so refetching it would only render the not-found state.
            if (result.ok) nav.goBack();
            else setEditBanner(result.message);
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ScreenContainer
      scroll
      padded={false}
      edges={['top']}
      contentContainerStyle={styles.content}
      onRefresh={query.refetch}
      refreshing={query.refreshing}>
      <Pressable
        style={styles.back}
        onPress={() => nav.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <Icon name="chevronRight" size={18} color={colors.primary} />
      </Pressable>

      <GradientView colors={['#7A1230', '#4E0A1D']} style={styles.hero}>
        <View style={styles.heroTop}>
          <AppText style={[typography.serifValue, styles.heroName, { color: colors.goldSoft }]}>
            {event.name}
          </AppText>
          <StatusBadge
            label={functionStatusLabel(statusKey)}
            bg={statusStyle.bg}
            color={statusStyle.text}
          />
          {mayEdit && !editing ? (
            <Pressable
              onPress={startEditing}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Edit function">
              <Icon name="pencil" size={17} color={colors.goldSoft} />
            </Pressable>
          ) : null}
        </View>
        <AppText variant="caption" color={CREAM_75} style={styles.heroLine}>
          {dateLine}
        </AppText>
        {event.venueName ? (
          <AppText variant="caption" color={CREAM_75}>
            {event.venueName}
            {event.venueAddress ? ` · ${event.venueAddress}` : ''}
          </AppText>
        ) : null}
      </GradientView>

      {/* --- Edit details ------------------------------------------------ */}
      {editing ? (
        <Card style={styles.editCard}>
          <AppText variant="overline" color={colors.textSecondary}>
            Edit function
          </AppText>
          <FormBanner message={editBanner} />

          <Input
            label="Function name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!savingEdit}
          />
          <FieldError message={editErrors.name} />

          {/* Unbounded, unlike AddFunction's `min={todayIso()}`: correcting a
              date that is already wrong is the main reason to open this form,
              and a `min` would make every earlier day untappable. */}
          <DateField
            label="Date"
            title="Pick the function date"
            placeholder="Tap to pick a date"
            value={date}
            onChange={setDate}
            disabled={savingEdit}
          />
          <FieldError message={editErrors.eventDate} />

          <Input
            label="Start time (optional)"
            placeholder="19:30"
            value={time}
            onChangeText={setTime}
            autoCapitalize="none"
            editable={!savingEdit}
          />
          <FieldError message={editErrors.startTime} />

          <Input
            label="Venue (optional)"
            value={venue}
            onChangeText={setVenue}
            autoCapitalize="words"
            editable={!savingEdit}
          />
          <FieldError message={editErrors.venueName} />

          <View style={styles.editActions}>
            <Button
              label="Cancel"
              variant="outline"
              fullWidth={false}
              style={styles.editAction}
              onPress={() => setEditing(false)}
              disabled={savingEdit}
            />
            <Button
              label="Save"
              fullWidth={false}
              style={styles.editAction}
              onPress={saveEdit}
              loading={savingEdit}
            />
          </View>

          <Button label="Delete function" variant="ghost" onPress={confirmDelete} />
        </Card>
      ) : null}

      {/* Counts come straight from the detail endpoint. Note the guest count
          only includes guests explicitly invited to this function. */}
      <View style={styles.counts}>
        <CountTile label="Vendors" value={event.linkedVendorsCount} />
        <CountTile label="Invited" value={event.invitedGuestsCount} />
        <CountTile label="Open tasks" value={event.openTasksCount} />
      </View>

      <AppText variant="overline" color={colors.textSecondary} style={styles.sectionLabel}>
        Vendors assigned
      </AppText>
      <View style={styles.vendors}>
        {vendors.length > 0 ? (
          vendors.map(v => (
            <Pressable
              key={v.id}
              style={styles.vendorPill}
              onPress={() => nav.navigate('VendorDetail', { vendorId: v.id })}>
              <Avatar name={v.name} size={22} />
              <AppText variant="caption" color={colors.text}>
                {v.name}
              </AppText>
              {v.cost > 0 ? (
                <AppText variant="caption" color={colors.textMuted}>
                  Rs {formatNumber(v.cost)}
                </AppText>
              ) : null}
            </Pressable>
          ))
        ) : (
          <AppText variant="caption" color={colors.textMuted}>
            No vendors assigned to this function yet.
          </AppText>
        )}
      </View>

      <AppText variant="overline" color={colors.textSecondary} style={styles.sectionLabel}>
        Tasks
      </AppText>
      <View style={styles.tasks}>
        {tasks.length > 0 ? (
          tasks.map(t => {
            const done = t.status === 'DONE';
            return (
              <Card key={t.id} elevated style={styles.taskRow}>
                <Pressable
                  hitSlop={8}
                  // A VIEWER can read the timeline but not tick anything off.
                  disabled={!mayContribute}
                  accessibilityRole="checkbox"
                  accessibilityLabel={t.title}
                  accessibilityState={{ checked: done, disabled: !mayContribute }}
                  onPress={async () => {
                    // toggleTask resolves to a result rather than throwing, and
                    // the refetch keeps this screen's counts in step.
                    await actions.toggleTask(t.id);
                    await query.refetch();
                  }}
                  style={[
                    styles.checkbox,
                    {
                      borderColor: done ? colors.success : colors.borderStrong,
                      backgroundColor: done ? colors.success : colors.surface,
                    },
                  ]}>
                  {done ? <Icon name="check" size={12} color={colors.textOnPrimary} /> : null}
                </Pressable>
                <AppText
                  variant="callout"
                  color={done ? colors.textMuted : colors.text}
                  style={done ? styles.done : undefined}>
                  {t.title}
                </AppText>
              </Card>
            );
          })
        ) : (
          <AppText variant="caption" color={colors.textMuted}>
            No tasks for this function.
          </AppText>
        )}
      </View>

      {mayContribute ? (
        <Button
          label="Add a Task"
          variant="outline"
          // Carries the function through, so the new task arrives attached to it.
          onPress={() => nav.navigate('AddTask', { eventId: event.id })}
          style={styles.cta}
        />
      ) : null}

      {event.notes ? (
        <>
          <AppText variant="overline" color={colors.textSecondary} style={styles.sectionLabel}>
            Notes
          </AppText>
          <Card style={styles.notes}>
            <AppText variant="callout" color={colors.text}>
              {event.notes}
            </AppText>
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.countTile}>
      <AppText style={typography.serifHeading} color={colors.primary}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    transform: [{ scaleX: -1 }],
  },
  backFallback: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.base,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroName: {
    // Shrinks rather than pushing the badge and pencil off the row.
    flexShrink: 1,
  },
  editCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  editAction: {
    flex: 1,
  },
  heroLine: {
    marginTop: spacing.xs,
  },
  counts: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  countTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  vendors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  vendorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
  },
  tasks: {
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: {
    textDecorationLine: 'line-through',
  },
  cta: {
    marginBottom: spacing.lg,
  },
  notes: {
    borderRadius: radius.md,
  },
});
