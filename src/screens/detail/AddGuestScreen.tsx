import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Button,
  Icon,
  Input,
  PhoneInput,
  FilterChip,
  FieldError,
  FormBanner,
} from '@components';
import { useWedding } from '@store';
import { GUEST_GROUPS, GUEST_SIDES } from '@constants';
import type { GuestGroup, GuestSide } from '@types';
import { isValidPhone, normalizePhone } from '@utils';
import { colors, spacing } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

export function AddGuestScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { actions } = useWedding();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [groupSize, setGroupSize] = useState('1');
  const [group, setGroup] = useState<GuestGroup>('Mixed');
  const [side, setSide] = useState<GuestSide>('Both');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Enter a name of at least 2 characters.';
    // The field collects the national number, so validate what it normalises to
    // rather than the raw digits.
    if (!isValidPhone(phone)) {
      next.phone = 'Enter a valid mobile number, e.g. 0300 1234567.';
    }
    // The API constrains groupSize to an integer between 1 and 50.
    const size = Number(groupSize);
    if (!Number.isInteger(size) || size < 1 || size > 50) {
      next.groupSize = 'Enter a whole number between 1 and 50.';
    }
    setErrors(next);
    setBanner(null);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const result = await actions.addGuest({
      name: name.trim(),
      phone: normalizePhone(phone),
      group,
      side,
      groupSize: size,
    });
    setSaving(false);

    if (!result.ok) {
      setErrors(result.error.fieldErrors);
      setBanner(result.message);
      return;
    }
    nav.goBack();
  };

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <FormBanner message={banner} />

        <Button
          label="Import from Contacts"
          variant="outline"
          leftIcon={<Icon name="contacts" size={16} color={colors.primary} />}
          onPress={() => nav.replace('ImportContacts')}
          disabled={saving}
        />

        <Input
          label="Guest name"
          placeholder="Full name, or e.g. Khan Family"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!saving}
        />
        <FieldError message={errors.name} />

        <PhoneInput
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          editable={!saving}
        />
        <FieldError message={errors.phone} />

        {/* One entry can cover a whole family, which is what the head counts
            on the Guests screen are based on. */}
        <Input
          label="How many people?"
          placeholder="1"
          value={groupSize}
          onChangeText={setGroupSize}
          keyboardType="number-pad"
          editable={!saving}
        />
        <FieldError message={errors.groupSize} />

        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Gathering
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

      <Button label="Save Guest" onPress={save} loading={saving} style={styles.cta} />
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
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
  },
  cta: {
    marginTop: spacing.xl,
  },
});
