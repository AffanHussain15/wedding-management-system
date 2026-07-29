import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Card,
  SearchBar,
  FilterChip,
  StatusBadge,
  Avatar,
  Fab,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@components';
import { useWedding } from '@store';
import { canEdit } from '@services';
import { VENDOR_FILTERS } from '@constants';
import type { Vendor } from '@types';
import { colors, layout, radius, spacing, typography } from '@theme';
import { paymentStatusStyle, balanceOf, formatNumber } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

type Filter = (typeof VENDOR_FILTERS)[number];

export function VendorsScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, loading, error, refresh, hasData } = useWedding();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  // Filtered locally: the full list is already in the store, and status is a
  // derived value the API would only recompute the same way.
  const vendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return state.vendors.filter(
      v =>
        (filter === 'All' || v.status === filter) &&
        (query === '' || v.name.toLowerCase().includes(query)),
    );
  }, [state.vendors, filter, search]);

  const mayAdd = canEdit(state.wedding.role);
  const noVendorsAtAll = state.vendors.length === 0;

  if (loading && !hasData) {
    return (
      <ScreenContainer edges={['top']}>
        <LoadingState message="Loading vendors…" />
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
      <ScreenContainer padded={false} edges={['top']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          stickyHeaderIndices={[2]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <AppText style={[typography.serifValue, styles.title]}>Vendors</AppText>

          <View style={styles.searchWrap}>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search vendors" />
          </View>

          <View style={styles.filterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}>
              {VENDOR_FILTERS.map(f => (
                <FilterChip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.list}>
            {vendors.map(v => (
              <VendorRow
                key={v.id}
                vendor={v}
                onPress={() => nav.navigate('VendorDetail', { vendorId: v.id })}
              />
            ))}

            {vendors.length === 0 ? (
              noVendorsAtAll ? (
                <EmptyState
                  icon="vendors"
                  title="No vendors yet"
                  message="Add your caterer, photographer and decorator to start tracking payments."
                  actionLabel={mayAdd ? 'Add Vendor' : undefined}
                  onAction={mayAdd ? () => nav.navigate('AddVendor') : undefined}
                />
              ) : (
                <AppText variant="callout" color={colors.textMuted} center style={styles.empty}>
                  No vendors match your search.
                </AppText>
              )
            ) : null}
          </View>
        </ScrollView>
      </ScreenContainer>
      {/* Creating a vendor is OWNER/CO_OWNER only, so don't offer it otherwise. */}
      {mayAdd ? <Fab onPress={() => nav.navigate('AddVendor')} /> : null}
    </View>
  );
}

function VendorRow({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  const status = paymentStatusStyle(vendor.status);
  const balance = balanceOf(vendor.cost, vendor.advance);

  return (
    <Card onPress={onPress} style={styles.row}>
      <Avatar name={vendor.name} shape="rounded" size={44} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <AppText variant="title" style={styles.rowName} numberOfLines={1}>
            {vendor.name}
          </AppText>
          <StatusBadge label={vendor.status} bg={status.bg} color={status.text} />
        </View>
        <AppText variant="caption" color={colors.textSecondary} style={styles.rowMeta}>
          {vendor.category}
        </AppText>
        {/* A vendor with no agreed price has no meaningful balance to show. */}
        {vendor.cost > 0 ? (
          <AppText variant="caption" color={colors.textSecondary}>
            Balance:{' '}
            <AppText variant="caption" color={colors.text}>
              Rs {formatNumber(balance)}
            </AppText>
          </AppText>
        ) : vendor.advance > 0 ? (
          <AppText variant="caption" color={colors.textSecondary}>
            Paid:{' '}
            <AppText variant="caption" color={colors.text}>
              Rs {formatNumber(vendor.advance)}
            </AppText>
          </AppText>
        ) : (
          <AppText variant="caption" color={colors.textMuted}>
            No price set
          </AppText>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    // Clears the floating Fab, which would otherwise sit over the last row.
    paddingBottom: layout.fabClearance,
  },
  title: {
    marginBottom: spacing.base,
  },
  searchWrap: {
    marginBottom: spacing.md,
  },
  filterBar: {
    backgroundColor: colors.background,
    marginHorizontal: -20,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.base,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowName: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rowMeta: {
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
  },
  empty: {
    marginTop: spacing.xxl,
  },
});
