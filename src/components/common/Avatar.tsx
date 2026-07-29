/** Initials badge with a name-derived background color (circle or rounded-square). */

import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, weight } from '@theme';
import { getInitials, getAvatarColor } from '@utils';
import { AppText } from './AppText';

export interface AvatarProps {
  name: string;
  size?: number;
  shape?: 'circle' | 'rounded';
  /** Local photo URI (e.g. from an imported contact); falls back to initials when absent. */
  photoUri?: string | null;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({
  name,
  size = 44,
  shape = 'circle',
  photoUri,
  style,
}: AvatarProps): React.JSX.Element {
  const borderRadius = shape === 'circle' ? size / 2 : size * 0.3;

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius },
          style as StyleProp<ImageStyle>,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: getAvatarColor(name),
        },
        style,
      ]}>
      <AppText color={colors.textOnPrimary} style={{ fontSize: size * 0.32, ...weight('bold') }}>
        {getInitials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
