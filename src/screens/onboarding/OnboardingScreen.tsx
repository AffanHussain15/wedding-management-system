import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Button } from '@components';
import { colors, radius, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

const SLIDES = [
  {
    title: 'Manage every vendor in one place',
    body: 'Track bookings, payments, and contacts for caterers, decor, photography and more.',
    image: 'Vendor management',
  },
  {
    title: 'Guests & budget, simplified',
    body: 'Real-time RSVP tracking and a visual budget breakdown — no spreadsheets.',
    image: 'Guest list & budget',
  },
  {
    title: 'Every function, on one timeline',
    body: 'From Dholki to Walima, keep your whole family in sync.',
    image: 'Wedding timeline',
  },
];

export function OnboardingScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const next = () => (isLast ? nav.replace('Signup') : setIndex(i => i + 1));

  return (
    <ScreenContainer padded={false} contentContainerStyle={styles.root}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.replace('Signup')} hitSlop={8}>
          <AppText variant="label" color={colors.textMuted}>
            Skip
          </AppText>
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={styles.illustration}>
          <AppText variant="caption" color={colors.textMuted}>
            {slide.image}
          </AppText>
        </View>

        <View>
          <AppText style={[typography.serifTitle, styles.title]} center>
            {slide.title}
          </AppText>
          <AppText variant="callout" color={colors.textSecondary} center style={styles.body}>
            {slide.body}
          </AppText>
        </View>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button label={isLast ? 'Get Started' : 'Next'} onPress={next} />
        {isLast ? (
          <AppText variant="caption" color={colors.textSecondary} center>
            Already have an account?{' '}
            <AppText variant="caption" color={colors.primary} onPress={() => nav.navigate('Login')}>
              Login
            </AppText>
          </AppText>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  top: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  illustration: {
    width: '100%',
    height: 190,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceSand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: spacing.sm,
  },
  body: {
    paddingHorizontal: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 5,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.accent,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(109,15,43,0.2)',
  },
  footer: {
    gap: spacing.md,
  },
});
