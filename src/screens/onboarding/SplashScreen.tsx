import React from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText, GradientView } from '@components';
import { colors, spacing, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

const CREAM_80 = 'rgba(253,246,233,0.8)';
const CREAM_45 = 'rgba(253,246,233,0.45)';

export function SplashScreen(): React.JSX.Element {
  const nav = useAppNavigation();

  return (
    <Pressable style={styles.flex} onPress={() => nav.replace('Onboarding')}>
      <StatusBar barStyle="light-content" />
      <GradientView colors={['#7A1230', '#4E0A1D']} style={styles.flex}>
        <View style={styles.center}>
          <Svg width={72} height={72} viewBox="0 0 72 72">
            <Circle cx={28} cy={36} r={18} fill="none" stroke={colors.accentBright} strokeWidth={2.6} />
            <Circle cx={44} cy={36} r={18} fill="none" stroke={colors.accentBright} strokeWidth={2.6} opacity={0.85} />
          </Svg>
          <AppText style={styles.wordmark}>Ek</AppText>
          <AppText center style={styles.tagline}>
            One app for your whole wedding.
          </AppText>
        </View>
        <AppText style={styles.hint}>tap to begin</AppText>
      </GradientView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  tagline: { ...typography.callout, color: CREAM_80, maxWidth: 220 },
  hint: {
    ...typography.caption,
    color: CREAM_45,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingBottom: spacing.xxxl,
  },
});
