/** Circular initials badge with a name-derived background color. */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@theme';
import { getInitials, getAvatarColor } from '@utils';
import { AppText } from './AppText';

export interface AvatarProps {
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ name, size = 44, style }: AvatarProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getAvatarColor(name),
        },
        style,
      ]}>
      <AppText
        color={colors.textOnPrimary}
        // eslint-disable-next-line react-native/no-inline-styles -- font size scales with the `size` prop
        style={{ fontSize: size * 0.38, fontWeight: '600' }}>
        {getInitials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
});
