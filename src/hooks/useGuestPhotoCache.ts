/**
 * Local-only cache of imported-contact photos, keyed by phone number.
 *
 * The backend's Guest model has no photo column, so a photo picked up during
 * "Import from Contacts" can only live on this device — it does not sync to
 * other members viewing the same wedding, and is lost on reinstall.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { readJson, writeJson } from '@services';
import { phoneMatchKey } from '@utils';

const STORAGE_KEY = 'guestPhotoCache.v1';

type PhotoMap = Record<string, string>;

export interface GuestPhotoCache {
  /** Local photo URI for a guest's phone number, if one was imported. */
  getPhoto: (phone: string) => string | undefined;
  /** Merges new phone → photo-URI entries in, e.g. right after an import. */
  savePhotos: (entries: Record<string, string>) => void;
}

export function useGuestPhotoCache(): GuestPhotoCache {
  const [map, setMap] = useState<PhotoMap>({});
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    readJson<PhotoMap>(STORAGE_KEY).then(stored => {
      if (mounted.current && stored) setMap(stored);
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  const getPhoto = useCallback((phone: string) => map[phoneMatchKey(phone)], [map]);

  const savePhotos = useCallback((entries: Record<string, string>) => {
    setMap(prev => {
      const next = { ...prev };
      for (const [phone, uri] of Object.entries(entries)) {
        const key = phoneMatchKey(phone);
        if (key) next[key] = uri;
      }
      writeJson(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { getPhoto, savePhotos };
}
