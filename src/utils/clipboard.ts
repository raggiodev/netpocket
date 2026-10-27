import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { Haptics } from '@capacitor/haptics';

/**
 * Clipboard + haptics bridge.
 * Native (Capacitor/Android): uses the local Clipboard and Haptics plugins,
 * which do not require any network permission.
 * Web / PWA: uses the async Clipboard API with a legacy execCommand fallback.
 */

const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export function haptic(durationMs = 35): void {
  if (isNative()) {
    Haptics.vibrate({ duration: durationMs }).catch(() => undefined);
    return;
  }
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(durationMs);
  }
}

function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

export async function writeClipboard(text: string): Promise<boolean> {
  if (isNative()) {
    try {
      await Clipboard.write({ string: text });
      return true;
    } catch {
      return legacyCopy(text);
    }
  }
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return legacyCopy(text);
    }
  }
  return legacyCopy(text);
}

/** Returns clipboard text, `''` when empty, or `null` when access is denied. */
export async function readClipboard(): Promise<string | null> {
  if (isNative()) {
    try {
      const { value } = await Clipboard.read();
      return typeof value === 'string' ? value : '';
    } catch {
      return null;
    }
  }
  if (navigator.clipboard?.readText) {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return null;
    }
  }
  return null;
}
