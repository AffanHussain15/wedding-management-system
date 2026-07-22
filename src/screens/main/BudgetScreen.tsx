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
} from '@components';
import { useWedding, selectBudgetTotals } from '@store';
import type { BudgetCategory } from '@types';
import { colors, radius, spacing, typography } from '@theme';
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
    <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText style={typography.serifValue}>Budget / Bajat</AppText>
        <Pressable style={styles.addButton} onPress={() => nav.navigate('AddExpense')}>
          <Icon name="plus" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Card style={styles.summary}>
        <DonutChart segments={segments} size={84} strokeWidth={14}>
          <AppText style={styles.donutLabel} color={colors.primary}>
            {totals.pctUsed}%
          </AppText>
        </DonutChart>
        <View style={styles.totals}>
          <TotalRow label="Total budget" value={`Rs ${formatNumber(totals.allotted)}`} color={colors.text} />
          <TotalRow label="Spent" value={`Rs ${formatNumber(totals.spent)}`} color={colors.primaryLight} />
          <TotalRow label="Remaining" value={`Rs ${formatNumber(totals.remaining)}`} color={colors.successText} />
        </View>
      </Card>

      <View style={styles.list}>
        {state.budget.map((c, i) => (
          <CategoryCard key={c.name} category={c} color={getChartColor(i)} />
        ))}
      </View>
    </ScreenContainer>
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
        {over ? (
          <StatusBadge label="Overspent" bg={colors.dangerBg} color={colors.danger} />
        ) : null}
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
  content: { paddingHorizontal: 20, paddingTop: spacing.xs, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.base,
  },
  donutLabel: { fontSize: 13, fontWeight: '700' },
  totals: { flex: 1, gap: spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalValue: { fontWeight: '700' },
  list: { gap: spacing.md },
  category: { borderRadius: radius.lg },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryName: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 3 },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});
