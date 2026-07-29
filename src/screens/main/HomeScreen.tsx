import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
  ScreenContainer,
  AppText,
  Card,
  ProgressRing,
  ProgressBar,
  GradientView,
  StatCard,
  SectionHeader,
  Icon,
  Fab,
  LoadingState,
  ErrorState,
} from '@components';
import {
  useWedding,
  selectDaysLeft,
  selectOverallProgress,
  selectBudgetTotals,
  selectGuestCounts,
  selectVendorStats,
  selectNextFunction,
  selectReminders,
} from '@store';
import { joinCoupleName } from '@services';
import { colors, radius, shadows, spacing, typography, weight } from '@theme';
import { formatDate, formatNumber, functionDotColor } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

// Translucent cream tones for text over the maroon hero gradient.
const HERO_TEXT = 'rgba(253,246,233,0.65)';
const HERO_DAYS = 'rgba(253,246,233,0.75)';

export function HomeScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, loading, refreshing, error, refresh, hasData } = useWedding();
  const { wedding } = state;

  const daysLeft = selectDaysLeft(state);
  const progress = selectOverallProgress(state);
  const budget = selectBudgetTotals(state);
  const guests = selectGuestCounts(state);
  const vendors = selectVendorStats(state);
  const next = selectNextFunction(state);
  const reminders = selectReminders(state);

  // Dulhan first, then Dulha. `joinCoupleName` drops the separator when one
  // side is missing, so a half-filled name never renders a dangling "&".
  const couple = joinCoupleName(wedding.bride, wedding.groom) || 'Your wedding';
  // Empty fallback: the hero already says "Set your date" when there is none,
  // so the line below it shouldn't repeat "Date not set".
  const weddingDate = formatDate(wedding.weddingDate, 'long', '');
  const initials =
    `${wedding.bride[0] ?? ''}${wedding.groom[0] ?? ''}`.toUpperCase() || '–';
  // The venue/city line has to survive either part being unset.
  const location = [wedding.venue, wedding.city].filter(Boolean).join(', ');

  const goTab = (screen: 'Vendors' | 'Guests' | 'Budget' | 'Timeline') =>
    nav.navigate('Main', { screen });

  if (loading && !hasData) {
    return (
      <ScreenContainer edges={['top']}>
        <LoadingState message="Loading your wedding…" />
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.flexShrink}>
            <AppText variant="caption" color={colors.textSecondary}>
              Welcome back / Ghar
            </AppText>
            <AppText style={typography.serifTitle}>{couple}</AppText>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={() => nav.navigate('Reminders')}>
              <Icon name="bell" size={18} />
            </Pressable>
            <Pressable style={styles.initialsButton} onPress={() => nav.navigate('Profile')}>
              <AppText color={colors.textOnPrimary} style={styles.initials}>
                {initials}
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* Countdown hero */}
        <GradientView colors={['#7A1230', '#4E0A1D']} style={styles.hero}>
          <Svg width={120} height={120} viewBox="0 0 120 120" style={styles.heroRing}>
            <Circle
              cx={60}
              cy={60}
              r={56}
              fill="none"
              stroke={colors.accentBright}
              strokeWidth={1.4}
            />
          </Svg>
          <AppText style={styles.heroLabel}>COUNTDOWN TO THE BIG DAY</AppText>
          {wedding.weddingDate ? (
            <View style={styles.heroRow}>
              <AppText style={[typography.serifDisplay, { color: colors.goldSoft }]}>
                {daysLeft}
              </AppText>
              <AppText style={styles.heroDays}>days to go</AppText>
            </View>
          ) : (
            <AppText style={[typography.serifTitle, { color: colors.goldSoft }]}>
              Set your date
            </AppText>
          )}
          <AppText style={styles.heroSub}>
            {[weddingDate, location].filter(Boolean).join(' · ')}
          </AppText>
        </GradientView>

        {/* Planning progress */}
        <Card style={styles.progressCard} elevated>
          <ProgressRing progress={progress} size={64}>
            <AppText color={colors.primary} style={styles.ringLabel}>
              {progress}%
            </AppText>
          </ProgressRing>
          <View style={styles.flexShrink}>
            <AppText variant="title">Planning Progress</AppText>
            <AppText variant="caption" color={colors.textSecondary} style={styles.progressSub}>
              Across vendors, guests, budget & tasks
            </AppText>
          </View>
        </Card>

        {/* Stat grid */}
        <View style={styles.grid}>
          {/* With no budget set the API returns null percentUsed, so show
              spend instead of a meaningless 0%. */}
          <StatCard
            label="Budget Used / Bajat"
            value={budget.allotted === null ? `Rs ${formatNumber(budget.spent)}` : `${budget.pctUsed}%`}
            caption={budget.allotted === null ? 'no budget set' : undefined}
            onPress={() => goTab('Budget')}
            footer={<ProgressBar progress={budget.pctUsed} height={5} style={styles.statBar} />}
          />
          <StatCard
            label="Guests / Mehmaan"
            value={guests.confirmed}
            valueSuffix={`/${guests.total}`}
            caption="confirmed"
            captionColor={colors.successText}
            onPress={() => goTab('Guests')}
          />
        </View>
        <View style={styles.grid}>
          <StatCard
            label="Vendors"
            value={vendors.booked}
            valueSuffix={`/${vendors.total}`}
            caption="booked"
            captionColor={colors.primaryLight}
            onPress={() => goTab('Vendors')}
          />
          <StatCard
            label="Upcoming"
            value={next.name}
            caption={next.relative}
            captionColor={colors.warning}
            compact
            onPress={() => goTab('Timeline')}
          />
        </View>

        {/* Functions */}
        <SectionHeader
          title="Functions"
          actionLabel="Add"
          onAction={() => nav.navigate('AddFunction')}
          style={styles.sectionSpaced}
        />
        {state.functions.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.functionsRow}
            contentContainerStyle={styles.functionsContent}>
            {state.functions.map(fn => (
              <Pressable
                key={fn.id}
                style={styles.functionCard}
                onPress={() => nav.navigate('FunctionDetail', { functionId: fn.id })}>
                <View style={[styles.functionDot, { backgroundColor: functionDotColor(fn.status) }]}>
                  {fn.status === 'done' ? (
                    <Icon name="check" size={14} color={colors.textOnPrimary} />
                  ) : null}
                </View>
                <AppText style={styles.functionName} numberOfLines={1}>
                  {fn.name}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {formatDate(fn.date, 'short', '—')}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <AppText variant="caption" color={colors.textMuted}>
            No functions yet — add your Mehndi, Baraat and Walima to build the timeline.
          </AppText>
        )}

        {/* Reminders */}
        <SectionHeader
          title="Reminders"
          actionLabel="View all"
          onAction={() => nav.navigate('Reminders')}
          style={styles.sectionSpaced}
        />
        <View style={styles.reminders}>
          {reminders.length > 0 ? (
            reminders.slice(0, 2).map(rm => (
              <View key={rm.id} style={styles.reminderCard}>
                <View style={styles.reminderDot} />
                <AppText variant="callout" style={styles.flexShrink}>
                  {rm.text}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {rm.date}
                </AppText>
              </View>
            ))
          ) : (
            <AppText variant="caption" color={colors.textMuted}>
              Nothing needs attention right now.
            </AppText>
          )}
        </View>

        {/* More tools */}
        <AppText style={[typography.serifHeading, styles.moreTitle]}>More tools</AppText>
        <View style={styles.grid}>
          <ToolTile label="Tasks" icon="tasks" onPress={() => nav.navigate('Tasks')} />
          <ToolTile label="Seating" icon="seating" onPress={() => nav.navigate('Seating')} />
        </View>
        <View style={[styles.grid, styles.gridSpaced]}>
          <ToolTile label="Reminders" icon="bell" onPress={() => nav.navigate('Reminders')} />
          <ToolTile label="Profile" icon="profile" onPress={() => nav.navigate('Profile')} />
        </View>
      </ScreenContainer>

      <Fab
        actions={[
          { label: '+ Add Vendor', onPress: () => nav.navigate('AddVendor') },
          { label: '+ Add Guest', onPress: () => nav.navigate('AddGuest') },
          { label: '+ Add Expense', onPress: () => nav.navigate('AddExpense') },
        ]}
      />
    </View>
  );
}

function ToolTile({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: 'tasks' | 'seating' | 'bell' | 'profile';
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.tile, pressed && styles.pressed]} onPress={onPress}>
      <Icon name={icon} size={16} />
      <AppText variant="label" color={colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  flexShrink: {
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  initialsButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 12,
    ...weight('bold'),
  },
  hero: {
    borderRadius: 22,
    padding: 22,
    marginBottom: spacing.base,
  },
  heroRing: {
    position: 'absolute',
    top: -30,
    right: -30,
    opacity: 0.5,
  },
  heroLabel: {
    ...typography.caption,
    color: HERO_TEXT,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  heroDays: {
    ...typography.body,
    color: HERO_DAYS,
  },
  heroSub: {
    ...typography.caption,
    color: HERO_TEXT,
    marginTop: spacing.xs,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    borderRadius: radius.xl,
    marginBottom: spacing.base,
  },
  ringLabel: {
    fontSize: 14,
    ...weight('bold'),
  },
  progressSub: {
    marginTop: spacing.xxs,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: 6,
  },
  gridSpaced: {
    marginTop: spacing.md,
  },
  statBar: {
    marginTop: spacing.sm,
  },
  sectionSpaced: {
    marginTop: spacing.xl,
  },
  functionsRow: {
    marginHorizontal: -20,
  },
  functionsContent: {
    paddingHorizontal: 20,
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  functionCard: {
    width: 96,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  functionDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  functionName: {
    ...typography.label,
    color: colors.text,
  },
  reminders: {
    gap: spacing.sm,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    ...shadows.sm,
  },
  reminderDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  moreTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
});
