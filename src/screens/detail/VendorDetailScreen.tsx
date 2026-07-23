import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

import {
  ScreenContainer,
  AppText,
  Card,
  Button,
  StatusBadge,
  ProgressBar,
  Icon,
} from '@components';
import { useWedding } from '@store';
import type { RootStackParamList } from '@navigation/types';
import { useAppNavigation } from '@navigation/hooks';
import { colors, radius, spacing, typography, weight } from '@theme';
import { paymentStatusStyle, balanceOf, formatNumber } from '@utils';

const NOTE =
  'Contract signed. Menu tasting scheduled two weeks before the function. Confirm final headcount 10 days prior.';

export function VendorDetailScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'VendorDetail'>>();
  const { state } = useWedding();
  const vendor = state.vendors.find(v => v.id === params.vendorId);

  if (!vendor) {
    return (
      <ScreenContainer>
        <AppText variant="callout" color={colors.textMuted} center>
          Vendor not found.
        </AppText>
      </ScreenContainer>
    );
  }

  const status = paymentStatusStyle(vendor.status);
  const balance = balanceOf(vendor.cost, vendor.advance);
  const pctPaid = vendor.cost > 0 ? (vendor.advance / vendor.cost) * 100 : 0;
  const rating = vendor.rating > 0 ? `★ ${vendor.rating.toFixed(1)}` : 'New';

  return (
    <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
      <Pressable style={styles.back} onPress={() => nav.goBack()}>
        <Icon name="chevronRight" size={18} color={colors.primary} />
      </Pressable>

      <View style={styles.banner} />

      <View style={styles.titleRow}>
        <AppText style={[typography.serifTitle, styles.name]}>{vendor.name}</AppText>
        <StatusBadge label={vendor.status} bg={status.bg} color={status.text} />
      </View>
      <AppText variant="callout" color={colors.textSecondary} style={styles.meta}>
        {vendor.category} · {rating}
      </AppText>

      <Card style={styles.card}>
        <AppText variant="overline" color={colors.textSecondary} style={styles.cardLabel}>
          Payment breakdown
        </AppText>
        <Row label="Total cost" value={`Rs ${formatNumber(vendor.cost)}`} />
        <Row
          label="Advance paid / Peshgi"
          value={`Rs ${formatNumber(vendor.advance)}`}
          valueColor={colors.primaryLight}
        />
        <Row label="Balance / Baqaya" value={`Rs ${formatNumber(balance)}`} />
        <ProgressBar progress={pctPaid} height={6} style={styles.bar} />
      </Card>

      <Card style={styles.card}>
        <AppText variant="overline" color={colors.textSecondary} style={styles.cardLabel}>
          Notes
        </AppText>
        <AppText variant="callout" color={colors.textSecondary}>
          {NOTE}
        </AppText>
      </Card>

      <View style={styles.actions}>
        <Button
          label="Call"
          variant="outline"
          fullWidth={false}
          style={styles.action}
          leftIcon={<Icon name="phone" size={18} color={colors.primary} />}
        />
        <Button
          label="Message"
          fullWidth={false}
          style={styles.action}
          leftIcon={<Icon name="message" size={18} color={colors.textOnPrimary} />}
        />
      </View>
    </ScreenContainer>
  );
}

function Row({
  label,
  value,
  valueColor = colors.text,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="callout" color={colors.text}>
        {label}
      </AppText>
      <AppText variant="callout" color={valueColor} style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
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
  banner: {
    width: '100%',
    height: 130,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceSand,
    marginBottom: spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  name: {
    flex: 1,
    marginRight: spacing.sm,
  },
  meta: {
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  cardLabel: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rowValue: {
    ...weight('bold'),
  },
  bar: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  action: {
    flex: 1,
  },
});
