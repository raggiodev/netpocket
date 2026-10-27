/**
 * Bitwise IPv4 / CIDR arithmetic. All values are handled as unsigned 32-bit
 * integers (`>>> 0`) to avoid JavaScript's signed bitwise pitfalls.
 */

export type IpScope =
  | 'private'
  | 'loopback'
  | 'linkLocal'
  | 'cgnat'
  | 'multicast'
  | 'thisNetwork'
  | 'documentation'
  | 'benchmark'
  | 'reserved'
  | 'broadcast'
  | 'public';

export interface ScopeInfo {
  scope: IpScope;
  /** Matching reserved block, e.g. "192.168.0.0/16". */
  block: string;
  /** Governing RFC, e.g. "RFC 1918". */
  rfc: string;
}

export interface SubnetInfo {
  ip: number;
  cidr: number;
  mask: number;
  wildcard: number;
  network: number;
  broadcast: number;
  firstHost: number;
  lastHost: number;
  totalAddresses: number;
  usableHosts: number;
  /** Special-case flag for /31 (RFC 3021) and /32 host routes. */
  mode: 'standard' | 'p2p' | 'host';
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
}

const OCTET = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

/** Strict dotted-quad parser. Rejects leading zeros (octal ambiguity). */
export function parseIPv4(input: string): number | null {
  const parts = input.trim().split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!OCTET.test(p)) return null;
    n = n * 256 + Number(p);
  }
  return n >>> 0;
}

/** Accepts "10.0.0.1" or "10.0.0.1/24". Returns null on any malformed part. */
export function parseIPv4WithCidr(input: string): { ip: number; cidr: number | null } | null {
  const trimmed = input.trim();
  const slash = trimmed.indexOf('/');
  if (slash === -1) {
    const ip = parseIPv4(trimmed);
    return ip === null ? null : { ip, cidr: null };
  }
  const ip = parseIPv4(trimmed.slice(0, slash));
  const prefixRaw = trimmed.slice(slash + 1);
  if (ip === null || !/^\d{1,2}$/.test(prefixRaw)) return null;
  const cidr = Number(prefixRaw);
  if (cidr < 0 || cidr > 32) return null;
  return { ip, cidr };
}

export function intToIPv4(n: number): string {
  const v = n >>> 0;
  return `${v >>> 24}.${(v >>> 16) & 255}.${(v >>> 8) & 255}.${v & 255}`;
}

export function cidrToMask(cidr: number): number {
  if (cidr <= 0) return 0;
  if (cidr >= 32) return 0xffffffff;
  return (0xffffffff << (32 - cidr)) >>> 0;
}

export function ipClass(ip: number): SubnetInfo['ipClass'] {
  const first = ip >>> 24;
  if (first < 128) return 'A';
  if (first < 192) return 'B';
  if (first < 224) return 'C';
  if (first < 240) return 'D';
  return 'E';
}

export function calculateSubnet(ip: number, cidr: number): SubnetInfo {
  const mask = cidrToMask(cidr);
  const wildcard = ~mask >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalAddresses = 2 ** (32 - cidr);

  let firstHost: number;
  let lastHost: number;
  let usableHosts: number;
  let mode: SubnetInfo['mode'];

  if (cidr === 32) {
    firstHost = network;
    lastHost = network;
    usableHosts = 1;
    mode = 'host';
  } else if (cidr === 31) {
    // RFC 3021: both addresses are usable on point-to-point links.
    firstHost = network;
    lastHost = broadcast;
    usableHosts = 2;
    mode = 'p2p';
  } else {
    firstHost = (network + 1) >>> 0;
    lastHost = (broadcast - 1) >>> 0;
    usableHosts = totalAddresses - 2;
    mode = 'standard';
  }

  return { ip, cidr, mask, wildcard, network, broadcast, firstHost, lastHost, totalAddresses, usableHosts, mode, ipClass: ipClass(ip) };
}

/** True when `target` lies inside `network/cidr`. */
export function isInSubnet(target: number, network: number, cidr: number): boolean {
  const mask = cidrToMask(cidr);
  return ((target & mask) >>> 0) === ((network & mask) >>> 0);
}

interface ReservedBlock extends ScopeInfo {
  base: number;
  prefix: number;
}

function block(cidrNotation: string, scope: IpScope, rfc: string): ReservedBlock {
  const [addr, prefix] = cidrNotation.split('/');
  return { base: parseIPv4(addr) as number, prefix: Number(prefix), scope, block: cidrNotation, rfc };
}

/** Ordered from most to least specific; first match wins. */
const RESERVED: ReservedBlock[] = [
  block('255.255.255.255/32', 'broadcast', 'RFC 919'),
  block('0.0.0.0/8', 'thisNetwork', 'RFC 1122'),
  block('10.0.0.0/8', 'private', 'RFC 1918'),
  block('172.16.0.0/12', 'private', 'RFC 1918'),
  block('192.168.0.0/16', 'private', 'RFC 1918'),
  block('127.0.0.0/8', 'loopback', 'RFC 1122'),
  block('169.254.0.0/16', 'linkLocal', 'RFC 3927'),
  block('100.64.0.0/10', 'cgnat', 'RFC 6598'),
  block('192.0.2.0/24', 'documentation', 'RFC 5737'),
  block('198.51.100.0/24', 'documentation', 'RFC 5737'),
  block('203.0.113.0/24', 'documentation', 'RFC 5737'),
  block('198.18.0.0/15', 'benchmark', 'RFC 2544'),
  block('192.0.0.0/24', 'reserved', 'RFC 6890'),
  block('224.0.0.0/4', 'multicast', 'RFC 5771'),
  block('240.0.0.0/4', 'reserved', 'RFC 1112'),
];

export function classifyIPv4(ip: number): ScopeInfo {
  for (const r of RESERVED) {
    if (isInSubnet(ip, r.base, r.prefix)) return { scope: r.scope, block: r.block, rfc: r.rfc };
  }
  return { scope: 'public', block: '0.0.0.0/0', rfc: 'IANA' };
}

/** Returns the 32 bits of an address as an array of 0/1 (MSB first). */
export function toBits(ip: number): number[] {
  const bits: number[] = new Array(32);
  for (let i = 0; i < 32; i++) bits[i] = (ip >>> (31 - i)) & 1;
  return bits;
}

export function formatCount(n: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(n);
}
