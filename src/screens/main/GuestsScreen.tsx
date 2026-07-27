import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Card,
  SearchBar,
  FilterChip,
  StatusBadge,
  Avatar,
  Icon,
  Toast,
  Fab,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@components';
import { useWedding, selectGuestCounts } from '@store';
import { canContribute } from '@services';
import { GUEST_FILTERS, RSVP_STATUSES } from '@constants';
import type { Guest, ID, RsvpStatus } from '@types';
import { colors, radius, spacing, typography } from '@theme';
import { rsvpStatusStyle } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

type Filter = (typeof GUEST_FILTERS)[number];

export function GuestsScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, actions, loading, refreshing, error, refresh, hasData } = useWedding();
  const counts = selectGuestCounts(state);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [toast, setToast] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Stable callbacks so the memoized rows don't re-render on unrelated changes.
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 2400);
  }, []);

  const mayEdit = canContribute(state.wedding.role);

  const cycleRsvp = useCallback(
    async (id: ID, current: RsvpStatus) => {
      if (!mayEdit) {
        showToast('You have read-only access.');
        return;
      }
      const nextIdx = (RSVP_STATUSES.indexOf(current) + 1) % RSVP_STATUSES.length;
      const result = await actions.setGuestRsvp(id, RSVP_STATUSES[nextIdx]);
      if (!result.ok) showToast(result.message);
    },
    [actions, mayEdit, showToast],
  );

  const invite = useCallback(
    async (guest: Guest) => {
      if (!mayEdit) {
        showToast('You have read-only access.');
        return;
      }
      const result = await actions.sendGuestInvite(guest.id);
      // The 24h resend cooldown surfaces as RATE_LIMITED, which is worth
      // showing verbatim rather than as a generic failure.
      showToast(
        result.ok
          ? `Invite queued for ${guest.name.split(' ')[0]}`
          : result.message,
      );
    },
    [actions, mayEdit, showToast],
  );

  const guests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return state.guests.filter(
      g =>
        (filter === 'All' || g.rsvp === filter) &&
        (query === '' || g.name.toLowerCase().includes(query)),
    );
  }, [state.guests, filter, search]);

  const sections = useMemo(() => [{ data: guests }], [guests]);

  const renderItem = useCallback(
    ({ item }: { item: Guest }) => (
      <GuestRow guest={item} onCycleRsvp={cycleRsvp} onInvite={invite} />
    ),
    [cycleRsvp, invite],
  );

  const renderFilterBar = useCallback(
    () => (
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}>
          {GUEST_FILTERS.map(f => (
            <FilterChip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>
    ),
    [filter],
  );

  if (loading && !hasData) {
    return (
      <ScreenContainer edges={['top']}>
        <LoadingState message="Loading guests…" />
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
    <View style={styles.flex}>
      <ScreenContainer padded={false} edges={['top']}>
        <SectionList
          style={styles.flex}
          contentContainerStyle={styles.content}
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderFilterBar}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={ItemSeparator}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View>
              <AppText style={[typography.serifValue, styles.title]}>Guests / Mehmaan</AppText>
              <View style={styles.stats}>
                <MiniStat value={counts.confirmed} label="Confirmed" color={colors.successText} />
                <MiniStat value={counts.pending} label="Pending" color={colors.warning} />
                <MiniStat value={counts.notComing} label="Not Coming" color={colors.danger} />
              </View>
              {/* Entries can each cover several people, so both numbers matter. */}
              <AppText variant="caption" color={colors.textMuted} style={styles.heads}>
                {counts.confirmedHeads} of {counts.totalHeads} people confirmed across{' '}
                {counts.total} {counts.total === 1 ? 'entry' : 'entries'}
              </AppText>
              <View style={styles.searchWrap}>
                <SearchBar value={search} onChangeText={setSearch} placeholder="Search guests" />
              </View>
            </View>
          }
          ListEmptyComponent={
            state.guests.length === 0 ? (
              <EmptyState
                icon="guests"
                title="No guests yet"
                message="Add your guest list to track RSVPs and head counts."
                actionLabel={mayEdit ? 'Add Guest' : undefined}
                onAction={mayEdit ? () => nav.navigate('AddGuest') : undefined}
              />
            ) : (
              <AppText variant="callout" color={colors.textMuted} center style={styles.empty}>
                No guests match your search.
              </AppText>
            )
          }
        />
      </ScreenContainer>

      {mayEdit ? <Fab onPress={() => nav.navigate('AddGuest')} /> : null}
      <Toast message={toast} visible={!!toast} />
    </View>
  );
}

function ItemSeparator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.miniStat}>
      <AppText style={[typography.serifHeading, { color }]}>{value}</AppText>
      <AppText variant="caption" color={colors.textSecondary} style={styles.miniLabel}>
        {label}
      </AppText>
    </View>
  );
}

interface GuestRowProps {
  guest: Guest;
  onCycleRsvp: (id: ID, current: RsvpStatus) => void;
  onInvite: (guest: Guest) => void;
}

const GuestRow = React.memo(({ guest, onCycleRsvp, onInvite }: GuestRowProps) => {
  const rsvp = rsvpStatusStyle(guest.rsvp);

  return (
    <Card style={styles.row}>
      <Avatar name={guest.name} size={40} />
      <View style={styles.rowBody}>
        <AppText variant="label" color={colors.text} numberOfLines={1}>
          {guest.name}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {guest.group}
          {guest.groupSize > 1 ? ` · ${guest.groupSize} people` : ''}
        </AppText>
      </View>
      <Pressable onPress={() => onCycleRsvp(guest.id, guest.rsvp)} hitSlop={6}>
        <StatusBadge label={guest.rsvp} bg={rsvp.bg} color={rsvp.text} />
      </Pressable>
      <Pressable style={styles.invite} onPress={() => onInvite(guest)} hitSlop={6}>
        <Icon name="send" size={14} color={colors.primary} />
      </Pressable>
    </Card>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.base,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  miniStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  miniLabel: {
    marginTop: spacing.xxs,
  },
  heads: {
    marginBottom: spacing.md,
  },
  searchWrap: {
    marginBottom: spacing.md,
  },
  filterBar: {
    backgroundColor: colors.background,
    marginHorizontal: -20,
    paddingBottom: spacing.base,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  separator: {
    height: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  invite: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    marginTop: spacing.xxl,
  },
});
