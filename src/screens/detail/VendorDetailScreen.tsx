/**
 * Vendor detail, fetched fresh rather than read from the list — only
 * `GET .../vendors/:id` returns the payment history, notes and contact fields.
 */

import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

import {
  ScreenContainer,
  AppText,
  Card,
  Button,
  Input,
  FilterChip,
  FieldError,
  StatusBadge,
  ProgressBar,
  Icon,
  LoadingState,
  ErrorState,
  FormBanner,
} from '@components';
import {
  api,
  canEdit,
  paymentStatusToLabel,
  toNumber,
  vendorCategoryToLabel,
} from '@services';
import { useWedding } from '@store';
import { useQuery } from '@hooks';
import { E164_PHONE, VENDOR_CATEGORIES } from '@constants';
import type { VendorCategory } from '@types';
import type { RootStackParamList } from '@navigation/types';
import { useAppNavigation } from '@navigation/hooks';
import { colors, radius, spacing, typography, weight } from '@theme';
import { paymentStatusStyle, balanceOf, formatDate, formatNumber } from '@utils';

export function VendorDetailScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'VendorDetail'>>();
  const { state, actions } = useWedding();

  const [amount, setAmount] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [payWarning, setPayWarning] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  // Edit draft. Held separately from the query result so cancelling restores
  // the server's values, and seeded when the form opens rather than on load.
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Other');
  const [phone, setPhone] = useState('');
  const [price, setPrice] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editBanner, setEditBanner] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const weddingId = state.wedding.id;
  const mayEdit = canEdit(state.wedding.role);

  const vendorQuery = useQuery(
    signal => api.vendors.get(weddingId as string, params.vendorId, { signal }),
    [weddingId, params.vendorId],
    { enabled: !!weddingId },
  );

  const vendor = vendorQuery.data;

  if (vendorQuery.loading) {
    return (
      <ScreenContainer edges={['top']}>
        <LoadingState message="Loading vendor…" />
      </ScreenContainer>
    );
  }

  if (vendorQuery.error || !vendor) {
    return (
      <ScreenContainer edges={['top']}>
        <ErrorState
          message={vendorQuery.error?.message ?? 'Vendor not found.'}
          onRetry={vendorQuery.refetch}
        />
        <View style={styles.backFallback}>
          <Button label="Go Back" variant="ghost" onPress={() => nav.goBack()} />
        </View>
      </ScreenContainer>
    );
  }

  const cost = toNumber(vendor.totalPrice);
  const paid = vendor.totalPaid;
  const balance = balanceOf(cost, paid);
  const pctPaid = cost > 0 ? Math.min(100, (paid / cost) * 100) : 0;
  const statusLabel = paymentStatusToLabel(vendor.status);
  const status = paymentStatusStyle(statusLabel);

  const recordPayment = async () => {
    const value = Number(amount);
    if (!(value > 0)) {
      setPayError('Enter an amount greater than zero.');
      return;
    }
    setPayError(null);
    setPayWarning(null);
    setPaying(true);
    const result = await actions.recordVendorPayment(vendor.id, value);
    setPaying(false);

    if (!result.ok) {
      setPayError(result.message);
      return;
    }
    setAmount('');
    // Overpayment is allowed by the API but flagged; surface it verbatim.
    if (result.warning) setPayWarning(result.warning);
    await vendorQuery.refetch();
  };

  const startEditing = () => {
    setName(vendor.name);
    setCategory(vendorCategoryToLabel(vendor.category));
    setPhone(vendor.phone ?? '');
    setPrice(cost > 0 ? String(cost) : '');
    setEditErrors({});
    setEditBanner(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    const next: Record<string, string> = {};
    // The API requires a 2–150 character name; the price may be cleared to 0.
    if (name.trim().length < 2) next.name = 'Enter a name of at least 2 characters.';
    if (price.trim() && !(Number(price) >= 0)) next.totalPrice = 'Enter a valid amount.';
    if (phone.trim() && !E164_PHONE.test(phone.trim())) {
      next.phone = 'Use international format, e.g. +923001234567.';
    }
    setEditErrors(next);
    setEditBanner(null);
    if (Object.keys(next).length > 0) return;

    setSavingEdit(true);
    const result = await actions.updateVendor(vendor.id, {
      name: name.trim(),
      category,
      // A blank phone is omitted, not sent: the API rejects '' as invalid E.164
      // rather than treating it as "clear this".
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      cost: price.trim() ? Number(price) : 0,
    });
    setSavingEdit(false);

    if (!result.ok) {
      setEditErrors(result.error.fieldErrors);
      setEditBanner(result.message);
      return;
    }
    setEditing(false);
    // The list is refreshed by the action; this screen reads its own copy.
    await vendorQuery.refetch();
  };

  const deletePayment = (paymentId: string) => {
    Alert.alert(
      'Delete payment?',
      'This also removes the matching budget entry.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!weddingId) return;
            try {
              await api.vendors.removePayment(weddingId, vendor.id, paymentId);
              await vendorQuery.refetch();
              // Keeps the vendor list and budget totals in step.
              await actions.updateVendor(vendor.id, {});
            } catch {
              setPayError('Could not delete that payment. Please try again.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  // openURL rejects when nothing on the device can handle the scheme (an
  // emulator with no dialer, for instance), so both need a catch.
  const call = () => {
    if (!vendor.phone) return;
    Linking.openURL(`tel:${vendor.phone}`).catch(() =>
      setPayError('No app on this device can place calls.'),
    );
  };
  const message = () => {
    if (!vendor.phone) return;
    Linking.openURL(`sms:${vendor.phone}`).catch(() =>
      setPayError('No app on this device can send messages.'),
    );
  };

  return (
    <ScreenContainer
      scroll
      padded={false}
      edges={['top']}
      contentContainerStyle={styles.content}
      onRefresh={vendorQuery.refetch}
      refreshing={vendorQuery.refreshing}>
      <Pressable
        style={styles.back}
        onPress={() => nav.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <Icon name="chevronRight" size={18} color={colors.primary} />
      </Pressable>

      <View style={styles.banner} />

      <View style={styles.titleRow}>
        <AppText style={[typography.serifTitle, styles.name]}>{vendor.name}</AppText>
        <StatusBadge label={statusLabel} bg={status.bg} color={status.text} />
        {mayEdit && !editing ? (
          <Pressable
            onPress={startEditing}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Edit vendor">
            <Icon name="pencil" size={17} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      <AppText variant="callout" color={colors.textSecondary} style={styles.meta}>
        {/* Custom label is only set when the category is OTHER. */}
        {vendor.customCategory ?? vendor.category}
        {vendor.contactName ? ` · ${vendor.contactName}` : ''}
      </AppText>

      {/* --- Edit details ---------------------------------------------- */}
      {editing ? (
        <Card style={styles.card}>
          <AppText variant="overline" color={colors.textSecondary} style={styles.cardLabel}>
            Edit details
          </AppText>
          <FormBanner message={editBanner} />
          <View style={styles.editForm}>
            <Input
              label="Vendor name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!savingEdit}
            />
            <FieldError message={editErrors.name} />

            <View>
              <AppText variant="label" color={colors.textSecondary} style={styles.cardLabel}>
                Category
              </AppText>
              <View style={styles.chips}>
                {VENDOR_CATEGORIES.map(c => (
                  <FilterChip
                    key={c}
                    label={c}
                    active={c === category}
                    onPress={() => setCategory(c)}
                  />
                ))}
              </View>
            </View>
            <FieldError message={editErrors.category} />

            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!savingEdit}
            />
            <FieldError message={editErrors.phone} />

            <Input
              label="Total cost (Rs)"
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              editable={!savingEdit}
            />
            <FieldError message={editErrors.totalPrice} />

            <AppText variant="caption" color={colors.textMuted}>
              Paid is the sum of the payments below, so it changes by recording or
              deleting a payment — not here.
            </AppText>

            <View style={styles.actions}>
              <Button
                label="Cancel"
                variant="outline"
                fullWidth={false}
                style={styles.action}
                onPress={() => setEditing(false)}
                disabled={savingEdit}
              />
              <Button
                label="Save Changes"
                fullWidth={false}
                style={styles.action}
                onPress={saveEdit}
                loading={savingEdit}
              />
            </View>
          </View>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <AppText variant="overline" color={colors.textSecondary} style={styles.cardLabel}>
          Payment breakdown
        </AppText>
        <Row
          label="Total cost"
          value={cost > 0 ? `Rs ${formatNumber(cost)}` : 'Not set'}
          valueColor={cost > 0 ? colors.text : colors.textMuted}
        />
        <Row
          label="Paid / Peshgi"
          value={`Rs ${formatNumber(paid)}`}
          valueColor={colors.primaryLight}
        />
        <Row
          label="Balance / Baqaya"
          value={cost > 0 ? `Rs ${formatNumber(balance)}` : '—'}
        />
        <ProgressBar progress={pctPaid} height={6} style={styles.bar} />
      </Card>

      {/* --- Record a payment ------------------------------------------ */}
      {mayEdit ? (
        <Card style={styles.card}>
          <AppText variant="overline" color={colors.textSecondary} style={styles.cardLabel}>
            Record a payment
          </AppText>
          <FormBanner message={payError} />
          <FormBanner message={payWarning} tone="warning" />
          <Input
            placeholder="Amount in Rs"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            editable={!paying}
          />
          <AppText variant="caption" color={colors.textMuted} style={styles.note}>
            Payments also create a matching entry in your budget.
          </AppText>
          <Button
            label="Add Payment"
            onPress={recordPayment}
            loading={paying}
            disabled={!amount.trim()}
          />
        </Card>
      ) : null}

      {/* --- Payment history ------------------------------------------- */}
      <Card style={styles.card}>
        <AppText variant="overline" color={colors.textSecondary} style={styles.cardLabel}>
          Payment history
        </AppText>
        {vendor.payments.length === 0 ? (
          <AppText variant="caption" color={colors.textMuted}>
            No payments recorded yet.
          </AppText>
        ) : (
          <View style={styles.payments}>
            {vendor.payments.map(payment => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={styles.flex}>
                  <AppText variant="label" color={colors.text}>
                    Rs {formatNumber(toNumber(payment.amount))}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {formatDate(payment.paymentDate.slice(0, 10), 'monthDay', '—')} ·{' '}
                    {payment.method.replace('_', ' ').toLowerCase()}
                    {payment.note ? ` · ${payment.note}` : ''}
                  </AppText>
                </View>
                {mayEdit ? (
                  <Pressable
                    onPress={() => deletePayment(payment.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Delete payment">
                    <Icon name="trash" size={16} color={colors.danger} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Card>

      {vendor.notes ? (
        <Card style={styles.card}>
          <AppText variant="overline" color={colors.textSecondary} style={styles.cardLabel}>
            Notes
          </AppText>
          <AppText variant="callout" color={colors.textSecondary}>
            {vendor.notes}
          </AppText>
        </Card>
      ) : null}

      {/* Contact actions only make sense with a number on file. */}
      {vendor.phone ? (
        <View style={styles.actions}>
          <Button
            label="Call"
            variant="outline"
            fullWidth={false}
            style={styles.action}
            onPress={call}
            leftIcon={<Icon name="phone" size={18} color={colors.primary} />}
          />
          <Button
            label="Message"
            fullWidth={false}
            style={styles.action}
            onPress={message}
            leftIcon={<Icon name="message" size={18} color={colors.textOnPrimary} />}
          />
        </View>
      ) : null}
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
  flex: {
    flex: 1,
    minWidth: 0,
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
  backFallback: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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
    gap: spacing.sm,
  },
  cardLabel: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowValue: {
    ...weight('bold'),
  },
  bar: {
    marginTop: spacing.xs,
  },
  note: {
    marginTop: -spacing.xxs,
  },
  payments: {
    gap: spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  action: {
    flex: 1,
  },
  editForm: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
