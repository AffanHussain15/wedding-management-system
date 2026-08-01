/**
 * Floating action column, bottom-right: the add button, with the AI button
 * above it. Both are optional; with neither, nothing renders.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@theme';
import { AppText } from './AppText';
import { GradientView } from './GradientView';
import { Icon } from './Icon';

const GRADIENT = ['#8A2142', '#6D0F2B'] as const;
const AI_GRADIENT = ['#D4AF37', '#9C6B1F'] as const;

const SIZE = 56;
const AI_SIZE = 48;
const BORDER = 2;

export interface FabAction {
  label: string;
  onPress: () => void;
}

export interface FabProps {
  onPress?: () => void;
  actions?: FabAction[];
  /** Opens the AI assistant. */
  ai?: () => void;
  /** Distance from the bottom (to clear the tab bar). */
  bottom?: number;
}

export function Fab({ onPress, actions, ai, bottom = 24 }: FabProps): React.JSX.Element | null {
  const [open, setOpen] = useState(false);
  const hasMenu = !!actions?.length;
  const hasAdd = hasMenu || !!onPress;

  if (!hasAdd && !ai) return null;

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

      {ai ? (
        <Pressable
          style={styles.aiButton}
          onPress={ai}
          accessibilityRole="button"
          accessibilityLabel="Ask the AI assistant">
          <GradientView colors={AI_GRADIENT} style={styles.aiSurface}>
            <Icon name="sparkles" size={20} color={colors.primary} strokeWidth={2} />
          </GradientView>
        </Pressable>
      ) : null}

      {hasAdd ? (
        <Pressable style={styles.button} onPress={handlePress}>
          <GradientView colors={GRADIENT} style={styles.surface}>
            <View style={open ? styles.rotated : undefined}>
              <Icon name="plus" size={22} color={colors.textOnPrimary} strokeWidth={2.4} />
            </View>
          </GradientView>
        </Pressable>
      ) : null}
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
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: BORDER,
    borderColor: colors.accentBright,
    backgroundColor: GRADIENT[1],
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  aiButton: {
    width: AI_SIZE,
    height: AI_SIZE,
    borderRadius: AI_SIZE / 2,
    borderWidth: BORDER,
    borderColor: colors.primary,
    backgroundColor: AI_GRADIENT[0],
    marginRight: (SIZE - AI_SIZE) / 2,
    shadowColor: colors.accentBright,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  // Flex children, not absolute fills: `flex: 1` covers the content box exactly.
  surface: {
    flex: 1,
    borderRadius: SIZE / 2 - BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSurface: {
    flex: 1,
    borderRadius: AI_SIZE / 2 - BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotated: {
    transform: [{ rotate: '45deg' }],
  },
});
