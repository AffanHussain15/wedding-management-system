import React, { useRef, useState } from 'react';
import {
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { ScreenContainer, AppText, Button } from '@components';
import { colors, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

/** Horizontal travel that commits to a slide change, in px. */
const SWIPE_THRESHOLD = 40;

/** Artwork aspect ratio (1370 × 864), so the box matches the file. */
const ART_RATIO = 1370 / 864;

interface Slide {
  title: string;
  body: string;
  /**
   * Required with a relative path, not the `@assets` alias: Metro resolves
   * asset requires at bundle time and the module-resolver alias only covers the
   * JS/TS extensions listed in babel.config.js.
   */
  image: ImageSourcePropType;
  /** Spoken description of the artwork, for screen readers. */
  alt: string;
}

const SLIDES: Slide[] = [
  {
    title: 'Manage every vendor in one place',
    body: 'Track bookings, payments, and contacts for caterers, decor, photography and more.',
    image: require('../../assets/images/onboarding-1-vendors.png'),
    alt: 'A vendor list showing paid, advance and pending payment states',
  },
  {
    title: 'Guests & budget, simplified',
    body: 'Real-time RSVP tracking and a visual budget breakdown — no spreadsheets.',
    image: require('../../assets/images/onboarding-2-guests-budget.png'),
    alt: 'RSVP counts beside a budget breakdown chart',
  },
  {
    title: 'Every function, on one timeline',
    body: 'From Dholki to Walima, keep your whole family in sync.',
    image: require('../../assets/images/onboarding-3-timeline.png'),
    alt: 'A timeline of the Dholki, Mehndi, Baraat and Walima functions',
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
        <Image
          source={slide.image}
          style={styles.art}
          // The artwork carries its own cream card and rounded corners, so it is
          // fitted rather than cropped.
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel={slide.alt}
        />

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
    // Matches the other onboarding screens, and leaves room for the primary
    // button's shadow below the last row.
    paddingBottom: spacing.xxl,
  },
  top: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  art: {
    width: '100%',
    aspectRatio: ART_RATIO,
    // Caps the artwork on tall screens and lets it shrink on short ones, so the
    // title, body and dots below it always fit without scrolling.
    maxHeight: 240,
    alignSelf: 'center',
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
    marginBottom: spacing.sm,
    // Android clips a child's elevation shadow at its parent's bounds, and the
    // footer ends flush with the button on the slides that have no login line.
    overflow: 'visible',
  },
});
