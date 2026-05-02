'use client';
import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query) {
  const subscribe = useCallback((onStoreChange) => {
    const m = window.matchMedia(query);
    const handler = () => onStoreChange();
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, [query]);

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
