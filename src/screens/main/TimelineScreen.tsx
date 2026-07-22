import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Card, StatusBadge } from '@components';
import { useWedding } from '@store';
import type { WeddingFunction } from '@types';
import { colors, radius, spacing, typography } from '@theme';
import { formatDate, functionDotColor, functionStatusStyle, functionStatusLabel } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

export function TimelineScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state } = useWedding();

  return (
    <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
      <AppText style={[typography.serifValue, styles.title]}>Timeline</AppText>

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
    </ScreenContainer>
  );
}

function TimelineItem({ fn, onPress }: { fn: WeddingFunction; onPress: () => void }) {
  const status = functionStatusStyle(fn.status);

  return (
    <View style={styles.item}>
      <View style={[styles.dot, { backgroundColor: functionDotColor(fn.status) }]} />
      <Card onPress={onPress} style={styles.card}>
        <View style={styles.cardTop}>
          <AppText variant="title" style={styles.name}>
            {fn.name}
          </AppText>
          <StatusBadge label={functionStatusLabel(fn.status)} bg={status.bg} color={status.text} />
        </View>
        <AppText variant="caption" color={colors.textSecondary}>
          {formatDate(fn.date, 'monthDay')} · {fn.time}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.venue}>
          {fn.venue}
        </AppText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: spacing.xs, paddingBottom: spacing.xxl },
  title: { marginBottom: spacing.lg },
  track: { position: 'relative', paddingLeft: 26 },
  line: {
    position: 'absolute',
    left: 9,
    top: 6,
    bottom: 20,
    width: 2,
    backgroundColor: 'rgba(109,15,43,0.14)',
  },
  item: { position: 'relative', marginBottom: spacing.lg },
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
  card: { borderRadius: radius.lg },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  name: { flex: 1, marginRight: spacing.sm },
  venue: { marginTop: spacing.xxs },
});
