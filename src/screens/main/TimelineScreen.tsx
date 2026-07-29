import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Card,
  StatusBadge,
  Icon,
  Fab,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@components';
import { useWedding } from '@store';
import { canContribute } from '@services';
import type { WeddingFunction } from '@types';
import { colors, layout, radius, spacing, typography } from '@theme';
import {
  formatDate,
  functionDotColor,
  functionIcon,
  functionStatusStyle,
  functionStatusLabel,
} from '@utils';
import { useAppNavigation } from '@navigation/hooks';

export function TimelineScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, loading, refreshing, error, refresh, hasData } = useWedding();

  // Creating an event is allowed for FAMILY_MEMBER too, unlike vendors.
  const mayAdd = canContribute(state.wedding.role);

  if (loading && !hasData) {
    return (
      <ScreenContainer edges={['top']}>
        <LoadingState message="Loading timeline…" />
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
        <AppText style={[typography.serifValue, styles.title]}>Timeline</AppText>

        {state.functions.length > 0 ? (
          <View style={styles.track}>
            <View style={styles.line} />
            {state.functions.map(fn => (
              <TimelineItem
                key={fn.id}
                fn={fn}
                onPress={() => nav.navigate('FunctionDetail', { functionId: fn.id })}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="timeline"
            title="No functions yet"
            message="Add each function — Mehndi, Baraat, Walima — to see them on one timeline."
            actionLabel={mayAdd ? 'Add Function' : undefined}
            onAction={mayAdd ? () => nav.navigate('AddFunction') : undefined}
          />
        )}
      </ScreenContainer>
      {mayAdd ? <Fab onPress={() => nav.navigate('AddFunction')} /> : null}
    </View>
  );
}

function TimelineItem({ fn, onPress }: { fn: WeddingFunction; onPress: () => void }) {
  const status = functionStatusStyle(fn.status);
  // The list endpoint doesn't return startTime, so the time line is only shown
  // once the detail screen has been opened; here date and venue are enough.
  const meta = [formatDate(fn.date, 'monthDay', 'Date not set'), fn.time]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.item}>
      <View style={[styles.dot, { backgroundColor: functionDotColor(fn.status) }]} />
      <Card onPress={onPress} style={styles.card}>
        <View style={styles.cardTop}>
          {/* Tinted to the status dot, so the glyph and the rail read together. */}
          <View style={[styles.badge, { backgroundColor: functionDotColor(fn.status) }]}>
            <Icon
              name={functionIcon(fn.name)}
              size={15}
              color={colors.textOnPrimary}
              strokeWidth={1.9}
            />
          </View>
          <AppText variant="title" style={styles.name} numberOfLines={1}>
            {fn.name}
          </AppText>
          <StatusBadge label={functionStatusLabel(fn.status)} bg={status.bg} color={status.text} />
        </View>
        <AppText variant="caption" color={colors.textSecondary}>
          {meta}
        </AppText>
        {fn.venue ? (
          <AppText variant="caption" color={colors.textSecondary} style={styles.venue}>
            {fn.venue}
          </AppText>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    // Clears the floating Fab, which would otherwise sit over the last row.
    paddingBottom: layout.fabClearance,
  },
  title: {
    marginBottom: spacing.lg,
  },
  track: {
    position: 'relative',
    paddingLeft: 26,
  },
  line: {
    position: 'absolute',
    left: 9,
    top: 6,
    bottom: 20,
    width: 2,
    backgroundColor: 'rgba(109,15,43,0.14)',
  },
  item: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  dot: {
    position: 'absolute',
    left: -26,
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.background,
  },
  card: {
    borderRadius: radius.lg,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  name: {
    flex: 1,
    marginRight: spacing.sm,
  },
  venue: {
    marginTop: spacing.xxs,
  },
});
