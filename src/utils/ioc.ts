/**
 * Indicator-of-Compromise defanging / refanging.
 *
 * Defanging makes URLs, domains and IPv4 addresses non-clickable and
 * non-resolvable so they can be pasted safely into tickets, chats and
 * reports. Refanging restores the original, actionable indicator for use in
 * blocklists, SIEM queries or sandbox detonation.
 */

const IPV4_STRICT = /\b((?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))\.((?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))\.((?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))\.((?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))\b/g;

/** Hostname with at least one label and an alphabetic TLD (2–63 chars). */
const DOMAIN = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:xn--[a-z0-9-]{1,59}|[a-z]{2,63})\b/gi;

export function defang(input: string): string {
  let s = input;
  s = s.replace(/\bhttps:\/\//gi, 'hxxps[://]');
  s = s.replace(/\bhttp:\/\//gi, 'hxxp[://]');
  s = s.replace(/\bftp:\/\//gi, 'fxp[://]');
  s = s.replace(IPV4_STRICT, '$1[.]$2[.]$3[.]$4');
  s = s.replace(DOMAIN, (m) => m.replace(/\./g, '[.]'));
  return s;
}

export function refang(input: string): string {
  let s = input;
  s = s.replace(/\bh(?:xx|XX|\[xx\]|tt)p(s?)(?=\[:\/\/\]|\[:\]\/\/|:\/\/|\[:\/\]|\(:\/\/\))/g, 'http$1');
  s = s.replace(/\bhxxp(s?)\b/gi, 'http$1');
  s = s.replace(/\bfxp(?=\[:\/\/\]|:\/\/|\[:\]\/\/)/gi, 'ftp');
  s = s.replace(/\[:\/\/\]|\(:\/\/\)|\{:\/\/\}/g, '://');
  s = s.replace(/\[:\/\]/g, ':/');
  s = s.replace(/\[:\]|\(:\)/g, ':');
  s = s.replace(/\[\.\]|\(\.\)|\{\.\}|\[dot\]|\(dot\)|\{dot\}|\s\[dot\]\s/gi, '.');
  s = s.replace(/\[@\]|\(@\)|\[at\]|\(at\)/gi, '@');
  s = s.replace(/\[\/\]/g, '/');
  return s;
}
