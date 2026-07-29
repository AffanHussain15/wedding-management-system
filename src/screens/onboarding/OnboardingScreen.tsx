/**
 * Onboarding carousel.
 *
 * Paging is a native horizontal ScrollView rather than a PanResponder that
 * swapped state on release: the cards now track the finger, rubber-band at the
 * ends and settle with the platform's own fling curve. The dots and the Next
 * button drive the same scroll offset, so every route to a slide animates.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { ScreenContainer, AppText, Button } from '@components';
import { colors, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

/** Screen gutter. Shared so the pager can cancel it and re-apply it per card. */
const GUTTER = 24;

/** Used only if an asset's dimensions can't be read; the current files' ratio. */
const FALLBACK_RATIO = 1368 / 864;

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
  /** Width ÷ height of `image`, filled in by `withRatio`. */
  ratio: number;
}

function withRatio(slide: Omit<Slide, 'ratio'>): Slide {
  const asset = Image.resolveAssetSource(slide.image);
  return {
    ...slide,
    ratio: asset?.height ? asset.width / asset.height : FALLBACK_RATIO,
  };
}

const SLIDES: Slide[] = [
  withRatio({
    title: 'Manage every vendor in one place',
    body: 'Track bookings, payments, and contacts for caterers, decor, photography and more.',
    image: require('../../assets/images/onboarding-1-vendors.png'),
    alt: 'A vendor list showing paid, advance and pending payment states',
  }),
  withRatio({
    title: 'Guests & budget, simplified',
    body: 'Real-time RSVP tracking and a visual budget breakdown — no spreadsheets.',
    image: require('../../assets/images/onboarding-2-guests-budget.png'),
    alt: 'RSVP counts beside a budget breakdown chart',
  }),
  withRatio({
    title: 'Every function, on one timeline',
    body: 'From Dholki to Walima, keep your whole family in sync.',
    image: require('../../assets/images/onboarding-3-timeline.png'),
    alt: 'A timeline of the Dholki, Mehndi, Baraat and Walima functions',
  }),
];

export function OnboardingScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  // Window width, not a measured layout: the page width has to be known on the
  // first render or the cards start at zero width and the pager can't snap.
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  // Mirrors `index` for the scroll handler, which fires far more often than it
  // needs to re-render and would otherwise close over a stale value.
  const indexRef = useRef(0);

  const isLast = index === SLIDES.length - 1;
  const cardWidth = width - GUTTER * 2;

  const goTo = (target: number) => {
    const clamped = Math.max(0, Math.min(target, SLIDES.length - 1));
    pager.current?.scrollTo({ x: clamped * width, animated: true });
    // Optimistic: the scroll handler confirms it, but the dots and the button
    // label shouldn't wait for the animation to finish.
    indexRef.current = clamped;
    setIndex(clamped);
  };

  const next = () => (isLast ? nav.replace('Signup') : goTo(index + 1));

  // Page width is derived from the window, so a rotation leaves the old offset
  // pointing between two cards. Re-align without animating.
  useEffect(() => {
    pager.current?.scrollTo({ x: indexRef.current * width, animated: false });
  }, [width]);

  // Flips the dots the moment a card passes the halfway line, so they track the
  // finger instead of waiting for the fling to settle. Rounding clamps the
  // rubber-band overscroll at both ends.
  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(nativeEvent.contentOffset.x / width);
    const clamped = Math.max(0, Math.min(page, SLIDES.length - 1));
    if (clamped !== indexRef.current) {
      indexRef.current = clamped;
      setIndex(clamped);
    }
  };

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
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          // Snappier settle than the default 'normal' drift.
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          // Cancels the root gutter so the swipe area — and each card — spans
          // the full screen; the gutter comes back inside the card.
          style={styles.pager}>
          {SLIDES.map(slide => (
            <View key={slide.title} style={[styles.card, { width }]}>
              <Image
                source={slide.image}
                // Explicit width: an Image left to size itself takes the asset's
                // intrinsic 1368dp and overflows the card.
                style={[styles.art, { width: cardWidth, aspectRatio: slide.ratio }]}
                resizeMode="contain"
                accessible
                accessibilityRole="image"
                accessibilityLabel={slide.alt}
              />

              <View style={{ width: cardWidth }}>
                <AppText style={[typography.serifTitle, styles.title]} center>
                  {slide.title}
                </AppText>
                <AppText variant="callout" color={colors.textSecondary} center style={styles.body}>
                  {slide.body}
                </AppText>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <Pressable
              key={slide.title}
              onPress={() => goTo(i)}
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
    paddingHorizontal: GUTTER,
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
  pager: {
    marginHorizontal: -GUTTER,
  },
  card: {
    // Full screen width so paging snaps cleanly, with the contents centred at
    // `cardWidth` — which restores the gutter the pager cancelled, keeping the
    // artwork aligned with the Next button.
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  art: {
    maxHeight: 240,
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
    overflow: 'visible',
  },
});
