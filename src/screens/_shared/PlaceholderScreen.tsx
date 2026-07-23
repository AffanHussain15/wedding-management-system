/**
 * Temporary scaffold screen. Renders a title + optional navigation buttons so
 * the whole app is tappable before real screen UIs are built. Replace each
 * screen's body as it's implemented.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, Button } from '@components';
import { colors, spacing } from '@theme';

export interface PlaceholderLink {
  label: string;
  onPress: () => void;
}

export interface PlaceholderScreenProps {
  title: string;
  subtitle?: string;
  links?: PlaceholderLink[];
}

export function PlaceholderScreen({
  title,
  subtitle,
  links = [],
}: PlaceholderScreenProps): React.JSX.Element {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <AppText variant="display" color={colors.primary} center>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="callout" color={colors.textSecondary} center style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
        {links.length > 0 ? (
          <View style={styles.links}>
            {links.map(link => (
              <Button
                key={link.label}
                label={link.label}
                variant="outline"
                onPress={link.onPress}
              />
            ))}
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { marginTop: spacing.sm },
  links: {
    alignSelf: 'stretch',
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
});
