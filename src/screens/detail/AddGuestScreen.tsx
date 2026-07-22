import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Button, Input, FilterChip } from '@components';
import { useWedding } from '@store';
import { GUEST_GROUPS, GUEST_SIDES } from '@constants';
import type { GuestGroup, GuestSide } from '@types';
import { colors, spacing } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

export function AddGuestScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { actions } = useWedding();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState<GuestGroup>('Family');
  const [side, setSide] = useState<GuestSide>('Bride');

  const save = () => {
    actions.addGuest({
      name: name.trim() || 'New Guest',
      phone: phone.trim() || '—',
      group,
      side,
    });
    nav.goBack();
  };

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <Input
          label="Guest name"
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <Input
          label="Phone"
          placeholder="03xx-xxxxxxx"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Seating group
          </AppText>
          <View style={styles.chipRow}>
            {GUEST_GROUPS.map(g => (
              <FilterChip
                key={g}
                label={g}
                active={g === group}
                onPress={() => setGroup(g)}
                style={styles.chip}
              />
            ))}
          </View>
        </View>

        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Side
          </AppText>
          <View style={styles.chipRow}>
            {GUEST_SIDES.map(s => (
              <FilterChip
                key={s}
                label={s}
                active={s === side}
                onPress={() => setSide(s)}
                style={styles.chip}
              />
            ))}
          </View>
        </View>
      </View>

      <Button label="Save Guest" onPress={save} style={styles.cta} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: spacing.base, paddingBottom: spacing.xxl },
  form: { gap: spacing.base },
  label: { marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: { flex: 1 },
  cta: { marginTop: spacing.xl },
});
