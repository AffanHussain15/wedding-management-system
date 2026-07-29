/**
 * Date picker with a year → month → day drill-down, built from plain views —
 * no native date-picker module — so the layout and the "YYYY-MM-DD" value it
 * produces are identical on iOS and Android.
 *
 * Tapping the header title steps *up* a level (day grid → year grid), which is
 * how you reach a date years away without paging a month at a time. Picking a
 * year drops to that year's months, picking a month drops to its days.
 *
 * `min`/`max` are compared as ISO strings, which sorts correctly for
 * zero-padded YYYY-MM-DD and avoids re-parsing on every cell.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@theme';
import {
  MONTH_NAMES_SHORT,
  daysInMonth,
  firstWeekdayOfMonth,
  monthLabel,
  parseDate,
  todayIso,
  toIsoDate,
} from '@utils';
import { AppText } from './AppText';
import { Icon } from './Icon';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/** Years shown per page of the year grid (3 columns × 4 rows). */
const YEARS_PER_PAGE = 12;

/** Keeps the sheet from resizing as the grids swap; 6 day-rows at 42px. */
const GRID_MIN_HEIGHT = 252;

type Level = 'day' | 'month' | 'year';

export interface CalendarProps {
  /** Selected day as "YYYY-MM-DD", or '' when nothing is picked yet. */
  value: string;
  onChange: (iso: string) => void;
  /** Earliest selectable day, inclusive, as "YYYY-MM-DD". */
  min?: string;
  /** Latest selectable day, inclusive, as "YYYY-MM-DD". */
  max?: string;
}

interface ViewMonth {
  year: number;
  month: number;
}

const monthOf = (iso: string): ViewMonth | null => {
  const date = parseDate(iso);
  return date ? { year: date.getFullYear(), month: date.getMonth() } : null;
};

const dayIso = (year: number, month: number, day: number): string =>
  toIsoDate(new Date(year, month, day));

/** First page year, so pages stay put no matter which year you arrive from. */
const pageStartFor = (year: number): number =>
  Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;

export function Calendar({ value, onChange, min, max }: CalendarProps): React.JSX.Element {
  // Open on the selected month, else the first month the bounds allow, else now.
  const [view, setView] = useState<ViewMonth>(() => {
    // A stored value the bounds now exclude — a wedding date saved before it
    // slipped into the past — must not strand the grid on a dead month.
    const reachable = value && !(min && value < min) && !(max && value > max);
    return monthOf(reachable ? value : '') ?? monthOf(min ?? '') ?? monthOf(todayIso())!;
  });
  const [level, setLevel] = useState<Level>('day');
  // Which page of years is on screen. Separate from `view.year` so paging
  // through the year grid doesn't drag the highlighted year along with it.
  const [yearPage, setYearPage] = useState(() => pageStartFor(view.year));

  const today = todayIso();
  const pageStart = pageStartFor(yearPage);

  const openLevel = (next: Level) => {
    if (next === 'year') setYearPage(pageStartFor(view.year));
    setLevel(next);
  };

  const dayOutside = (iso: string) => (!!min && iso < min) || (!!max && iso > max);

  /** True when no day in the month is selectable. */
  const monthOutside = (year: number, month: number) =>
    (!!min && dayIso(year, month, daysInMonth(year, month)) < min) ||
    (!!max && dayIso(year, month, 1) > max);

  /**
   * True when no day in the year is selectable. Checked against the year's own
   * edges — Dec 31 before `min`, or Jan 1 after `max` — because a year with a
   * bound inside it (June–August, say) still has selectable days.
   */
  const yearOutside = (year: number) =>
    (!!min && dayIso(year, 11, 31) < min) || (!!max && dayIso(year, 0, 1) > max);

  // Each level steps by its own unit, and a step is pointless when everything
  // on the far side is out of range.
  const stepBack = () => {
    if (level === 'day') setView(v => shiftMonth(v, -1));
    else if (level === 'month') setView(v => ({ ...v, year: v.year - 1 }));
    else setYearPage(p => p - YEARS_PER_PAGE);
  };

  const stepForward = () => {
    if (level === 'day') setView(v => shiftMonth(v, 1));
    else if (level === 'month') setView(v => ({ ...v, year: v.year + 1 }));
    else setYearPage(p => p + YEARS_PER_PAGE);
  };

  const backBlocked =
    level === 'day'
      ? !!min && dayIso(view.year, view.month, 1) <= min
      : level === 'month'
      ? !!min && yearOutside(view.year - 1)
      : !!min && yearOutside(pageStart - 1);

  const forwardBlocked =
    level === 'day'
      ? !!max && dayIso(view.year, view.month, daysInMonth(view.year, view.month)) >= max
      : level === 'month'
      ? !!max && yearOutside(view.year + 1)
      : !!max && yearOutside(pageStart + YEARS_PER_PAGE);

  const title =
    level === 'day'
      ? monthLabel(view.year, view.month)
      : level === 'month'
      ? `${view.year}`
      : `${pageStart} – ${pageStart + YEARS_PER_PAGE - 1}`;

  // Title taps climb toward the year grid, then hand control back to the days.
  const titleTarget: Level = level === 'day' ? 'year' : level === 'month' ? 'year' : 'day';

  return (
    <View>
      <View style={styles.header}>
        <Pressable
          onPress={stepBack}
          disabled={backBlocked}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={level === 'day' ? 'Previous month' : 'Earlier years'}
          accessibilityState={{ disabled: backBlocked }}
          style={[styles.navBtn, backBlocked && styles.navBtnDisabled]}>
          <View style={styles.flip}>
            <Icon name="chevronRight" size={18} color={colors.primary} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => openLevel(titleTarget)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${title}. Change ${level === 'day' ? 'year' : 'view'}`}
          style={styles.titleBtn}>
          <AppText variant="title">{title}</AppText>
          <View style={level === 'year' ? styles.caretUp : styles.caretDown}>
            <Icon name="chevronRight" size={14} color={colors.primary} />
          </View>
        </Pressable>

        <Pressable
          onPress={stepForward}
          disabled={forwardBlocked}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={level === 'day' ? 'Next month' : 'Later years'}
          accessibilityState={{ disabled: forwardBlocked }}
          style={[styles.navBtn, forwardBlocked && styles.navBtnDisabled]}>
          <Icon name="chevronRight" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {level === 'year' ? (
          <View style={styles.row}>
            {Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i).map(year => {
              const disabled = yearOutside(year);
              const selected = year === view.year;
              return (
                <Cell
                  key={year}
                  label={`${year}`}
                  wide
                  selected={selected}
                  disabled={disabled}
                  onPress={() => {
                    setView(v => ({ ...v, year }));
                    setLevel('month');
                  }}
                />
              );
            })}
          </View>
        ) : null}

        {level === 'month' ? (
          <View style={styles.row}>
            {MONTH_NAMES_SHORT.map((name, month) => {
              const disabled = monthOutside(view.year, month);
              const selected = month === view.month;
              return (
                <Cell
                  key={name}
                  label={name}
                  wide
                  selected={selected}
                  disabled={disabled}
                  onPress={() => {
                    setView(v => ({ ...v, month }));
                    setLevel('day');
                  }}
                />
              );
            })}
          </View>
        ) : null}

        {level === 'day' ? (
          <>
            <View style={styles.row}>
              {WEEKDAYS.map((day, i) => (
                <View key={i} style={styles.cell}>
                  <AppText variant="caption" color={colors.textMuted} center>
                    {day}
                  </AppText>
                </View>
              ))}
            </View>

            <View style={styles.row}>
              {buildDayCells(view).map((day, i) => {
                if (day === null) return <View key={`blank-${i}`} style={styles.cell} />;

                const iso = dayIso(view.year, view.month, day);
                const selected = iso === value;
                const disabled = dayOutside(iso);

                return (
                  <Cell
                    key={iso}
                    label={`${day}`}
                    accessibilityLabel={iso}
                    selected={selected}
                    disabled={disabled}
                    outlined={iso === today && !selected}
                    onPress={() => onChange(iso)}
                  />
                );
              })}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const shiftMonth = ({ year, month }: ViewMonth, by: number): ViewMonth => {
  const next = new Date(year, month + by, 1);
  return { year: next.getFullYear(), month: next.getMonth() };
};

/** Leading blanks so the 1st lands on its weekday, then the days, then padding. */
const buildDayCells = ({ year, month }: ViewMonth): (number | null)[] => {
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekdayOfMonth(year, month)).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  // Pad the tail so the last row keeps the same cell widths as the others.
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

interface CellProps {
  label: string;
  onPress: () => void;
  selected: boolean;
  disabled: boolean;
  /** Ring only — marks today without claiming to be the selection. */
  outlined?: boolean;
  /** Month/year cells: three per row instead of seven. */
  wide?: boolean;
  accessibilityLabel?: string;
}

function Cell({
  label,
  onPress,
  selected,
  disabled,
  outlined = false,
  wide = false,
  accessibilityLabel,
}: CellProps): React.JSX.Element {
  const color = selected ? colors.textOnPrimary : disabled ? colors.textMuted : colors.text;

  return (
    <View style={wide ? styles.cellWide : styles.cell}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ selected, disabled }}
        style={({ pressed }) => [
          wide ? styles.slot : styles.day,
          outlined && !selected && styles.marked,
          selected && styles.selected,
          pressed && !disabled && !selected && styles.pressed,
        ]}>
        <AppText variant={selected ? 'bodyMedium' : 'callout'} color={color}>
          {label}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  titleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  flip: {
    transform: [{ rotate: '180deg' }],
  },
  caretDown: {
    transform: [{ rotate: '90deg' }],
  },
  caretUp: {
    transform: [{ rotate: '270deg' }],
  },
  grid: {
    minHeight: GRID_MIN_HEIGHT,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    // Seven per row; a percentage keeps the grid aligned at any screen width.
    width: '14.2857%',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
  },
  cellWide: {
    width: '33.3333%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slot: {
    alignSelf: 'stretch',
    marginHorizontal: spacing.xs,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marked: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.surfaceSand,
  },
});
