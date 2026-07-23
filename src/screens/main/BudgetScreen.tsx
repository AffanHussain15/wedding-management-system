import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Card,
  DonutChart,
  ProgressBar,
  StatusBadge,
  Fab,
} from '@components';
import { useWedding, selectBudgetTotals } from '@store';
import type { BudgetCategory } from '@types';
import { colors, radius, spacing, typography, weight } from '@theme';
import { formatNumber, percentage, getChartColor } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

export function BudgetScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state } = useWedding();
  const totals = selectBudgetTotals(state);

  const segments = state.budget.map((c, i) => ({
    value: c.spent,
    color: getChartColor(i),
  }));

  return (
    <View style={styles.screen}>
      <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
        <AppText style={[typography.serifValue, styles.title]}>Budget / Bajat</AppText>

        <Card style={styles.summary}>
          <DonutChart segments={segments} size={84} strokeWidth={14}>
            <AppText style={styles.donutLabel} color={colors.primary}>
              {totals.pctUsed}%
            </AppText>
          </DonutChart>
          <View style={styles.totals}>
            <TotalRow
              label="Total budget"
              value={`Rs ${formatNumber(totals.allotted)}`}
              color={colors.text}
            />
            <TotalRow
              label="Spent"
              value={`Rs ${formatNumber(totals.spent)}`}
              color={colors.primaryLight}
            />
            <TotalRow
              label="Remaining"
              value={`Rs ${formatNumber(totals.remaining)}`}
              color={colors.successText}
            />
          </View>
        </Card>

        <View style={styles.list}>
          {state.budget.map((c, i) => (
            <CategoryCard key={c.name} category={c} color={getChartColor(i)} />
          ))}
        </View>
      </ScreenContainer>
      <Fab onPress={() => nav.navigate('AddExpense')} />
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

function CategoryCard({ category, color }: { category: BudgetCategory; color: string }) {
  const pct = percentage(category.spent, category.allotted);
  const over = category.spent > category.allotted;

  return (
    <Card style={styles.category}>
      <View style={styles.categoryTop}>
        <View style={styles.categoryName}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <AppText variant="label" color={colors.text}>
            {category.name}
          </AppText>
        </View>
        {over ? <StatusBadge label="Overspent" bg={colors.dangerBg} color={colors.danger} /> : null}
      </View>
      <View style={styles.categoryMeta}>
        <AppText variant="caption" color={colors.textSecondary}>
          Rs {formatNumber(category.spent)} of {formatNumber(category.allotted)}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {pct}%
        </AppText>
      </View>
      <ProgressBar
        progress={pct}
        height={6}
        color={over ? colors.danger : color}
        trackColor="rgba(109,15,43,0.08)"
      />
    </Card>
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
    marginBottom: spacing.base,
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
});
