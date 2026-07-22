/** Initials badge with a name-derived background color (circle or rounded-square). */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@theme';
import { getInitials, getAvatarColor } from '@utils';
import { AppText } from './AppText';

export interface AvatarProps {
  name: string;
  size?: number;
  shape?: 'circle' | 'rounded';
  style?: StyleProp<ViewStyle>;
}

export function Avatar({
  name,
  size = 44,
  shape = 'circle',
  style,
}: AvatarProps): React.JSX.Element {
  const borderRadius = shape === 'circle' ? size / 2 : size * 0.3;

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
      <AppText
        color={colors.textOnPrimary}
        // eslint-disable-next-line react-native/no-inline-styles -- font size scales with the `size` prop
        style={{ fontSize: size * 0.32, fontWeight: '700' }}>
        {getInitials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
});
