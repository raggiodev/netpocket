import type { AuditFinding, ChmodState } from '../types';

/** Bit weights for [ur, uw, ux, gr, gw, gx, or, ow, ox]. */
const WEIGHTS = [4, 2, 1, 4, 2, 1, 4, 2, 1];

export const DEFAULT_CHMOD: ChmodState = {
  suid: false,
  sgid: false,
  sticky: false,
  bits: [true, true, true, true, false, true, true, false, true],
};

export function specialDigit(s: ChmodState): number {
  return (s.suid ? 4 : 0) + (s.sgid ? 2 : 0) + (s.sticky ? 1 : 0);
}

export function classDigit(s: ChmodState, cls: 0 | 1 | 2): number {
  let d = 0;
  for (let i = 0; i < 3; i++) if (s.bits[cls * 3 + i]) d += WEIGHTS[cls * 3 + i];
  return d;
}

/** Always four digits, e.g. "0755" or "4755". */
export function toOctal(s: ChmodState): string {
  return `${specialDigit(s)}${classDigit(s, 0)}${classDigit(s, 1)}${classDigit(s, 2)}`;
}

/** Shortest canonical form used for the `chmod` command, e.g. "755" or "4755". */
export function toShortOctal(s: ChmodState): string {
  const full = toOctal(s);
  return full.startsWith('0') ? full.slice(1) : full;
}

/** `ls -l` style symbolic string including the file-type prefix. */
export function toSymbolic(s: ChmodState, typeChar = '-'): string {
  const b = s.bits;
  const exec = (x: boolean, special: boolean, on: string, off: string) => (special ? (x ? on : off) : x ? 'x' : '-');
  return (
    typeChar +
    (b[0] ? 'r' : '-') +
    (b[1] ? 'w' : '-') +
    exec(b[2], s.suid, 's', 'S') +
    (b[3] ? 'r' : '-') +
    (b[4] ? 'w' : '-') +
    exec(b[5], s.sgid, 's', 'S') +
    (b[6] ? 'r' : '-') +
    (b[7] ? 'w' : '-') +
    exec(b[8], s.sticky, 't', 'T')
  );
}

/** Parses "755", "0755", "4755" into a state. */
export function fromOctal(input: string): ChmodState | null {
  const s = input.trim();
  if (!/^[0-7]{3,4}$/.test(s)) return null;
  const digits = s.padStart(4, '0').split('').map(Number);
  const [sp, u, g, o] = digits;
  const bits: boolean[] = [];
  for (const d of [u, g, o]) bits.push((d & 4) !== 0, (d & 2) !== 0, (d & 1) !== 0);
  return { suid: (sp & 4) !== 0, sgid: (sp & 2) !== 0, sticky: (sp & 1) !== 0, bits };
}

/** Parses "rwxr-xr-x" or "-rwsr-xr-t" (optional type prefix). */
export function fromSymbolic(input: string): ChmodState | null {
  let s = input.trim();
  if (s.length === 10 && /^[-dlcbps]/.test(s)) s = s.slice(1);
  if (!/^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(s)) return null;
  const bits = [
    s[0] === 'r', s[1] === 'w', s[2] === 'x' || s[2] === 's',
    s[3] === 'r', s[4] === 'w', s[5] === 'x' || s[5] === 's',
    s[6] === 'r', s[7] === 'w', s[8] === 'x' || s[8] === 't',
  ];
  return {
    suid: s[2] === 's' || s[2] === 'S',
    sgid: s[5] === 's' || s[5] === 'S',
    sticky: s[8] === 't' || s[8] === 'T',
    bits,
  };
}

export function parsePermission(input: string): ChmodState | null {
  return fromOctal(input) ?? fromSymbolic(input);
}

/**
 * Blue Team permission auditor. Returns findings ordered by severity; keys
 * map to localized strings under `chmod.audit.*`.
 */
export function auditPermissions(s: ChmodState): AuditFinding[] {
  const [ur, uw, ux, gr, gw, gx, or, ow, ox] = s.bits;
  const findings: AuditFinding[] = [];
  const anyExec = ux || gx || ox;

  if (ur && uw && ux && gr && gw && gx && or && ow && ox && !s.sticky) {
    findings.push({ level: 'critical', key: 'fullOpen' });
  } else if (ow && !s.sticky) {
    findings.push({ level: 'critical', key: 'worldWritable' });
  }

  if (ow && s.sticky) findings.push({ level: 'info', key: 'stickyShared' });

  if (s.suid) {
    const severe = ox || gw || ow;
    findings.push({ level: severe ? 'critical' : 'warning', key: severe ? 'suidSevere' : 'suid' });
    if (!ux) findings.push({ level: 'warning', key: 'suidNoExec' });
  }
  if (s.sgid) {
    findings.push({ level: gw || ow ? 'critical' : 'warning', key: 'sgid' });
    if (!gx) findings.push({ level: 'info', key: 'sgidNoExec' });
  }

  if (gw && !ow) findings.push({ level: 'warning', key: 'groupWritable' });
  if (s.sticky && !ow && !gw) findings.push({ level: 'info', key: 'stickyNoEffect' });
  if (or && !ow) findings.push({ level: 'info', key: 'worldReadable' });
  if (!ur && !uw && !ux && !gr && !gw && !gx && !or && !ow && !ox) findings.push({ level: 'info', key: 'noAccess' });
  if (!ur && (gr || or)) findings.push({ level: 'info', key: 'ownerLessThanOthers' });

  const hasRisk = findings.some((f) => f.level === 'critical' || f.level === 'warning');
  if (!hasRisk) findings.unshift({ level: 'safe', key: anyExec ? 'hardenedExec' : 'hardened' });

  const order = { critical: 0, warning: 1, safe: 2, info: 3 } as const;
  return findings.sort((a, b) => order[a.level] - order[b.level]);
}

export const CHMOD_PRESETS = [
  { octal: '600', key: 'sshKeys' },
  { octal: '640', key: 'configLogs' },
  { octal: '644', key: 'publicFiles' },
  { octal: '750', key: 'scripts' },
  { octal: '755', key: 'executables' },
  { octal: '1777', key: 'tmpSticky' },
] as const;
