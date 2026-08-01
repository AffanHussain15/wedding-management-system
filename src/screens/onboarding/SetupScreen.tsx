/**
 * Wedding creation wizard.
 *
 * Runs before a wedding exists, so it holds its own draft state rather than
 * reading the store: the final step calls `POST /weddings` and then
 * `POST .../events` once per selected function. Editing an existing wedding
 * happens on the Profile screen instead.
 */

import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Button,
  Input,
  MoneyInput,
  DateField,
  FilterChip,
  FieldError,
  FormBanner,
} from '@components';
import { api, ApiError, errorMessage, joinCoupleName } from '@services';
import { useAuth } from '@store';
import { useMutation } from '@hooks';
import { FUNCTION_NAMES } from '@constants';
import { colors, radius, spacing, typography } from '@theme';
import { formatDate, toApiDate, todayIso } from '@utils';
import { useAppNavigation, useRootTree } from '@navigation/hooks';

const STEP_TITLES = ['Tell us about the couple', 'Set your date & venue', 'Confirm your functions'];

const STEP_FIELDS: string[][] = [
  ['bride', 'groom'],
  ['weddingDate', 'venueCity', 'totalBudget'],
  [],
];

/**
 * Temporary tracing for the setup wizard — delete once the flow is confirmed.
 *
 * Deliberately not behind `__DEV__`, so it also shows up in a release build's
 * device log (`npx react-native log-android`, or Xcode's console) and not only
 * in Metro. Every line is prefixed `[Setup]` so it can be filtered.
 */
function trace(label: string, value?: unknown): void {
  console.log(
    `[Setup] ${label}`,
    value === undefined ? '' : JSON.stringify(value, null, 2),
  );
}

/** Errors carry their fields on the prototype, so spell them out for logging. */
function describeError(error: ApiError): Record<string, unknown> {
  return {
    status: error.status,
    code: error.code,
    message: error.message,
    details: error.details,
    fieldErrors: error.fieldErrors,
    requestId: error.requestId,
    isNetworkError: error.isNetworkError,
  };
}

type Selected = Record<string, boolean>;

/**
 * Nothing is selected up front: every function that stays ticked becomes an
 * event, and a preselected list means a couple who skips past this step gets a
 * Timeline full of functions they never said they were having.
 */
const initialSelection: Selected = FUNCTION_NAMES.reduce<Selected>((acc, name) => {
  acc[name] = false;
  return acc;
}, {});

export function SetupScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { completeWeddingSetup } = useAuth();

  // Whether the wizard was pushed from inside the app ("Create Another
  // Wedding") rather than entered as a new account's first screen. Read once on
  // mount, because creating the wedding is exactly what changes the answer.
  const openedFromApp = useRef(useRootTree() === 'app').current;

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
    // Raw form state, to confirm nothing was lost between steps.
    trace('form state at submit', {
      bride,
      groom,
      weddingDate,
      city,
      venue,
      totalBudget,
      selectedFunctions: FUNCTION_NAMES.filter(name => selected[name]),
    });

    const payload = {
      name: joinCoupleName(bride, groom),
      ...(weddingDate ? { weddingDate: toApiDate(weddingDate) } : {}),
      ...(city.trim() ? { venueCity: city.trim() } : {}),
      ...(Number(totalBudget) > 0 ? { totalBudget: Number(totalBudget) } : {}),
    };
    trace('POST /weddings payload', payload);

    let wedding: Awaited<ReturnType<typeof api.weddings.create>>['wedding'];
    try {
      ({ wedding } = await api.weddings.create(payload));
      trace('POST /weddings ok', wedding);
    } catch (error) {
      trace(
        'POST /weddings FAILED',
        error instanceof ApiError ? describeError(error) : String(error),
      );
      throw error;
    }

    // Each selected function becomes an event. They share the wedding date
    // because the wizard doesn't ask per function; the Timeline can adjust them
    // later. A failure here is reported but must not discard the wedding that
    // was already created successfully.
    const chosen = FUNCTION_NAMES.filter(name => selected[name]);
    const eventDate = toApiDate(weddingDate);
    const failures: string[] = [];

    if (eventDate) {
      for (const name of chosen) {
        const eventPayload = {
          name,
          eventDate,
          ...(venue.trim() ? { venueName: venue.trim() } : {}),
        };
        try {
          trace(`POST /weddings/${wedding.id}/events payload`, eventPayload);
          await api.events.create(wedding.id, eventPayload);
          trace(`event "${name}" ok`);
        } catch (error) {
          trace(
            `event "${name}" FAILED`,
            error instanceof ApiError ? describeError(error) : String(error),
          );
          failures.push(`${name} (${errorMessage(error)})`);
        }
      }
    } else {
      trace('no wedding date — skipping all events', { weddingDate });
    }

    return {
      wedding,
      failures,
      skippedEvents: !eventDate && chosen.length > 0,
    };
  });

  const isLast = step === 2;

  /** Client-side rules for the current step; empty means it passed. */
  const collectStepErrors = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!bride.trim()) next.bride = "Enter the bride's name.";
      if (!groom.trim()) next.groom = "Enter the groom's name.";
      // The API requires a 2–150 character wedding name.
      if (joinCoupleName(bride, groom).length < 2) next.bride = 'Names are too short.';
    }
    if (step === 1) {
      // The date comes from the calendar, so it can only be a real day or ''.
      if (totalBudget.trim() && !(Number(totalBudget) > 0)) {
        next.totalBudget = 'Enter a positive amount, or leave it blank.';
      }
    }
    return next;
  };

  const goNext = async () => {
    trace(`"${isLast ? 'Finish Setup' : 'Next'}" tapped on step ${step + 1}/3`);

    const localFailures = collectStepErrors();
    setLocalErrors(localFailures);
    if (Object.keys(localFailures).length > 0) {
      trace('blocked by local validation', localFailures);
      return;
    }

    if (!isLast) {
      setStep(s => s + 1);
      return;
    }

    const result = await create.run();
    if (!result.ok) {
      trace('submit failed — staying on step 3', describeError(result.error));
      return;
    }

    const { wedding, failures, skippedEvents } = result.data;
    if (failures.length > 0 || skippedEvents) {
      // The wedding exists; only some functions don't. Say so rather than
      // dropping into the app as though everything worked.
      setPartialWarning(
        skippedEvents
          ? 'Wedding created. Functions were skipped because no date was set — add them from the Timeline.'
          : `Wedding created, but these functions failed: ${failures.join(', ')}.`,
      );
    }

    // Make the new wedding active immediately — the root navigator then shows
    // the app stack. Deliberately not `refreshProfile()` here: a slow/failed
    // `GET /users/me` (the backend can take up to a minute to wake from an
    // idle Render instance) must not stall this, or a brand-new user is stuck
    // on this screen with no error and no way into the app they just created.
    await completeWeddingSetup({ id: wedding.id, name: wedding.name, role: wedding.role });

    // Entered from the app stack, the tree doesn't change — the user already had
    // a wedding — so this screen isn't swapped out and would sit here on a
    // finished wizard, one tap away from creating the same wedding twice. Walk
    // back to the app instead. When the tree does change (a new account's first
    // wedding) the container re-keys and this screen is already gone.
    if (openedFromApp) nav.popToTop();
  };

  const goBack = () => {
    setLocalErrors({});
    if (step > 0) setStep(s => s - 1);
    else nav.goBack();
  };

  // Step 1 of a new account's wizard is the setup tree's first route, so its
  // "Back" has nothing to pop and sits dead under the finger. Show the button
  // only where it can move: a later step, or an entry point that left a screen
  // behind it (the wedding picker, "Create Another Wedding").
  const canGoBack = step > 0 || nav.canGoBack();

  const errors = { ...localErrors, ...create.fieldErrors };
  const shownInline = STEP_FIELDS[step].some(field => errors[field]);

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
        <FormBanner message={shownInline ? null : create.error?.message} />
        <FormBanner tone="warning" message={partialWarning} />
      </View>

      {step === 0 ? (
        <View style={styles.form}>
          <Input
            label="Bride's name / Dulhan"
            placeholder="e.g. Ayesha Khan"
            value={bride}
            onChangeText={setBride}
            autoCapitalize="words"
            editable={!create.loading}
          />
          <FieldError message={errors.bride} />
          <Input
            label="Groom's name / Dulha"
            placeholder="e.g. Ahmed Raza"
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
          <DateField
            label="Wedding date / Shaadi ki Tareekh"
            title="Pick the wedding date"
            value={weddingDate}
            onChange={setWeddingDate}
            placeholder="Tap to pick a date"
            disabled={create.loading}
            // A wedding is always ahead of you, and the API wants a future date.
            min={todayIso()}
            clearable
          />
          <FieldError message={errors.weddingDate} />
          <Input
            label="City"
            placeholder="e.g. Karachi"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
            editable={!create.loading}
          />
          <FieldError message={errors.venueCity} />
          <Input
            label="Main venue"
            placeholder="e.g. Pearl Continental"
            value={venue}
            onChangeText={setVenue}
            autoCapitalize="words"
            editable={!create.loading}
          />
          <MoneyInput
            label="Total budget (Rs, optional)"
            value={totalBudget}
            onChangeText={setTotalBudget}
            placeholder="0"
            editable={!create.loading}
          />
          <FieldError message={errors.totalBudget} />
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <AppText variant="callout" color={colors.textSecondary} style={styles.hint}>
            Which functions are you planning? Tap the ones you're having — each
            becomes an event you can reschedule later, and you can add more from
            the Timeline.
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
        {canGoBack ? (
          <Button
            label="Back"
            variant="outline"
            fullWidth={false}
            style={styles.backBtn}
            onPress={goBack}
            disabled={create.loading}
          />
        ) : null}
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
    // The row ends flush with the buttons, so on Android its bounds would clip
    // the primary button's elevation shadow.
    overflow: 'visible',
  },
  backBtn: {
    flex: 1,
  },
  nextBtn: {
    flex: 2,
  },
});
