/** Rounded surface container, optionally pressable for navigable rows. */

import React, { type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@theme';

export interface CardProps extends PropsWithChildren {
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  padded = true,
  elevated = true,
  style,
}: CardProps): React.JSX.Element {
  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    padded && styles.padded,
    elevated && shadows.sm,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
  },
  padded: {
    padding: spacing.base,
  },
  pressed: {
    opacity: 0.9,
  },
});
