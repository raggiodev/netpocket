/**
 * Local, dependency-free encoders/decoders and format detection used by the
 * Inspector module. All functions are pure and synchronous.
 */

const encoder = new TextEncoder();

export type DecodeResult = { ok: true; value: string } | { ok: false; error: DecodeError };
export type DecodeError = 'invalidBase64' | 'invalidUrl' | 'invalidHex' | 'invalidBinary' | 'invalidUtf8' | 'empty';

function decodeUtf8Strict(bytes: Uint8Array): DecodeResult {
  try {
    const value = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, value };
  } catch {
    return { ok: false, error: 'invalidUtf8' };
  }
}

/* ------------------------------------------------------------- Base64 --- */

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = (() => {
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < B64_ALPHABET.length; i++) table[B64_ALPHABET.charCodeAt(i)] = i;
  return table;
})();

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64_ALPHABET[(n >> 18) & 63] + B64_ALPHABET[(n >> 12) & 63] + B64_ALPHABET[(n >> 6) & 63] + B64_ALPHABET[n & 63];
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const n = bytes[i] << 16;
    out += B64_ALPHABET[(n >> 18) & 63] + B64_ALPHABET[(n >> 12) & 63] + '==';
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64_ALPHABET[(n >> 18) & 63] + B64_ALPHABET[(n >> 12) & 63] + B64_ALPHABET[(n >> 6) & 63] + '=';
  }
  return out;
}

/** Decodes standard or URL-safe Base64 (padding optional, whitespace ignored). */
export function base64ToBytes(input: string): Uint8Array | null {
  let s = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  s = s.replace(/=+$/, '');
  if (s.length === 0 || s.length % 4 === 1) return null;
  const out = new Uint8Array(Math.floor((s.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let idx = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    const v = code < 128 ? B64_LOOKUP[code] : -1;
    if (v < 0) return null;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[idx++] = (buffer >> bits) & 0xff;
    }
  }
  return out.subarray(0, idx);
}

export function base64Encode(input: string): string {
  return bytesToBase64(encoder.encode(input));
}

export function base64Decode(input: string): DecodeResult {
  if (!input.trim()) return { ok: false, error: 'empty' };
  const bytes = base64ToBytes(input);
  if (!bytes) return { ok: false, error: 'invalidBase64' };
  return decodeUtf8Strict(bytes);
}

/* ---------------------------------------------------------------- URL --- */

export function urlEncode(input: string): string {
  return encodeURIComponent(input);
}

export function urlDecode(input: string): DecodeResult {
  if (!input) return { ok: false, error: 'empty' };
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: 'invalidUrl' };
  }
}

/* ---------------------------------------------------------------- Hex --- */

export function hexEncode(input: string, spaced: boolean): string {
  const bytes = encoder.encode(input);
  const parts: string[] = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) parts[i] = bytes[i].toString(16).padStart(2, '0');
  return parts.join(spaced ? ' ' : '');
}

/** Normalizes common hex notations: "0x41 0x42", "\x41\x42", "41:42", "41-42", "4142". */
export function normalizeHex(input: string): string {
  return input
    .replace(/0x/gi, '')
    .replace(/\\x/gi, '')
    .replace(/[\s:,\-]/g, '');
}

export function hexToBytes(input: string): Uint8Array | null {
  const s = normalizeHex(input);
  if (s.length === 0 || s.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(s)) return null;
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function hexDecode(input: string): DecodeResult {
  if (!input.trim()) return { ok: false, error: 'empty' };
  const bytes = hexToBytes(input);
  if (!bytes) return { ok: false, error: 'invalidHex' };
  return decodeUtf8Strict(bytes);
}

/* ------------------------------------------------------------- Binary --- */

export function binaryEncode(input: string): string {
  const bytes = encoder.encode(input);
  const parts: string[] = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) parts[i] = bytes[i].toString(2).padStart(8, '0');
  return parts.join(' ');
}

export function binaryToBytes(input: string): Uint8Array | null {
  const s = input.replace(/[\s,]/g, '');
  if (s.length === 0 || s.length % 8 !== 0 || !/^[01]+$/.test(s)) return null;
  const out = new Uint8Array(s.length / 8);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 8, i * 8 + 8), 2);
  return out;
}

export function binaryDecode(input: string): DecodeResult {
  if (!input.trim()) return { ok: false, error: 'empty' };
  const bytes = binaryToBytes(input);
  if (!bytes) return { ok: false, error: 'invalidBinary' };
  return decodeUtf8Strict(bytes);
}

/* --------------------------------------------------------- Detection --- */

export type DetectionKind = 'base64' | 'url' | 'hex' | 'binary' | 'iocs' | 'defanged';

export interface Detection {
  kind: DetectionKind;
  /** Replacement value when the user accepts the suggestion. */
  value: string;
  /** Number of indicators found (for `iocs`). */
  count?: number;
}

/** Ratio of printable characters (letters, digits, punctuation, whitespace). */
export function printableRatio(text: string): number {
  if (!text.length) return 0;
  let printable = 0;
  let total = 0;
  for (const ch of text) {
    total++;
    const c = ch.codePointAt(0) ?? 0;
    if (c === 0x09 || c === 0x0a || c === 0x0d || (c >= 0x20 && c < 0x7f) || (c >= 0xa0 && c !== 0xfffd)) printable++;
  }
  return total === 0 ? 0 : printable / total;
}

const IPV4_RE = /\b(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\b/g;
const URL_RE = /\b(?:https?|ftp):\/\/[^\s"'<>]+/gi;
const DEFANG_MARKERS_RE = /hxxps?|\[\.\]|\(\.\)|\[:\/\/\]|\[:\]|\[dot\]|\[@\]/i;

export function countIocs(text: string): number {
  const urls = text.match(URL_RE) ?? [];
  const withoutUrls = text.replace(URL_RE, ' ');
  const ips = withoutUrls.match(IPV4_RE) ?? [];
  return urls.length + ips.length;
}

/**
 * Inspects an input string and returns ordered, actionable suggestions.
 * Each decoder only triggers if the decoded result is valid UTF-8 and
 * predominantly printable, which keeps false positives (e.g. hashes or
 * plain words that happen to be valid Base64) out of the banner.
 */
export function detectFormats(raw: string): Detection[] {
  const input = raw.trim();
  const found: Detection[] = [];
  if (input.length < 4) return found;

  const compact = input.replace(/\s+/g, '');

  // Binary first: a string of 0/1 is also valid hex and Base64.
  if (/^[01\s]+$/.test(input) && compact.length >= 8 && compact.length % 8 === 0) {
    const r = binaryDecode(input);
    if (r.ok && printableRatio(r.value) >= 0.9) found.push({ kind: 'binary', value: r.value });
  }

  const looksHex = /^(?:(?:0x|\\x)?[0-9a-fA-F]{2}[\s:,\-]*)+$/.test(input);
  if (found.length === 0 && looksHex && normalizeHex(input).length >= 8) {
    const r = hexDecode(input);
    if (r.ok && printableRatio(r.value) >= 0.9) found.push({ kind: 'hex', value: r.value });
  }

  if (
    found.length === 0 &&
    compact.length >= 8 &&
    /^[A-Za-z0-9+/\-_]+={0,2}$/.test(compact) &&
    (compact.length % 4 === 0 || !compact.includes('='))
  ) {
    const r = base64Decode(compact);
    if (r.ok && r.value.length > 0 && printableRatio(r.value) >= 0.92) found.push({ kind: 'base64', value: r.value });
  }

  if (/%[0-9A-Fa-f]{2}/.test(input)) {
    const r = urlDecode(input);
    if (r.ok && r.value !== input) found.push({ kind: 'url', value: r.value });
  }

  if (DEFANG_MARKERS_RE.test(input)) {
    found.push({ kind: 'defanged', value: input });
  } else {
    const count = countIocs(input);
    if (count > 0) found.push({ kind: 'iocs', value: input, count });
  }

  return found;
}

export function byteLength(input: string): number {
  return encoder.encode(input).length;
}
