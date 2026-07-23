import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Button, Input, FilterChip } from '@components';
import { useWedding } from '@store';
import { FUNCTION_NAMES } from '@constants';
import { colors, radius, spacing, typography } from '@theme';
import { formatDate } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

const STEP_TITLES = ['Tell us about the couple', 'Set your date & venue', 'Confirm your functions'];

export function SetupScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, actions } = useWedding();
  const { wedding } = state;
  const [step, setStep] = useState(0);

  const isLast = step === 2;

  const next = () => (isLast ? nav.replace('Main') : setStep(s => s + 1));
  const back = () => (step > 0 ? setStep(s => s - 1) : nav.goBack());

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

      {step === 0 ? (
        <View style={styles.form}>
          <Input
            label="Bride's name / Dulhan"
            value={wedding.bride}
            onChangeText={t => actions.updateWedding({ bride: t })}
            autoCapitalize="words"
          />
          <Input
            label="Groom's name / Dulha"
            value={wedding.groom}
            onChangeText={t => actions.updateWedding({ groom: t })}
            autoCapitalize="words"
          />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.form}>
          <Input
            label="Wedding date / Shaadi ki Tareekh"
            value={wedding.weddingDate}
            onChangeText={t => actions.updateWedding({ weddingDate: t })}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />
          <Input
            label="City"
            value={wedding.city}
            onChangeText={t => actions.updateWedding({ city: t })}
          />
          <Input
            label="Main venue"
            value={wedding.venue}
            onChangeText={t => actions.updateWedding({ venue: t })}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <AppText variant="callout" color={colors.textSecondary} style={styles.hint}>
            Which functions are you planning? Tap to toggle.
          </AppText>
          <View style={styles.chips}>
            {FUNCTION_NAMES.map(name => (
              <FilterChip
                key={name}
                label={name}
                active={wedding.functionsSelected[name]}
                onPress={() => actions.toggleFunctionSelected(name)}
              />
            ))}
          </View>
          <View style={styles.summary}>
            <AppText variant="bodyMedium">
              {wedding.bride} & {wedding.groom}
            </AppText>
            <AppText variant="callout" color={colors.textSecondary}>
              {wedding.venue}, {wedding.city}
            </AppText>
            <AppText variant="callout" color={colors.textSecondary}>
              {formatDate(wedding.weddingDate, 'long')}
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Back"
          variant="outline"
          fullWidth={false}
          style={styles.back}
          onPress={back}
        />
        <Button
          label={isLast ? 'Finish Setup' : 'Next'}
          fullWidth={false}
          style={styles.nextBtn}
          onPress={next}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  bars: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  bar: { flex: 1, height: 5, borderRadius: 4 },
  barActive: { backgroundColor: colors.accent },
  barInactive: { backgroundColor: colors.borderSubtle },
  stepLabel: { marginBottom: spacing.xs },
  title: { marginBottom: spacing.xl },
  form: { gap: spacing.md },
  hint: { marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summary: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  back: { flex: 1 },
  nextBtn: { flex: 2 },
});
