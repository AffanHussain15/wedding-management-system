/**
 * Finishing the wedding wizard has to end on the app tree and stay there.
 *
 * `GET /users/me` is the only way the app discovers memberships, and the
 * backend can take 40-60s to answer from an idle instance — so a read issued
 * before `POST /weddings` can land well after it, reporting no memberships. If
 * that response is applied it erases the new wedding and unsets
 * `activeWeddingId`, which flips RootNavigator's tree back to `setup` and
 * remounts the wizard at step 1 instead of showing the home screen.
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

// Ships untranspiled TS and is pulled in transitively via `@services`; nothing
// in this test touches contacts.
jest.mock('react-native-contacts', () => ({}));

import { AuthProvider, useAuth } from '../src/store';

type Auth = ReturnType<typeof useAuth>;

const USER = {
  id: 'u1',
  fullName: 'Test User',
  email: 't@example.com',
  isEmailVerified: false,
};

const WEDDING = { id: 'w1', name: 'Ayesha & Bilal', role: 'OWNER' as const };

function envelope(data: unknown): string {
  return JSON.stringify({
    success: true,
    data,
    meta: { timestamp: '', requestId: 'r' },
  });
}

function res(status: number, body: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  } as unknown as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => {
    resolve = r;
  });
  return { promise, resolve };
}

/** Mirrors RootNavigator's tree selection (RootNavigator.tsx:65-90). */
function modeOf(a: Auth): string {
  if (!a.ready) return 'splash';
  if (a.isAuthenticated && !a.profileLoaded && !a.activeWeddingId) return 'splash';
  if (a.isAuthenticated && a.profileError && !a.activeWeddingId) return 'profileError';
  if (!a.isAuthenticated) return 'guest';
  return a.needsWeddingSetup || !a.activeWeddingId
    ? `setup(weddings=${a.weddings.length})`
    : 'app';
}

let auth: Auth;
let modes: string[];

function Probe(): null {
  auth = useAuth();
  const mode = modeOf(auth);
  if (modes[modes.length - 1] !== mode) modes.push(mode);
  return null;
}

/** Profile reads answer from this queue; a deferred entry stays pending. */
let meResponses: Array<Response | Promise<Response>>;
let meCalls: number;

function mountAndSignUp() {
  return (async () => {
    await act(async () => {
      ReactTestRenderer.create(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
    });
    await act(async () => {
      await auth.register({
        fullName: USER.fullName,
        email: USER.email,
        password: 'Password1!',
      } as Parameters<Auth['register']>[0]);
    });
  })();
}

beforeEach(() => {
  modes = [];
  meCalls = 0;
  meResponses = [];

  globalThis.fetch = jest.fn(async (input: unknown) => {
    const url = String(input);
    if (url.includes('/auth/register')) {
      return res(200, envelope({ user: USER, accessToken: 'a1', refreshToken: 'r1' }));
    }
    if (url.includes('/users/me')) {
      const queued = meResponses[meCalls];
      meCalls += 1;
      return queued ?? res(200, envelope({ ...USER, weddings: [] }));
    }
    if (url.includes('/weddings')) return res(200, envelope(WEDDING));
    throw new Error(`unexpected fetch: ${url}`);
  }) as unknown as typeof fetch;
});

test('signup issues a single profile read', async () => {
  await mountAndSignUp();

  // Two concurrent reads mean one can answer late and roll the other back.
  expect(meCalls).toBe(1);
  expect(modeOf(auth)).toBe('setup(weddings=0)');
});

test('a profile read that predates the new wedding cannot undo it', async () => {
  await mountAndSignUp();
  expect(modeOf(auth)).toBe('setup(weddings=0)');

  // A read is in flight when the user taps "Finish Setup" — it left before the
  // wedding existed, and the sleeping instance answers it much later.
  const lagging = deferred<Response>();
  meResponses[1] = lagging.promise;
  let refreshed: Promise<void>;
  await act(async () => {
    refreshed = auth.refreshProfile();
  });

  await act(async () => {
    await auth.completeWeddingSetup(WEDDING);
  });
  expect(modeOf(auth)).toBe('app');

  await act(async () => {
    lagging.resolve(res(200, envelope({ ...USER, weddings: [] })));
    await refreshed;
  });

  expect(modeOf(auth)).toBe('app');
  expect(auth.activeWeddingId).toBe(WEDDING.id);
  expect(auth.weddings.map(w => w.id)).toEqual([WEDDING.id]);
  // The wizard tree is entered once and never returned to — a second entry is
  // the remount that restarts the wizard at step 1.
  expect(modes.filter(m => m.startsWith('setup'))).toHaveLength(1);
  expect(modes[modes.length - 1]).toBe('app');
});

test('losing the last membership still returns to the wizard', async () => {
  await mountAndSignUp();
  await act(async () => {
    await auth.completeWeddingSetup(WEDDING);
  });
  expect(modeOf(auth)).toBe('app');

  // Removed from the wedding elsewhere: a *later* read must still be applied,
  // or the app would keep a membership the user no longer has.
  await act(async () => {
    await auth.refreshProfile();
  });

  expect(modeOf(auth)).toBe('setup(weddings=0)');
  expect(auth.activeWeddingId).toBeNull();
});
