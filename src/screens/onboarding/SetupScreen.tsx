/**
 * Wedding creation wizard.
 *
 * Runs before a wedding exists, so it holds its own draft state rather than
 * reading the store: the final step calls `POST /weddings` and then
 * `POST .../events` once per selected function. Editing an existing wedding
 * happens on the Profile screen instead.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Button,
  Input,
  FilterChip,
  FieldError,
  FormBanner,
} from '@components';
import { api, errorMessage, joinCoupleName } from '@services';
import { useAuth } from '@store';
import { useMutation } from '@hooks';
import { FUNCTION_NAMES } from '@constants';
import { colors, radius, spacing, typography } from '@theme';
import { formatDate, toApiDate } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

const STEP_TITLES = ['Tell us about the couple', 'Set your date & venue', 'Confirm your functions'];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type Selected = Record<string, boolean>;

const initialSelection: Selected = FUNCTION_NAMES.reduce<Selected>((acc, name) => {
  acc[name] = true;
  return acc;
}, {});

export function SetupScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { refreshProfile, selectWedding } = useAuth();

  const [step, setStep] = useState(0);
  const [bride, setBride] = useState('');
  const [groom, setGroom] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [selected, setSelected] = useState<Selected>(initialSelection);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [partialWarning, setPartialWarning] = useState<string | null>(null);

  const create = useMutation(async () => {
    const { wedding } = await api.weddings.create({
      name: joinCoupleName(bride, groom),
      ...(weddingDate ? { weddingDate: toApiDate(weddingDate) } : {}),
      ...(city.trim() ? { venueCity: city.trim() } : {}),
      ...(Number(totalBudget) > 0 ? { totalBudget: Number(totalBudget) } : {}),
    });

    // Each selected function becomes an event. They share the wedding date
    // because the wizard doesn't ask per function; the Timeline can adjust them
    // later. A failure here is reported but must not discard the wedding that
    // was already created successfully.
    const chosen = FUNCTION_NAMES.filter(name => selected[name]);
    const eventDate = toApiDate(weddingDate);
    const failures: string[] = [];

    if (eventDate) {
      for (const name of chosen) {
        try {
          await api.events.create(wedding.id, {
            name,
            eventDate,
            ...(venue.trim() ? { venueName: venue.trim() } : {}),
          });
        } catch (error) {
          failures.push(`${name} (${errorMessage(error)})`);
        }
      }
    }

    return {
      weddingId: wedding.id,
      failures,
      skippedEvents: !eventDate && chosen.length > 0,
    };
  });

  const isLast = step === 2;

  const validateStep = (): boolean => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!bride.trim()) next.bride = "Enter the bride's name.";
      if (!groom.trim()) next.groom = "Enter the groom's name.";
      // The API requires a 2–150 character wedding name.
      if (joinCoupleName(bride, groom).length < 2) next.bride = 'Names are too short.';
    }
    if (step === 1) {
      const date = weddingDate.trim();
      if (date && !ISO_DATE.test(date)) {
        next.weddingDate = 'Use the format YYYY-MM-DD.';
      } else if (date && !toApiDate(date)) {
        next.weddingDate = "That date doesn't exist.";
      }
      if (totalBudget.trim() && !(Number(totalBudget) > 0)) {
        next.totalBudget = 'Enter a positive amount, or leave it blank.';
      }
    }
    setLocalErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = async () => {
    if (!validateStep()) return;
    if (!isLast) {
      setStep(s => s + 1);
      return;
    }

    const result = await create.run();
    if (!result.ok) return;

    const { weddingId, failures, skippedEvents } = result.data;
    if (failures.length > 0 || skippedEvents) {
      // The wedding exists; only some functions don't. Say so rather than
      // dropping into the app as though everything worked.
      setPartialWarning(
        skippedEvents
          ? 'Wedding created. Functions were skipped because no date was set — add them from the Timeline.'
          : `Wedding created, but these functions failed: ${failures.join(', ')}.`,
      );
    }

    // Make the new wedding active; the root navigator then shows the app stack.
    await selectWedding(weddingId);
    await refreshProfile();
  };

  const goBack = () => {
    setLocalErrors({});
    if (step > 0) setStep(s => s - 1);
    else nav.goBack();
  };

  const errors = { ...localErrors, ...create.fieldErrors };
  const hasFieldErrors = Object.keys(errors).length > 0;

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.root}>
      <View style={styles.bars}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.bar, step >= i ? styles.barActive : styles.barInactive]} />
        ))}
      </View>

      <AppText variant="overline" color={colors.accent} style={styles.stepLabel}>
        Step {step + 1} of 3
      </AppText>
      <AppText style={[typography.serifTitle, styles.title]}>{STEP_TITLES[step]}</AppText>

      <View style={styles.messages}>
        <FormBanner message={hasFieldErrors ? null : create.error?.message} />
        <FormBanner tone="warning" message={partialWarning} />
      </View>

      {step === 0 ? (
        <View style={styles.form}>
          <Input
            label="Bride's name / Dulhan"
            value={bride}
            onChangeText={setBride}
            autoCapitalize="words"
            editable={!create.loading}
          />
          <FieldError message={errors.bride} />
          <Input
            label="Groom's name / Dulha"
            value={groom}
            onChangeText={setGroom}
            autoCapitalize="words"
            editable={!create.loading}
          />
          <FieldError message={errors.groom} />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.form}>
          <Input
            label="Wedding date / Shaadi ki Tareekh"
            value={weddingDate}
            onChangeText={setWeddingDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            editable={!create.loading}
          />
          <FieldError message={errors.weddingDate} />
          <Input
            label="City"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
            editable={!create.loading}
          />
          <FieldError message={errors.venueCity} />
          <Input
            label="Main venue"
            value={venue}
            onChangeText={setVenue}
            autoCapitalize="words"
            editable={!create.loading}
          />
          <Input
            label="Total budget (Rs, optional)"
            value={totalBudget}
            onChangeText={setTotalBudget}
            placeholder="0"
            keyboardType="number-pad"
            editable={!create.loading}
          />
          <FieldError message={errors.totalBudget} />
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <AppText variant="callout" color={colors.textSecondary} style={styles.hint}>
            Which functions are you planning? Tap to toggle. Each becomes an event
            you can reschedule later.
          </AppText>
          <View style={styles.chips}>
            {FUNCTION_NAMES.map(name => (
              <FilterChip
                key={name}
                label={name}
                active={!!selected[name]}
                onPress={() => setSelected(s => ({ ...s, [name]: !s[name] }))}
              />
            ))}
          </View>
          <View style={styles.summary}>
            <AppText variant="bodyMedium">
              {joinCoupleName(bride, groom) || 'Your wedding'}
            </AppText>
            <AppText variant="callout" color={colors.textSecondary}>
              {[venue.trim(), city.trim()].filter(Boolean).join(', ') || 'Venue not set'}
            </AppText>
            <AppText variant="callout" color={colors.textSecondary}>
              {formatDate(weddingDate, 'long')}
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Back"
          variant="outline"
          fullWidth={false}
          style={styles.backBtn}
          onPress={goBack}
          disabled={create.loading}
        />
        <Button
          label={isLast ? 'Finish Setup' : 'Next'}
          fullWidth={false}
          style={styles.nextBtn}
          onPress={goNext}
          loading={create.loading}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  bars: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  bar: {
    flex: 1,
    height: 5,
    borderRadius: 4,
  },
  barActive: {
    backgroundColor: colors.accent,
  },
  barInactive: {
    backgroundColor: colors.borderSubtle,
  },
  stepLabel: {
    marginBottom: spacing.xs,
  },
  title: {
    marginBottom: spacing.lg,
  },
  messages: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.base,
  },
  hint: {
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summary: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  backBtn: {
    flex: 1,
  },
  nextBtn: {
    flex: 2,
  },
});
