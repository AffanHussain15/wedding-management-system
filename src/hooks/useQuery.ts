/**
 * Minimal request-state hook. Deliberately not a cache — there is no
 * react-query in this project — but it does the three things every screen
 * needs: track loading/error/data, abort in-flight work on unmount or when the
 * inputs change, and expose a pull-to-refresh path that doesn't blank the UI.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, isApiError } from '@services';

export interface QueryState<T> {
  data: T | null;
  error: ApiError | null;
  /** True only for the initial load, so lists don't flash on refetch. */
  loading: boolean;
  /** True while a refetch runs over already-rendered data. */
  refreshing: boolean;
}

export interface QueryResult<T> extends QueryState<T> {
  refetch: () => Promise<void>;
  /** Replaces the local copy without a round trip, for optimistic updates. */
  setData: (updater: T | ((current: T | null) => T | null)) => void;
}

export interface QueryOptions {
  /** When false the fetcher never runs — use for calls that need an id first. */
  enabled?: boolean;
}

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;
  return new ApiError({
    status: 0,
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'Something went wrong.',
  });
}

/**
 * `fetcher` receives an AbortSignal and must pass it to the API call so a
 * superseded request is cancelled. `deps` behaves like a useEffect dep array:
 * a change re-runs the fetch.
 */
export function useQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  options: QueryOptions = {},
): QueryResult<T> {
  const { enabled = true } = options;

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    error: null,
    loading: enabled,
    refreshing: false,
  });

  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);
  // Held in a ref so `run` stays stable across renders even when the caller
  // passes an inline arrow function (which they almost always do).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const hasData = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);

  const run = useCallback(async (isRefresh: boolean) => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;

    setState(prev => ({
      ...prev,
      loading: isRefresh ? prev.loading : !hasData.current,
      refreshing: isRefresh,
      error: null,
    }));

    try {
      const data = await fetcherRef.current(next.signal);
      if (!mounted.current || next.signal.aborted) return;
      hasData.current = true;
      setState({ data, error: null, loading: false, refreshing: false });
    } catch (error) {
      // A cancelled request is not a failure — a newer one is already running.
      if (next.signal.aborted || (error as Error)?.name === 'AbortError') return;
      if (!mounted.current) return;
      setState(prev => ({
        ...prev,
        error: toApiError(error),
        loading: false,
        refreshing: false,
      }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false, refreshing: false });
      hasData.current = false;
      return;
    }
    // `run` captures its own failures into state, so it never rejects.
    run(false);
    // `deps` is the caller's dependency list; spreading it is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  const refetch = useCallback(async () => {
    if (enabled) await run(true);
  }, [enabled, run]);

  const setData = useCallback(
    (updater: T | ((current: T | null) => T | null)) => {
      setState(prev => ({
        ...prev,
        data:
          typeof updater === 'function'
            ? (updater as (current: T | null) => T | null)(prev.data)
            : updater,
      }));
    },
    [],
  );

  return { ...state, refetch, setData };
}
