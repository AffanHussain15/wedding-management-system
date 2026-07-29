/**
 * Profile: the signed-in user, the active wedding's settings, its members, and
 * session management (log out here vs. everywhere).
 */

import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  Card,
  BackButton,
  Avatar,
  Button,
  Input,
  DateField,
  Icon,
  StatusBadge,
  FieldError,
  FormBanner,
  LoadingState,
  ErrorState,
} from '@components';
import { api, canEdit } from '@services';
import { useAuth, useWedding } from '@store';
import { useMutation } from '@hooks';
import { colors, radius, spacing, statusColors, typography } from '@theme';
import { formatDate, formatNumber, todayIso } from '@utils';
import { useAppNavigation } from '@navigation/hooks';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  CO_OWNER: 'Co-owner',
  FAMILY_MEMBER: 'Family',
  VIEWER: 'Viewer',
};

export function ProfileScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { profile, logout, weddings, refreshProfile } = useAuth();
  const { state, actions, loading, refreshing, error, refresh, hasData } = useWedding();
  const { wedding } = state;

  const [editing, setEditing] = useState(false);
  const [bride, setBride] = useState(wedding.bride);
  const [groom, setGroom] = useState(wedding.groom);
  const [date, setDate] = useState(wedding.weddingDate);
  const [city, setCity] = useState(wedding.city);
  const [budget, setBudget] = useState(
    wedding.totalBudget !== null ? String(wedding.totalBudget) : '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const save = useMutation(async () => actions.updateWedding({
    bride: bride.trim(),
    groom: groom.trim(),
    weddingDate: date.trim(),
    city: city.trim(),
    totalBudget: budget.trim() ? Number(budget) : null,
  }));

  const mayEdit = canEdit(wedding.role);

  const startEditing = () => {
    // Reset the draft from current values each time, so a cancelled edit
    // doesn't leave stale text behind.
    setBride(wedding.bride);
    setGroom(wedding.groom);
    setDate(wedding.weddingDate);
    setCity(wedding.city);
    setBudget(wedding.totalBudget !== null ? String(wedding.totalBudget) : '');
    setErrors({});
    setBanner(null);
    setEditing(true);
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!bride.trim() && !groom.trim()) next.bride = 'Enter at least one name.';
    // The date comes from the calendar, so it is either a real day or ''.
    if (budget.trim() && !(Number(budget) > 0)) {
      next.totalBudget = 'Enter a positive amount, or leave blank.';
    }
    setErrors(next);
    setBanner(null);
    if (Object.keys(next).length > 0) return;

    const outcome = await save.run();
    if (!outcome.ok) {
      setBanner(outcome.error.message);
      return;
    }
    // `updateWedding` swallows its own errors into an ActionResult, so check it.
    if (!outcome.data.ok) {
      setBanner(outcome.data.message);
      return;
    }
    setEditing(false);
    setSavedNotice('Wedding details updated.');
    await refreshProfile();
  };

  const confirmLogout = () => {
    Alert.alert(
      'Log out?',
      'You can sign back in at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        // logout() clears local credentials even if the server call fails.
        { text: 'Log Out', style: 'destructive', onPress: () => { logout(); } },
      ],
      { cancelable: true },
    );
  };

  const confirmLogoutAll = () => {
    Alert.alert(
      'Log out everywhere?',
      'This signs you out on every device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out All',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.auth.logoutAll();
            } catch {
              // Even if the call fails, clearing this device is still correct.
            }
            await logout();
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (loading && !hasData) {
    return (
      <ScreenContainer edges={['top']}>
        <LoadingState message="Loading profile…" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scroll
      padded={false}
      edges={['top']}
      contentContainerStyle={styles.content}
      onRefresh={refresh}
      refreshing={refreshing}>
      <BackButton onPress={() => nav.goBack()} />

      {error && !hasData ? <ErrorState fill={false} message={error} onRetry={refresh} /> : null}

      {/* --- Signed-in user ------------------------------------------- */}
      <Card style={styles.profile}>
        <Avatar name={profile?.fullName ?? 'You'} size={56} />
        <View style={styles.flex}>
          <AppText style={typography.title} numberOfLines={1}>
            {profile?.fullName ?? 'You'}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {profile?.email ?? ''}
          </AppText>
          {profile?.phone ? (
            <AppText variant="caption" color={colors.textMuted}>
              {profile.phone}
            </AppText>
          ) : null}
        </View>
      </Card>

      {/* --- Wedding details ------------------------------------------ */}
      <View style={styles.sectionHeader}>
        <AppText variant="overline" color={colors.textMuted}>
          Wedding details
        </AppText>
        {mayEdit && !editing ? (
          <Pressable onPress={startEditing} hitSlop={8}>
            <AppText variant="label" color={colors.primary}>
              Edit
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <FormBanner tone="success" message={savedNotice} />

      {editing ? (
        <Card style={styles.editCard}>
          <FormBanner message={banner} />
          <Input
            label="Bride's name"
            value={bride}
            onChangeText={setBride}
            autoCapitalize="words"
            editable={!save.loading}
          />
          <FieldError message={errors.bride} />
          <Input
            label="Groom's name"
            value={groom}
            onChangeText={setGroom}
            autoCapitalize="words"
            editable={!save.loading}
          />
          <DateField
            label="Wedding date"
            title="Pick the wedding date"
            value={date}
            onChange={setDate}
            placeholder="Tap to pick a date"
            disabled={save.loading}
            // Re-picking a date only moves it forward; an already-past date is
            // left alone unless the user chooses a new one.
            min={todayIso()}
            clearable
          />
          <FieldError message={errors.weddingDate} />
          <Input
            label="City"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
            editable={!save.loading}
          />
          <Input
            label="Total budget (Rs)"
            value={budget}
            onChangeText={setBudget}
            placeholder="0"
            keyboardType="number-pad"
            editable={!save.loading}
          />
          <FieldError message={errors.totalBudget} />
          <View style={styles.editActions}>
            <Button
              label="Cancel"
              variant="outline"
              fullWidth={false}
              style={styles.flex}
              onPress={() => setEditing(false)}
              disabled={save.loading}
            />
            <Button
              label="Save"
              fullWidth={false}
              style={styles.flex}
              onPress={submit}
              loading={save.loading}
            />
          </View>
        </Card>
      ) : (
        <Card padded={false} style={styles.prefs}>
          <PrefRow
            label="Couple"
            value={[wedding.bride, wedding.groom].filter(Boolean).join(' & ') || '—'}
          />
          <PrefRow label="Date" value={formatDate(wedding.weddingDate, 'long')} />
          <PrefRow label="City" value={wedding.city || '—'} />
          <PrefRow
            label="Total budget"
            value={
              wedding.totalBudget !== null ? `Rs ${formatNumber(wedding.totalBudget)}` : 'Not set'
            }
          />
          <PrefRow label="Your role" value={ROLE_LABELS[wedding.role ?? ''] ?? '—'} last />
        </Card>
      )}

      {/* --- Members --------------------------------------------------- */}
      <AppText variant="overline" color={colors.textMuted} style={styles.sectionLabel}>
        Family access / Khandaan
      </AppText>
      <View style={styles.family}>
        {state.members.length > 0 ? (
          state.members.map(member => (
            <Card key={member.userId} style={styles.familyRow}>
              <Avatar name={member.fullName} size={32} />
              <View style={styles.flex}>
                <AppText variant="label" color={colors.text} numberOfLines={1}>
                  {member.fullName}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {member.email}
                </AppText>
              </View>
              <StatusBadge
                label={ROLE_LABELS[member.role] ?? member.role}
                bg={member.role === 'OWNER' ? statusColors.done.bg : statusColors.planned.bg}
                color={member.role === 'OWNER' ? statusColors.done.text : statusColors.planned.text}
              />
            </Card>
          ))
        ) : (
          <AppText variant="caption" color={colors.textMuted}>
            No members loaded.
          </AppText>
        )}
        <Pressable onPress={() => nav.navigate('FamilyLink')} style={styles.manage}>
          <AppText variant="label" color={colors.primary}>
            + Manage family access
          </AppText>
        </Pressable>
      </View>

      {/* --- Switch wedding ------------------------------------------- */}
      {weddings.length > 1 ? (
        <Card onPress={() => nav.navigate('SelectWedding')} style={styles.switchRow}>
          <Icon name="home" size={18} />
          <AppText variant="label" color={colors.text} style={styles.flex}>
            Switch wedding
          </AppText>
          <Icon name="chevronRight" size={14} color={colors.textMuted} />
        </Card>
      ) : null}

      {/* --- Session -------------------------------------------------- */}
      <AppText variant="overline" color={colors.textMuted} style={styles.sectionLabel}>
        Account
      </AppText>
      <Pressable style={styles.logout} onPress={confirmLogout}>
        <AppText variant="button" color={colors.danger}>
          Log out
        </AppText>
      </Pressable>
      <Pressable style={styles.logoutAll} onPress={confirmLogoutAll}>
        <AppText variant="caption" color={colors.textMuted}>
          Log out of all devices
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
}

function PrefRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.prefRow, !last && styles.prefRowDivider]}>
      <AppText variant="callout" color={colors.text}>
        {label}
      </AppText>
      <AppText variant="callout" color={colors.textSecondary} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    borderRadius: radius.xl,
    marginTop: spacing.base,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  editCard: {
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  prefs: {
    borderRadius: radius.lg,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  prefRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(109,15,43,0.06)',
  },
  family: {
    gap: spacing.sm,
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
  },
  manage: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  logout: {
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(178,58,58,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutAll: {
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
});
