import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, BackButton, FilterChip, Avatar } from '@components';
import { useWedding } from '@store';
import { GUEST_GROUPS } from '@constants';
import type { GuestGroup } from '@types';
import { colors, radius, shadows, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

export function SeatingScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, actions } = useWedding();
  const [group, setGroup] = useState<GuestGroup>('Mardana');

  const guests = state.guests.filter(g => g.group === group);

  return (
    <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
      <BackButton onPress={() => nav.goBack()} />
      <AppText style={[typography.serifValue, styles.title]}>Seating Planner</AppText>
      <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
        Tap a guest to move them to another group.
      </AppText>

      <View style={styles.tabs}>
        {GUEST_GROUPS.map(g => (
          <FilterChip
            key={g}
            label={g}
            active={g === group}
            onPress={() => setGroup(g)}
            style={styles.tab}
          />
        ))}
      </View>

      <View style={styles.guests}>
        {guests.map(g => (
          <Pressable
            key={g.id}
            style={styles.pill}
            onPress={() => actions.cycleGuestGroup(g.id)}>
            <Avatar name={g.name} size={26} />
            <AppText variant="caption" color={colors.text} style={styles.pillName}>
              {g.name}
            </AppText>
          </Pressable>
        ))}
        {guests.length === 0 ? (
          <AppText variant="callout" color={colors.textMuted}>
            No guests in this group.
          </AppText>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: spacing.xs, paddingBottom: spacing.xl },
  title: { marginTop: spacing.base, marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.base },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tab: { flex: 1 },
  guests: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    ...shadows.sm,
  },
  pillName: { fontWeight: '600' },
});
