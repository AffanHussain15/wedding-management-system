import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  ScreenContainer,
  SearchBar,
} from '@components';
import { useWedding } from '@store';
import { useGuestPhotoCache } from '@hooks';
import { getDeviceContacts, requestContactsAccess, type DeviceContact } from '@services';
import { colors, radius, spacing } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

type Status = 'requesting' | 'denied' | 'loading' | 'ready' | 'importing';

export function ImportContactsScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { actions } = useWedding();
  const { savePhotos } = useGuestPhotoCache();

  const [status, setStatus] = useState<Status>('requesting');
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);

  const requestAccess = useCallback(async () => {
    setStatus('requesting');
    const result = await requestContactsAccess();
    if (result !== 'granted') {
      setStatus('denied');
      return;
    }
    setStatus('loading');
    try {
      const deviceContacts = await getDeviceContacts();
      setContacts(deviceContacts);
      setLoadError(null);
      setStatus('ready');
    } catch {
      setLoadError('Could not read your contacts. Please try again.');
      setStatus('ready');
    }
  }, []);

  useEffect(() => {
    requestAccess();
  }, [requestAccess]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter(
      c => c.name.toLowerCase().includes(query) || c.phone.toLowerCase().includes(query),
    );
  }, [contacts, search]);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: DeviceContact }) => (
      <ContactRow contact={item} selected={selected.has(item.id)} onToggle={toggle} />
    ),
    [selected, toggle],
  );

  const runImport = useCallback(async () => {
    const chosen = contacts.filter(c => selected.has(c.id));
    setStatus('importing');

    const photos = Object.fromEntries(
      chosen.filter(c => c.thumbnailPath).map(c => [c.phone, c.thumbnailPath as string]),
    );
    if (Object.keys(photos).length > 0) savePhotos(photos);

    const result = await actions.importGuests(
      chosen.map(c => ({ name: c.name, phone: c.phone })),
    );
    setStatus('ready');

    if (!result.ok) {
      Alert.alert('Import failed', result.message);
      return;
    }

    const lines = [`Imported: ${result.importedCount}`];
    if (result.duplicateCount > 0) lines.push(`Skipped (Duplicates): ${result.duplicateCount}`);
    if (result.noNumberCount > 0) lines.push(`Skipped (No Number): ${result.noNumberCount}`);
    if (result.failedCount > 0) lines.push(`Failed: ${result.failedCount}`);

    Alert.alert('Import Complete', lines.join('\n'), [
      { text: 'OK', onPress: () => nav.goBack() },
    ]);
  }, [actions, contacts, nav, savePhotos, selected]);

  const confirmImport = useCallback(() => {
    const count = selected.size;
    Alert.alert(`Import ${count} selected contact${count === 1 ? '' : 's'}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm Import', onPress: runImport },
    ]);
  }, [runImport, selected.size]);

  if (status === 'requesting' || status === 'loading') {
    return (
      <ScreenContainer>
        <LoadingState
          message={status === 'requesting' ? 'Requesting contacts access…' : 'Loading contacts…'}
        />
      </ScreenContainer>
    );
  }

  if (status === 'denied') {
    return (
      <ScreenContainer>
        <View style={styles.deniedWrap}>
          <View style={styles.iconBox}>
            <Icon name="contacts" size={20} color={colors.primary} />
          </View>
          <AppText variant="title" color={colors.text} center>
            Contacts access needed
          </AppText>
          <AppText
            variant="callout"
            color={colors.textSecondary}
            center
            style={styles.deniedMessage}>
            To import guests from your phone, allow this app to access your contacts.
          </AppText>
          <Button label="Try Again" onPress={requestAccess} style={styles.deniedButton} />
          <Button
            label="Open Settings"
            variant="outline"
            onPress={() => Linking.openSettings()}
            style={styles.deniedButton}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false} edges={['bottom']}>
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search contacts" />
      </View>

      {loadError ? (
        <ErrorState message={loadError} onRetry={requestAccess} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="contacts"
              title={contacts.length === 0 ? 'No contacts found' : 'No matches'}
              message={
                contacts.length === 0
                  ? "We couldn't find any contacts on this device."
                  : 'Try a different search.'
              }
            />
          }
        />
      )}

      <View style={styles.footer}>
        <Button
          label={
            status === 'importing'
              ? 'Importing…'
              : `Import Selected${selected.size > 0 ? ` (${selected.size})` : ''}`
          }
          onPress={confirmImport}
          disabled={selected.size === 0}
          loading={status === 'importing'}
        />
      </View>
    </ScreenContainer>
  );
}

interface ContactRowProps {
  contact: DeviceContact;
  selected: boolean;
  onToggle: (id: string) => void;
}

const ContactRow = React.memo(({ contact, selected, onToggle }: ContactRowProps) => (
  <Pressable
    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    onPress={() => onToggle(contact.id)}>
    <Avatar name={contact.name} photoUri={contact.thumbnailPath} size={40} />
    <View style={styles.rowBody}>
      <AppText variant="label" color={colors.text} numberOfLines={1}>
        {contact.name}
      </AppText>
      {contact.phone ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {contact.phone}
        </AppText>
      ) : null}
    </View>
    <View style={[styles.checkbox, selected && styles.checkboxActive]}>
      {selected ? <Icon name="check" size={12} color={colors.textOnPrimary} strokeWidth={3} /> : null}
    </View>
  </Pressable>
));

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 20,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  deniedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  deniedMessage: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  deniedButton: {
    marginTop: spacing.sm,
  },
});
