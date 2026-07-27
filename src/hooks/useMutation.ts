/**
 * Write-request hook. `run` never throws — it resolves to a tagged result — so
 * screens can branch on success without a try/catch in every handler and
 * without risking an unhandled rejection from an onPress.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, isApiError } from '@services';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export interface MutationState {
  loading: boolean;
  error: ApiError | null;
  /** Per-field messages from a 400 VALIDATION_ERROR, for inline form errors. */
  fieldErrors: Record<string, string>;
}

export interface Mutation<TArgs extends unknown[], T> extends MutationState {
  run: (...args: TArgs) => Promise<MutationResult<T>>;
  reset: () => void;
}

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;
  return new ApiError({
    status: 0,
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'Something went wrong.',
  });
}

export function useMutation<TArgs extends unknown[], T>(
  mutator: (...args: TArgs) => Promise<T>,
): Mutation<TArgs, T> {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
    fieldErrors: {},
  });

  const mounted = useRef(true);
  const mutatorRef = useRef(mutator);
  mutatorRef.current = mutator;
  // Guards against a double-tap firing the same write twice.
  const inFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (...args: TArgs): Promise<MutationResult<T>> => {
    if (inFlight.current) {
      return {
        ok: false,
        error: new ApiError({
          status: 0,
          code: 'INTERNAL_ERROR',
          message: 'A save is already in progress.',
        }),
      };
    }
    inFlight.current = true;
    setState({ loading: true, error: null, fieldErrors: {} });

    try {
      const data = await mutatorRef.current(...args);
      if (mounted.current) {
        setState({ loading: false, error: null, fieldErrors: {} });
      }
      return { ok: true, data };
    } catch (error) {
      const apiError = toApiError(error);
      if (mounted.current) {
        setState({
          loading: false,
          error: apiError,
          fieldErrors: apiError.fieldErrors,
        });
      }
      return { ok: false, error: apiError };
    } finally {
      inFlight.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, fieldErrors: {} });
  }, []);

  return { ...state, run, reset };
}
