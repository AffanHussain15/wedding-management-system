/**
 * Function (event) detail.
 *
 * Vendors and tasks come from the API's real `eventId` links rather than the
 * category guesswork the prototype used, so what's shown here is what's
 * actually attached to this function.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

import {
  ScreenContainer,
  AppText,
  Card,
  Avatar,
  GradientView,
  Icon,
  StatusBadge,
  LoadingState,
  ErrorState,
  Button,
} from '@components';
import { api, vendorFromApi } from '@services';
import { useWedding } from '@store';
import { useQuery } from '@hooks';
import { PAGE_SIZE } from '@constants';
import type { RootStackParamList } from '@navigation/types';
import { useAppNavigation } from '@navigation/hooks';
import { colors, radius, spacing, typography } from '@theme';
import { formatDate, formatNumber, functionStatusLabel, functionStatusStyle } from '@utils';

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
  const dateLine = [formatDate(event.eventDate.slice(0, 10), 'monthDay', 'Date not set'), event.startTime]
    .filter(Boolean)
    .join(' · ');

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
          <AppText style={[typography.serifValue, { color: colors.goldSoft }]}>
            {event.name}
          </AppText>
          <StatusBadge
            label={functionStatusLabel(statusKey)}
            bg={statusStyle.bg}
            color={statusStyle.text}
          />
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

      <Button
        label="Add a Task"
        variant="outline"
        onPress={() => nav.navigate('AddTask')}
        style={styles.cta}
      />

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
