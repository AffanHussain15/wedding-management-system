/**
 * Boot screen shown while the persisted session is read from storage.
 *
 * No longer a navigable route — `RootNavigator` renders it directly until auth
 * state is known, so it can't be tapped past into a stack the user isn't
 * authenticated for.
 */

import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText, GradientView } from '@components';
import { colors, spacing, typography } from '@theme';

const CREAM_80 = 'rgba(253,246,233,0.8)';

export function SplashScreen(): React.JSX.Element {
  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" />
      <GradientView colors={['#7A1230', '#4E0A1D']} style={styles.flex}>
        <View style={styles.center}>
          <Svg width={72} height={72} viewBox="0 0 72 72">
            <Circle
              cx={28}
              cy={36}
              r={18}
              fill="none"
              stroke={colors.accentBright}
              strokeWidth={2.6}
            />
            <Circle
              cx={44}
              cy={36}
              r={18}
              fill="none"
              stroke={colors.accentBright}
              strokeWidth={2.6}
              opacity={0.85}
            />
          </Svg>
          <AppText style={styles.wordmark}>Ek</AppText>
          <AppText center style={styles.tagline}>
            One app for your whole wedding.
          </AppText>
        </View>
        <View style={styles.footer}>
          <ActivityIndicator color={colors.goldSoft} />
        </View>
      </GradientView>
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
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  wordmark: {
    ...typography.serifDisplay,
    fontSize: 40,
    color: colors.goldSoft,
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  tagline: {
    ...typography.callout,
    color: CREAM_80,
    maxWidth: 220,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xxxl,
  },
});
