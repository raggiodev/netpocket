import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

const PREFIX = 'netpocket:';
const SYNC_EVENT = 'netpocket:storage';

function read<T>(key: string, fallback: T, validate?: (v: unknown) => v is T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Persisted state backed by `localStorage` (namespaced with `netpocket:`).
 * - Corrupt or schema-invalid values fall back to `initial` via `validate`.
 * - Instances sharing a key stay in sync inside the app and across tabs.
 * - Storage failures (quota, private mode) degrade to in-memory state.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  validate?: (v: unknown) => v is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => read(key, initial, validate));
  const skipNextWrite = useRef(false);
  const initialRef = useRef(initial);
  const validateRef = useRef(validate);

  useEffect(() => {
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: key }));
    } catch {
      /* Storage unavailable: keep working with in-memory state. */
    }
  }, [key, value]);

  const resync = useCallback(() => {
    skipNextWrite.current = true;
    setValue(read(key, initialRef.current, validateRef.current));
  }, [key]);

  useEffect(() => {
    const onLocal = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== key) return;
      const next = read(key, initialRef.current, validateRef.current);
      setValue((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
        skipNextWrite.current = true;
        return next;
      });
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFIX + key) resync();
    };
    window.addEventListener(SYNC_EVENT, onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, [key, resync]);

  return [value, setValue];
}

/** Type guard helpers for persisted values. */
export const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
export const isNumberArray = (v: unknown): v is number[] => Array.isArray(v) && v.every((x) => typeof x === 'number');
export const oneOf =
  <T extends string>(...allowed: T[]) =>
  (v: unknown): v is T =>
    typeof v === 'string' && (allowed as string[]).includes(v);
