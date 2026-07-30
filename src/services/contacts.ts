/**
 * Device contacts access for the Guests "Import from Contacts" flow. Kept
 * separate from the picker/import UI so the native module surface (and any
 * future swap of it) stays in one place.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import Contacts, { type Contact } from 'react-native-contacts';

export type ContactsPermissionStatus = 'granted' | 'denied';

export interface DeviceContact {
  id: string;
  name: string;
  /** First phone number on the contact, in whatever format the device stores it. */
  phone: string;
  thumbnailPath: string | null;
}

export async function requestContactsAccess(): Promise<ContactsPermissionStatus> {
  if (Platform.OS === 'android') {
    const permission = PermissionsAndroid.PERMISSIONS.READ_CONTACTS;
    if (await PermissionsAndroid.check(permission)) return 'granted';

    const requested = await PermissionsAndroid.request(permission);
    return requested === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
  }

  const current = await Contacts.checkPermission();
  if (current === 'authorized' || current === 'limited') return 'granted';

  const requested = await Contacts.requestPermission();
  return requested === 'authorized' || requested === 'limited' ? 'granted' : 'denied';
}

const contactName = (c: Contact): string =>
  (c.displayName || `${c.givenName ?? ''} ${c.familyName ?? ''}`).trim();

/** All device contacts with a name, mapped to the shape the picker needs. */
export async function getDeviceContacts(): Promise<DeviceContact[]> {
  const raw = await Contacts.getAll();
  return raw
    .map(c => ({
      id: c.recordID,
      name: contactName(c),
      // A single contact stored without a phone list must not fail the whole read.
      phone: c.phoneNumbers?.[0]?.number ?? '',
      thumbnailPath: c.hasThumbnail && c.thumbnailPath ? c.thumbnailPath : null,
    }))
    .filter(c => c.name.length > 0);
}
