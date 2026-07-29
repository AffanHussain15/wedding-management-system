import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Card,
  DonutChart,
  ProgressBar,
  StatusBadge,
  Icon,
  Fab,
  LoadingState,
  ErrorState,
  EmptyState,
  SectionHeader,
} from '@components';
import { useWedding, selectBudgetTotals } from '@store';
import { canEdit } from '@services';
import type { BudgetCategory, Expense } from '@types';
import { colors, radius, spacing, statusColors, typography, weight } from '@theme';
import { formatDate, formatNumber, percentage, getChartColor } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

export function BudgetScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, loading, refreshing, error, refresh, hasData } = useWedding();
  const totals = selectBudgetTotals(state);

  const mayEdit = canEdit(state.wedding.role);
  const hasBudget = totals.allotted !== null;

  const segments = state.budget.map((c, i) => ({
    value: c.spent,
    color: getChartColor(i),
  }));

  if (loading && !hasData) {
    return (
      <ScreenContainer edges={['top']}>
        <LoadingState message="Loading budget…" />
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
        <AppText style={[typography.serifValue, styles.title]}>Budget / Bajat</AppText>

        <Card style={styles.summary}>
          <DonutChart segments={segments} size={84} strokeWidth={14}>
            <AppText style={styles.donutLabel} color={colors.primary}>
              {hasBudget ? `${totals.pctUsed}%` : '—'}
            </AppText>
          </DonutChart>
          <View style={styles.totals}>
            {/*
              The backend stores one wedding-level budget, so "Total budget" can
              legitimately be unset — showing Rs 0 would read as a real figure.
            */}
            <TotalRow
              label="Total budget"
              value={hasBudget ? `Rs ${formatNumber(totals.allotted as number)}` : 'Not set'}
              color={hasBudget ? colors.text : colors.textMuted}
            />
            <TotalRow
              label="Spent"
              value={`Rs ${formatNumber(totals.spent)}`}
              color={colors.primaryLight}
            />
            <TotalRow
              label="Remaining"
              value={totals.remaining === null ? '—' : `Rs ${formatNumber(totals.remaining)}`}
              color={
                totals.remaining !== null && totals.remaining < 0
                  ? colors.danger
                  : colors.successText
              }
            />
          </View>
        </Card>

        {!hasBudget && mayEdit ? (
          <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
            Set a total budget from your Profile to track how much is left.
          </AppText>
        ) : null}

        {/* --- Spend by category --------------------------------------- */}
        <SectionHeader title="By category" style={styles.section} />
        {state.budget.length > 0 ? (
          <View style={styles.list}>
            {state.budget.map((c, i) => (
              <CategoryCard
                key={c.key}
                category={c}
                color={getChartColor(i)}
                totalSpent={totals.spent}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="budget"
            title="No expenses yet"
            message="Log an expense, or record a vendor payment — those appear here automatically."
            actionLabel={mayEdit ? 'Add Expense' : undefined}
            onAction={mayEdit ? () => nav.navigate('AddExpense') : undefined}
          />
        )}

        {/* --- Recent expenses ---------------------------------------- */}
        {state.expenses.length > 0 ? (
          <>
            <SectionHeader title="Recent expenses" style={styles.section} />
            <View style={styles.list}>
              {state.expenses.slice(0, 10).map(expense => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  // Vendor-synced entries are owned by the vendor's payment.
                  onEdit={
                    mayEdit && !expense.fromVendorPayment
                      ? () => nav.navigate('AddExpense', { expenseId: expense.id })
                      : undefined
                  }
                />
              ))}
            </View>
          </>
        ) : null}
      </ScreenContainer>
      {mayEdit ? <Fab onPress={() => nav.navigate('AddExpense')} /> : null}
    </View>
  );
}

function TotalRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.totalRow}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="caption" color={color} style={styles.totalValue}>
        {value}
      </AppText>
    </View>
  );
}

/**
 * The API has no per-category allocation — only a single wedding-level budget —
 * so this shows each category's share of total spend rather than progress
 * against a target that doesn't exist server-side.
 */
function CategoryCard({
  category,
  color,
  totalSpent,
}: {
  category: BudgetCategory;
  color: string;
  totalSpent: number;
}) {
  const share = percentage(category.spent, totalSpent);

  return (
    <Card style={styles.category}>
      <View style={styles.categoryTop}>
        <View style={styles.categoryName}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <AppText variant="label" color={colors.text}>
            {category.name}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.textSecondary}>
          {share}% of spend
        </AppText>
      </View>
      <View style={styles.categoryMeta}>
        <AppText variant="caption" color={colors.text}>
          Rs {formatNumber(category.spent)}
        </AppText>
      </View>
      <ProgressBar
        progress={share}
        height={6}
        color={color}
        trackColor="rgba(109,15,43,0.08)"
      />
    </Card>
  );
}

function ExpenseRow({
  expense,
  onEdit,
}: {
  expense: Expense;
  /** Omitted when the row can't be edited — by role, or by vendor ownership. */
  onEdit?: () => void;
}): React.JSX.Element {
  const body = (
    <>
      <View style={styles.expenseBody}>
        <AppText variant="label" color={colors.text} numberOfLines={1}>
          {expense.title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {expense.categoryName} · {formatDate(expense.date, 'monthDay', '—')} · {expense.method}
        </AppText>
      </View>
      <View style={styles.expenseRight}>
        <AppText variant="label" color={colors.text}>
          Rs {formatNumber(expense.amount)}
        </AppText>
        {/* Vendor-synced items are read-only server-side; label them so the
            missing edit affordance makes sense. */}
        {expense.fromVendorPayment ? (
          <StatusBadge
            label="Vendor"
            bg={statusColors.advance.bg}
            color={statusColors.advance.text}
          />
        ) : null}
      </View>
      {onEdit ? <Icon name="pencil" size={15} color={colors.textMuted} /> : null}
    </>
  );

  if (!onEdit) return <Card style={styles.expense}>{body}</Card>;

  return (
    <Pressable
      onPress={onEdit}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${expense.title}`}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.expense}>{body}</Card>
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
  title: {
    marginBottom: spacing.base,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.xl,
  },
  donutLabel: {
    fontSize: 13,
    ...weight('bold'),
  },
  totals: {
    flex: 1,
    gap: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalValue: {
    ...weight('bold'),
  },
  hint: {
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  category: {
    borderRadius: radius.lg,
  },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 3,
  },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  expense: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
  },
  expenseBody: {
    flex: 1,
    minWidth: 0,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.85,
  },
});
