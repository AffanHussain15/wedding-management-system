/**
 * Floating action button. With `actions`, tapping toggles a menu of pills;
 * otherwise it fires `onPress`.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@theme';
import { AppText } from './AppText';
import { GradientView } from './GradientView';
import { Icon } from './Icon';

const GRADIENT = ['#8A2142', '#6D0F2B'] as const;

export interface FabAction {
  label: string;
  onPress: () => void;
}

export interface FabProps {
  onPress?: () => void;
  actions?: FabAction[];
  /** Distance from the bottom (to clear the tab bar). */
  bottom?: number;
}

export function Fab({ onPress, actions, bottom = 24 }: FabProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const hasMenu = !!actions?.length;

  const handlePress = () => {
    if (hasMenu) setOpen(o => !o);
    else onPress?.();
  };

  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      {hasMenu && open ? (
        <View style={styles.menu}>
          {actions!.map(a => (
            <Pressable
              key={a.label}
              style={styles.menuItem}
              onPress={() => {
                setOpen(false);
                a.onPress();
              }}>
              <AppText variant="label" color={colors.text}>
                {a.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable style={styles.button} onPress={handlePress}>
        <GradientView colors={GRADIENT} style={styles.fill} />
        <View style={open ? styles.rotated : undefined}>
          <Icon name="plus" size={22} color={colors.textOnPrimary} strokeWidth={2.4} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  menu: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  menuItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.accentBright,
    // Same reason as Button's primary variant: the gradient only paints once
    // it has measured itself, and Android needs a background to cast a round
    // shadow rather than a square one.
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  rotated: {
    transform: [{ rotate: '45deg' }],
  },
});
