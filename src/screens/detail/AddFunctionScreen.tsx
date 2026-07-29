/** Creates an API event — a wedding function on the timeline. */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Button,
  Input,
  DateField,
  FilterChip,
  FieldError,
  FormBanner,
} from '@components';
import { useWedding } from '@store';
import { FUNCTION_NAMES } from '@constants';
import { colors, spacing } from '@theme';
import { todayIso } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

/** The API stores startTime as "HH:mm" on a 24-hour clock. */
const TIME_RULE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function AddFunctionScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, actions } = useWedding();

  const [name, setName] = useState('');
  const [date, setDate] = useState(state.wedding.weddingDate);
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState(state.wedding.venue);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: Record<string, string> = {};
    // The API requires a 2–100 character name and a real date.
    if (name.trim().length < 2) next.name = 'Enter a name of at least 2 characters.';
    // The calendar only yields real days, so the date can only be missing.
    if (!date.trim()) next.eventDate = 'Pick a date for this function.';
    if (time.trim() && !TIME_RULE.test(time.trim())) {
      next.startTime = 'Use 24-hour HH:mm, e.g. 19:30.';
    }
    setErrors(next);
    setBanner(null);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const result = await actions.addFunction({
      name: name.trim(),
      date: date.trim(),
      time: time.trim(),
      venue: venue.trim(),
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

        <Input
          label="Function name"
          placeholder="e.g. Mehndi"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!saving}
        />
        <FieldError message={errors.name} />

        {/* Names are free text server-side; these are just quick picks. */}
        <View>
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            Or pick a common one
          </AppText>
          <View style={styles.chips}>
            {FUNCTION_NAMES.map(suggestion => (
              <FilterChip
                key={suggestion}
                label={suggestion}
                active={name.trim() === suggestion}
                onPress={() => setName(suggestion)}
              />
            ))}
          </View>
        </View>

        <DateField
          label="Date"
          title="Pick the function date"
          placeholder="Tap to pick a date"
          value={date}
          onChange={setDate}
          disabled={saving}
          // Functions are scheduled forward; a past one can't be planned.
          min={todayIso()}
        />
        <FieldError message={errors.eventDate} />

        <Input
          label="Start time (optional)"
          placeholder="19:30"
          value={time}
          onChangeText={setTime}
          autoCapitalize="none"
          editable={!saving}
        />
        <FieldError message={errors.startTime} />

        <Input
          label="Venue (optional)"
          placeholder="e.g. Pearl Continental"
          value={venue}
          onChangeText={setVenue}
          autoCapitalize="words"
          editable={!saving}
        />
        <FieldError message={errors.venueName} />
      </View>

      <Button label="Save Function" onPress={save} loading={saving} style={styles.cta} />
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
  cta: {
    marginTop: spacing.xl,
  },
});
