import React, { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Button, StripedPlaceholder } from '@components';
import { colors, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

/** Horizontal travel that commits to a slide change, in px. */
const SWIPE_THRESHOLD = 40;

interface Slide {
  title: string;
  body: string;
  image: string;
}

const SLIDES: Slide[] = [
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

  // Swipe left/right to page through the slides. `setIndex` is stable, so the
  // responder can be built once.
  const swipe = useRef(
    PanResponder.create({
      // Claim the gesture only once it reads as horizontal, so dot taps still land.
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_e, g) => {
        if (g.dx <= -SWIPE_THRESHOLD) {
          setIndex(i => Math.min(i + 1, SLIDES.length - 1));
        } else if (g.dx >= SWIPE_THRESHOLD) {
          setIndex(i => Math.max(i - 1, 0));
        }
      },
    }),
  ).current;

  return (
    <ScreenContainer padded={false} contentContainerStyle={styles.root}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.replace('Signup')} hitSlop={8}>
          <AppText variant="label" color={colors.textMuted}>
            Skip
          </AppText>
        </Pressable>
      </View>

      <View style={styles.center} {...swipe.panHandlers}>
        <StripedPlaceholder height={190}>
          <AppText variant="caption" color={colors.textMuted}>
            {slide.image}
          </AppText>
        </StripedPlaceholder>

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
            <Pressable
              key={i}
              onPress={() => setIndex(i)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${i + 1} of ${SLIDES.length}`}
              accessibilityState={{ selected: i === index }}>
              <View style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]} />
            </Pressable>
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
