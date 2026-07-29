/**
 * Key/value persistence for the auth session.
 *
 * React Native ships no storage API, so this is backed by
 * `@react-native-async-storage/async-storage`, resolved at runtime rather than
 * imported statically: the fallback below then keeps the JS bundle working even
 * when the native side hasn't been rebuilt since the package was added.
 *
 * The fallback is in-memory, which means the session lasts only as long as the
 * JS context — a reload logs the user out. So if a signed-in user keeps landing
 * back on onboarding, the native module isn't linked; rebuild rather than
 * chasing it through the auth code:
 *
 *   cd ios && pod install && cd .. && npm run ios    # iOS
 *   npm run android                                  # Android
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
  let failure: unknown = null;
  try {
    // Resolved at runtime on purpose: a static import would fail the whole
    // Metro bundle when the package is absent or its native side is unlinked.
    const mod = require('@react-native-async-storage/async-storage');
    const impl: StorageAdapter | undefined = mod?.default ?? mod;
    if (impl && typeof impl.getItem === 'function') {
      return impl;
    }
  } catch (error) {
    failure = error;
  }
  if (__DEV__) {
    console.warn(
      '[storage] AsyncStorage unavailable — the session will not survive a ' +
        'reload. The package is a dependency, so this almost always means the ' +
        'native module is not linked yet: rebuild the app (pod install on iOS).',
      failure,
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
