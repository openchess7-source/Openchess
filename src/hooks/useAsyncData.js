import { useCallback, useEffect, useState } from 'react';

// Standard loading/error/data/retry shape (spec §81 "API Error UX", §71
// "No Silent Fallbacks") — a failed fetch renders a real error state with
// a retry button, never an indefinite spinner and never fake data.
export function useAsyncData(fetcher, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    fetcher()
      .then((result) => setState({ status: 'success', data: result, error: null }))
      .catch((err) => setState({ status: 'error', data: null, error: err?.message || 'Something went wrong' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, retry: load };
}
