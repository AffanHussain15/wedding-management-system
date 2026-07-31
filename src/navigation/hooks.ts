import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@store';

import type { RootStackParamList } from './types';

/** Typed navigation for the root stack. */
export const useAppNavigation = () =>
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();

/** Which of the root navigator's mutually exclusive trees is live. */
export type RootTree = 'loading' | 'guest' | 'profileError' | 'setup' | 'app';

/**
 * Derives the live tree from auth state.
 *
 * Deliberately the only place this is decided: `RootNavigator` renders the tree
 * and `App` keys the `NavigationContainer` on it, and the two must agree — see
 * the note in `RootNavigator` for why the container has to be re-keyed at all.
 */
export function useRootTree(): RootTree {
  const {
    ready,
    isAuthenticated,
    needsWeddingSetup,
    activeWeddingId,
    profileError,
    profileLoaded,
  } = useAuth();

  // Hold the splash until the stored session has been read, so an already
  // signed-in user never sees the login screen flash by.
  if (!ready) return 'loading';
  if (!isAuthenticated) return 'guest';

  // Signed in, but `GET /users/me` hasn't answered yet and there's no
  // remembered wedding to fall back on. Keep waiting: treating unknown
  // memberships as "none" would drop an existing couple into the setup wizard
  // for as long as the request takes.
  if (!profileLoaded && !activeWeddingId) return 'loading';

  // Couldn't load which weddings they belong to, and no remembered one either.
  // Offer a retry rather than dropping into the setup wizard, which would
  // invite them to create a duplicate wedding.
  if (profileError && !activeWeddingId) return 'profileError';

  return needsWeddingSetup || !activeWeddingId ? 'setup' : 'app';
}
