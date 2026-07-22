/** Sand-tile back button with a left chevron. */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@theme';
import { Icon } from './Icon';

export interface BackButtonProps {
  onPress: () => void;
}

export function BackButton({ onPress }: BackButtonProps): React.JSX.Element {
  return (
    <Pressable style={styles.button} onPress={onPress} hitSlop={8}>
      <Icon name="chevronRight" size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSand,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scaleX: -1 }],
  },
});
