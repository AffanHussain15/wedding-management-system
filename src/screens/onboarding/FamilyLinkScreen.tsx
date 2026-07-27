/**
 * Family access: invite members to the active wedding, see who's already in,
 * and redeem an invite token you were given.
 *
 * Both directions are real API calls (`POST .../invites`, `POST /invites/accept`).
 * Note the server only logs the invite link today — email delivery is not
 * implemented — so the token has to be shared manually for now.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ScreenContainer,
  AppText,
  BackButton,
  Button,
  Card,
  Avatar,
  Input,
  FilterChip,
  FieldError,
  FormBanner,
  LoadingState,
  ErrorState,
  StatusBadge,
} from '@components';
import { api, canEdit, memberFromApi, type InvitableRole } from '@services';
import { useAuth } from '@store';
import { useMutation, useQuery } from '@hooks';
import { colors, radius, spacing, statusColors, typography } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

const ROLE_OPTIONS: { value: InvitableRole; label: string; hint: string }[] = [
  { value: 'CO_OWNER', label: 'Co-owner', hint: 'Full access, same as you' },
  { value: 'FAMILY_MEMBER', label: 'Family', hint: 'Can add guests, tasks and functions' },
  { value: 'VIEWER', label: 'Viewer', hint: 'Read-only access' },
];

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  CO_OWNER: 'Co-owner',
  FAMILY_MEMBER: 'Family',
  VIEWER: 'Viewer',
};

export function FamilyLinkScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { activeWeddingId, weddings, refreshProfile, selectWedding } = useAuth();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitableRole>('FAMILY_MEMBER');
  const [inviteToken, setInviteToken] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const membersQuery = useQuery(
    signal => api.weddings.members(activeWeddingId as string, { signal }),
    [activeWeddingId],
    { enabled: !!activeWeddingId },
  );

  // The caller's own role decides whether inviting is even possible.
  const myRole = weddings.find(w => w.id === activeWeddingId)?.role ?? null;
  const mayInvite = canEdit(myRole);

  const invite = useMutation(async () =>
    api.weddings.invite(activeWeddingId as string, { email: email.trim(), role }),
  );

  const accept = useMutation(async (token: string) => api.weddings.acceptInvite(token));

  const sendInvite = async () => {
    if (!activeWeddingId || !email.trim()) return;
    const result = await invite.run();
    if (result.ok) {
      setEmail('');
      setNotice(
        `Invite created for ${result.data.email}. The server logs the link rather than emailing it, so share the token from the backend log.`,
      );
      await membersQuery.refetch();
    }
  };

  const redeem = async () => {
    const token = inviteToken.trim();
    if (!token) return;
    const result = await accept.run(token);
    if (result.ok) {
      setInviteToken('');
      setNotice('Invite accepted. You now have access to that wedding.');
      // Adopt the wedding just joined, then reload memberships.
      await selectWedding(result.data.weddingId);
      await refreshProfile();
    }
  };

  const members = (membersQuery.data ?? []).map(memberFromApi);

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.root}>
      <BackButton onPress={() => nav.goBack()} />

      <AppText style={[typography.serifValue, styles.title]}>
        You're not planning this alone
      </AppText>
      <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
        Link your partner and family to one shared workspace — a single source of
        truth for everyone.
      </AppText>

      <FormBanner tone="success" message={notice} />

      {/* --- Invite someone -------------------------------------------- */}
      {activeWeddingId ? (
        <View style={styles.section}>
          <AppText variant="overline" color={colors.textMuted} style={styles.sectionLabel}>
            Invite by email
          </AppText>

          {mayInvite ? (
            <View style={styles.form}>
              <FormBanner
                message={invite.fieldErrors.email ? null : invite.error?.message}
              />
              <Input
                label="Email"
                placeholder="family@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!invite.loading}
              />
              <FieldError message={invite.fieldErrors.email} />

              <AppText variant="label" color={colors.textSecondary}>
                Role
              </AppText>
              <View style={styles.chipRow}>
                {ROLE_OPTIONS.map(option => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={option.value === role}
                    onPress={() => setRole(option.value)}
                  />
                ))}
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                {ROLE_OPTIONS.find(o => o.value === role)?.hint}
              </AppText>

              <Button
                label="Send Invite"
                onPress={sendInvite}
                loading={invite.loading}
                disabled={!email.trim()}
              />
            </View>
          ) : (
            <AppText variant="caption" color={colors.textMuted}>
              Only the owner or a co-owner can invite people to this wedding.
            </AppText>
          )}
        </View>
      ) : null}

      {/* --- Redeem an invite ------------------------------------------ */}
      <View style={styles.section}>
        <AppText variant="overline" color={colors.textMuted} style={styles.sectionLabel}>
          Have an invite token?
        </AppText>
        <View style={styles.form}>
          <FormBanner message={accept.error?.message} />
          <Input
            label="Invite token"
            placeholder="Paste the token"
            value={inviteToken}
            onChangeText={setInviteToken}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!accept.loading}
          />
          <AppText variant="caption" color={colors.textMuted}>
            The invite must have been issued to the email on your account.
          </AppText>
          <Button
            label="Accept Invite"
            variant="outline"
            onPress={redeem}
            loading={accept.loading}
            disabled={!inviteToken.trim()}
          />
        </View>
      </View>

      {/* --- Current members ------------------------------------------- */}
      {activeWeddingId ? (
        <View style={styles.section}>
          <AppText variant="overline" color={colors.textMuted} style={styles.sectionLabel}>
            Already linked
          </AppText>

          {membersQuery.loading ? (
            <LoadingState fill={false} />
          ) : membersQuery.error ? (
            <ErrorState
              fill={false}
              message={membersQuery.error.message}
              onRetry={membersQuery.refetch}
            />
          ) : members.length === 0 ? (
            <AppText variant="caption" color={colors.textMuted}>
              No members yet.
            </AppText>
          ) : (
            <View style={styles.members}>
              {members.map(member => (
                <Card key={member.userId} style={styles.memberRow}>
                  <Avatar name={member.fullName} size={34} />
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
                    color={
                      member.role === 'OWNER' ? statusColors.done.text : statusColors.planned.text
                    }
                  />
                </Card>
              ))}
            </View>
          )}
        </View>
      ) : null}

      <Button label="Continue" onPress={() => nav.goBack()} style={styles.cta} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    marginTop: spacing.base,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  members: {
    gap: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
  },
  cta: {
    marginTop: spacing.xl,
  },
});
