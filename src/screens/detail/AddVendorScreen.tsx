import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Button,
  Input,
  FilterChip,
  FieldError,
  FormBanner,
} from '@components';
import { useWedding } from '@store';
import { VENDOR_CATEGORIES } from '@constants';
import type { VendorCategory, ID } from '@types';
import { colors, spacing } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

/** The API only accepts E.164 phone numbers, e.g. +923001234567. */
const E164_RULE = /^\+[1-9]\d{1,14}$/;

export function AddVendorScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, actions } = useWedding();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Catering');
  const [phone, setPhone] = useState('');
  const [cost, setCost] = useState('');
  const [advance, setAdvance] = useState('');
  const [eventId, setEventId] = useState<ID | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerTone, setBannerTone] = useState<'error' | 'warning'>('error');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Enter a name of at least 2 characters.';
    if (phone.trim() && !E164_RULE.test(phone.trim())) {
      next.phone = 'Use international format, e.g. +923001234567.';
    }
    const costValue = Number(cost) || 0;
    const advanceValue = Number(advance) || 0;
    if (cost.trim() && costValue <= 0) next.cost = 'Enter a positive amount, or leave blank.';
    if (advance.trim() && advanceValue <= 0) {
      next.advance = 'Enter a positive amount, or leave blank.';
    }
    setErrors(next);
    setBanner(null);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const result = await actions.addVendor({
      name: name.trim(),
      category,
      phone: phone.trim(),
      cost: costValue,
      advance: advanceValue,
      eventId,
    });
    setSaving(false);

    if (!result.ok) {
      setErrors(result.error.fieldErrors);
      setBannerTone('error');
      setBanner(result.message);
      return;
    }
    // An advance above the agreed price is permitted but flagged server-side;
    // stay on the form so the warning is actually seen.
    if (result.warning) {
      setBannerTone('warning');
      setBanner(result.warning);
      return;
    }
    nav.goBack();
  };

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <FormBanner message={banner} tone={bannerTone} />

        <Input
          label="Vendor name"
          placeholder="e.g. Al-Noor Caterers"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!saving}
        />
        <FieldError message={errors.name} />

        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Category
          </AppText>
          <View style={styles.chips}>
            {VENDOR_CATEGORIES.map(c => (
              <FilterChip key={c} label={c} active={c === category} onPress={() => setCategory(c)} />
            ))}
          </View>
        </View>
        <FieldError message={errors.category} />

        <Input
          label="Contact number"
          placeholder="+923001234567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
          editable={!saving}
        />
        <FieldError message={errors.phone} />

        <View style={styles.money}>
          <View style={styles.moneyField}>
            <Input
              label="Total cost (Rs)"
              placeholder="0"
              value={cost}
              onChangeText={setCost}
              keyboardType="number-pad"
              editable={!saving}
            />
            <FieldError message={errors.cost} />
          </View>
          <View style={styles.moneyField}>
            <Input
              label="Advance paid"
              placeholder="0"
              value={advance}
              onChangeText={setAdvance}
              keyboardType="number-pad"
              editable={!saving}
            />
            <FieldError message={errors.advance} />
          </View>
        </View>
        {/* The advance becomes the vendor's first payment, which also creates a
            matching budget entry — worth saying so it isn't a surprise. */}
        <AppText variant="caption" color={colors.textMuted}>
          An advance is recorded as a payment and appears in your budget too.
        </AppText>

        {state.functions.length > 0 ? (
          <View>
            <AppText variant="label" color={colors.textSecondary} style={styles.label}>
              For which function? (optional)
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chips}>
                <FilterChip label="Any" active={eventId === null} onPress={() => setEventId(null)} />
                {state.functions.map(fn => (
                  <FilterChip
                    key={fn.id}
                    label={fn.name}
                    active={fn.id === eventId}
                    onPress={() => setEventId(fn.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}
      </View>

      <Button label="Save Vendor" onPress={save} loading={saving} style={styles.cta} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: spacing.base,
    paddingBottom: spacing.xxl,
  },
  form: {
    gap: spacing.base,
  },
  label: {
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  money: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  moneyField: {
    flex: 1,
  },
  cta: {
    marginTop: spacing.xl,
  },
});
