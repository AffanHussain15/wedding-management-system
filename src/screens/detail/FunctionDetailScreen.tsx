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
} from '@components';
import { useWedding } from '@store';
import { FUNCTION_VENDOR_MAP } from '@constants';
import type { FunctionName } from '@types';
import type { RootStackParamList } from '@navigation/types';
import { useAppNavigation } from '@navigation/hooks';
import { colors, radius, spacing, typography } from '@theme';
import { formatDate } from '@utils';

const CREAM_75 = 'rgba(253,246,233,0.75)';

export function FunctionDetailScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'FunctionDetail'>>();
  const { state } = useWedding();
  const fn = state.functions.find(f => f.id === params.functionId);

  if (!fn) {
    return (
      <ScreenContainer>
        <AppText variant="callout" color={colors.textMuted} center>
          Function not found.
        </AppText>
      </ScreenContainer>
    );
  }

  const categories = FUNCTION_VENDOR_MAP[fn.name as FunctionName] ?? [];
  const vendors = categories
    .map(cat => state.vendors.find(v => v.category === cat))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
  const tasks = state.tasks.filter(t => t.function === fn.name);

  return (
    <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
      <Pressable style={styles.back} onPress={() => nav.goBack()}>
        <Icon name="chevronRight" size={18} color={colors.primary} />
      </Pressable>

      <GradientView colors={['#7A1230', '#4E0A1D']} style={styles.hero}>
        <AppText style={[typography.serifValue, { color: colors.goldSoft }]}>
          {fn.name}
        </AppText>
        <AppText variant="caption" color={CREAM_75} style={styles.heroLine}>
          {formatDate(fn.date, 'monthDay')} · {fn.time}
        </AppText>
        <AppText variant="caption" color={CREAM_75}>
          {fn.venue}
        </AppText>
      </GradientView>

      <AppText variant="overline" color={colors.textSecondary} style={styles.sectionLabel}>
        Vendors assigned
      </AppText>
      <View style={styles.vendors}>
        {vendors.length > 0 ? (
          vendors.map(v => (
            <View key={v.id} style={styles.vendorPill}>
              <Avatar name={v.name} size={22} />
              <AppText variant="caption" color={colors.text}>
                {v.name}
              </AppText>
            </View>
          ))
        ) : (
          <AppText variant="caption" color={colors.textMuted}>
            No vendors assigned yet.
          </AppText>
        )}
      </View>

      <AppText variant="overline" color={colors.textSecondary} style={styles.sectionLabel}>
        Tasks
      </AppText>
      <View style={styles.tasks}>
        {tasks.length > 0 ? (
          tasks.map(t => (
            <Card key={t.id} elevated style={styles.taskRow}>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: t.done ? colors.success : colors.borderStrong,
                    backgroundColor: t.done ? colors.success : colors.surface,
                  },
                ]}>
                {t.done ? <Icon name="check" size={12} color={colors.textOnPrimary} /> : null}
              </View>
              <AppText
                variant="callout"
                color={t.done ? colors.textMuted : colors.text}
                style={t.done ? styles.done : undefined}>
                {t.title}
              </AppText>
            </Card>
          ))
        ) : (
          <AppText variant="caption" color={colors.textMuted}>
            No tasks for this function.
          </AppText>
        )}
      </View>

      <AppText variant="overline" color={colors.textSecondary} style={styles.sectionLabel}>
        Reminders
      </AppText>
      <Card style={styles.reminder}>
        <AppText variant="callout" color={colors.text}>
          Confirm final guest count with {fn.venue} 3 days before.
        </AppText>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: spacing.xs, paddingBottom: spacing.xl },
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
  hero: { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  heroLine: { marginTop: spacing.xs },
  sectionLabel: { marginBottom: spacing.md },
  vendors: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
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
  tasks: { gap: spacing.sm, marginBottom: spacing.lg },
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
  done: { textDecorationLine: 'line-through' },
  reminder: { borderRadius: radius.md },
});
