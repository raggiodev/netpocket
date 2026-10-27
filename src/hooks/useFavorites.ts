import { useCallback, useMemo } from 'react';
import { isStringArray, useLocalStorage } from './useLocalStorage';

/** Persisted favorites (⭐) list keyed by module. */
export function useFavorites(storageKey: string) {
  const [list, setList] = useLocalStorage<string[]>(storageKey, [], isStringArray);
  const set = useMemo(() => new Set(list), [list]);

  const toggle = useCallback(
    (id: string) => {
      setList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    },
    [setList],
  );

  return { favorites: set, toggle, count: set.size };
}
