/**
 * Wedding picker, shown when the user belongs to more than one wedding, or to
 * switch between them. Memberships come from `GET /users/me`.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  BackButton,
  Button,
  Card,
  Avatar,
  Icon,
  StatusBadge,
} from '@components';
import { useAuth } from '@store';
import { colors, radius, spacing, statusColors, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  CO_OWNER: 'Co-owner',
  FAMILY_MEMBER: 'Family',
  VIEWER: 'Viewer',
};

export function SelectWeddingScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { weddings, activeWeddingId, selectWedding } = useAuth();

  const choose = async (weddingId: string) => {
    await selectWedding(weddingId);
    // The provider reloads for the new id; go back to wherever we came from.
    if (nav.canGoBack()) nav.goBack();
  };

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.root}>
      {nav.canGoBack() ? <BackButton onPress={() => nav.goBack()} /> : null}

      <AppText style={[typography.serifValue, styles.title]}>Choose a wedding</AppText>
      <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
        You have access to more than one workspace.
      </AppText>

      <View style={styles.list}>
        {weddings.map(wedding => {
          const active = wedding.id === activeWeddingId;
          return (
            <Card key={wedding.id} onPress={() => choose(wedding.id)} style={styles.row}>
              <Avatar name={wedding.name} shape="rounded" size={40} />
              <View style={styles.body}>
                <AppText variant="title" numberOfLines={1}>
                  {wedding.name}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {ROLE_LABELS[wedding.role] ?? wedding.role}
                </AppText>
              </View>
              {active ? (
                <StatusBadge
                  label="Active"
                  bg={statusColors.done.bg}
                  color={statusColors.done.text}
                />
              ) : (
                <Icon name="chevronRight" size={14} color={colors.textMuted} />
              )}
            </Card>
          );
        })}
      </View>

      <Button
        label="Create Another Wedding"
        variant="outline"
        onPress={() => nav.navigate('Setup')}
        style={styles.cta}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginTop: spacing.base,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  cta: {
    marginTop: spacing.xl,
  },
});
