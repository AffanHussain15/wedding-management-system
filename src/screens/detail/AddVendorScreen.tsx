import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Button, Input, FilterChip } from '@components';
import { useWedding } from '@store';
import { VENDOR_CATEGORIES } from '@constants';
import type { VendorCategory } from '@types';
import { colors, spacing } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

export function AddVendorScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { actions } = useWedding();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Catering');
  const [phone, setPhone] = useState('');
  const [cost, setCost] = useState('');
  const [advance, setAdvance] = useState('');

  const save = () => {
    actions.addVendor({
      name: name.trim() || 'New Vendor',
      category,
      phone: phone.trim() || '—',
      cost: parseFloat(cost) || 0,
      advance: parseFloat(advance) || 0,
    });
    nav.goBack();
  };

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <Input
          label="Vendor name"
          placeholder="e.g. Al-Noor Caterers"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
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

        <Input
          label="Contact number"
          placeholder="03xx-xxxxxxx"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <View style={styles.money}>
          <View style={styles.moneyField}>
            <Input
              label="Total cost (Rs)"
              placeholder="0"
              value={cost}
              onChangeText={setCost}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.moneyField}>
            <Input
              label="Advance paid"
              placeholder="0"
              value={advance}
              onChangeText={setAdvance}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>

      <Button label="Save Vendor" onPress={save} style={styles.cta} />
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
