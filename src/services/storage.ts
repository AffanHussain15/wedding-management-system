/**
 * Key/value persistence for the auth session.
 *
 * React Native ships no storage API, and adding a native module would force a
 * rebuild, so this resolves `@react-native-async-storage/async-storage`
 * lazily and falls back to an in-memory store when it isn't installed. The
 * app therefore runs today; installing the package upgrades it to real
 * persistence with no code change:
 *
 *   npm i @react-native-async-storage/async-storage
 *   cd ios && pod install    # iOS only
 *
 * Until then the session lives only for the lifetime of the JS context, i.e.
 * the user is logged out on every cold start.
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const memoryStore = new Map<string, string>();

const memoryAdapter: StorageAdapter = {
  getItem: async key => memoryStore.get(key) ?? null,
  setItem: async (key, value) => {
    memoryStore.set(key, value);
  },
  removeItem: async key => {
    memoryStore.delete(key);
  },
};

function resolveAdapter(): StorageAdapter {
  try {
    // Resolved at runtime on purpose: a static import of a package that may not
    // be installed would fail the Metro bundle outright.
    const mod = require('@react-native-async-storage/async-storage');
    const impl: StorageAdapter | undefined = mod?.default ?? mod;
    if (impl && typeof impl.getItem === 'function') {
      return impl;
    }
  } catch {
    // Package not installed — fall through to the in-memory adapter.
  }
  if (__DEV__) {
    console.warn(
      '[storage] @react-native-async-storage/async-storage not found; ' +
        'the session will not survive an app restart.',
    );
  }
  return memoryAdapter;
}

let adapter: StorageAdapter | null = null;

function getAdapter(): StorageAdapter {
  if (!adapter) {
    adapter = resolveAdapter();
  }
  return adapter;
}

/** Replaces the backing store — used by tests, or to plug in a secure store. */
export function setStorageAdapter(next: StorageAdapter): void {
  adapter = next;
}

/** True when values survive an app restart. */
export function isPersistent(): boolean {
  return getAdapter() !== memoryAdapter;
}

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await getAdapter().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // Corrupt payload or unavailable store — treat as absent rather than
    // crashing app startup.
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await getAdapter().setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort; the in-memory session still works.
  }
}

export async function readString(key: string): Promise<string | null> {
  try {
    return await getAdapter().getItem(key);
  } catch {
    return null;
  }
}

export async function writeString(key: string, value: string): Promise<void> {
  try {
    await getAdapter().setItem(key, value);
  } catch {
    // Best-effort, as above.
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await getAdapter().removeItem(key);
  } catch {
    // Best-effort, as above.
  }
}
