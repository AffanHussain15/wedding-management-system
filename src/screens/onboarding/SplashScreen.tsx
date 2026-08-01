/**
 * Boot screen shown while the persisted session is read from storage.
 *
 * Not a navigable route — `RootNavigator` renders it directly until auth state
 * is known, so it can't be tapped past into a stack the user isn't
 * authenticated for.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, View } from 'react-native';

import { AppText, BrandMark, GradientView } from '@components';
import { colors, spacing, typography, weight } from '@theme';

const GRADIENT = ['#7A1230', '#6B1B2C', '#4E0A1D'] as const;
const CREAM_70 = 'rgba(253,246,233,0.7)';
const GOLD_25 = 'rgba(212,175,55,0.25)';

const TRACK_WIDTH = 112;
const FILL_WIDTH = 52;
const BAR_HEIGHT = 4;

export function SplashScreen(): React.JSX.Element {
  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <GradientView colors={GRADIENT} style={styles.flex}>
        <View style={styles.center}>
          <BrandMark size={120} dropColor={GRADIENT[0]} />
          <AppText style={styles.wordmark}>Ek</AppText>
          <View style={styles.divider}>
            <View style={styles.rule} />
            <AppText style={styles.dividerText}>DO BAATI, EK ROSHNI</AppText>
            <View style={styles.rule} />
          </View>
        </View>

        <View style={styles.footer}>
          <LoadingBar />
          <AppText center style={styles.tagline}>
            One app for your whole wedding
          </AppText>
        </View>
      </GradientView>
    </View>
  );
}

/**
 * Indeterminate sweep. Boot has no measurable progress to report, so the bar
 * loops rather than pretending to fill toward a known total.
 */
function LoadingBar(): React.JSX.Element {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  // translateX rather than an animated width: only transforms can run on the
  // native driver, which keeps the bar moving even while JS is busy booting.
  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-FILL_WIDTH, TRACK_WIDTH],
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { transform: [{ translateX }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  wordmark: {
    ...typography.serifDisplay,
    fontSize: 56,
    lineHeight: 68,
    color: colors.goldSoft,
    marginTop: spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginTop: spacing.xs,
  },
  rule: {
    width: 28,
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.7,
  },
  dividerText: {
    ...typography.caption,
    ...weight('semiBold'),
    color: CREAM_70,
    letterSpacing: 3,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.base,
  },
  track: {
    width: TRACK_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: GOLD_25,
    overflow: 'hidden',
  },
  fill: {
    width: FILL_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.accentBright,
  },
  tagline: {
    ...typography.callout,
    color: CREAM_70,
  },
});
