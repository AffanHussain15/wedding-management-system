/** Safe-area screen shell with the app background and optional scroll. */

import React, { type PropsWithChildren } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, layout } from '@theme';

export interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Enables pull-to-refresh on the scroll view. Requires `scroll`. */
  onRefresh?: () => void;
  /** Whether the refresh spinner is showing. */
  refreshing?: boolean;
}

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'bottom'],
  backgroundColor = colors.background,
  style,
  contentContainerStyle,
  onRefresh,
  refreshing = false,
}: ScreenContainerProps): React.JSX.Element {
  const paddingStyle = padded ? styles.padded : undefined;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, paddingStyle, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, paddingStyle, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: layout.screenPadding,
  },
});
