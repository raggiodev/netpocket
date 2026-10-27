/**
 * Offline self-test for NetPocket's pure utilities.
 * Cross-checks the hand-written hash implementations against Node's native
 * OpenSSL bindings and validates codecs, IOC transforms, subnetting and chmod.
 *
 * Run: npm run test:crypto   (Node >= 22.6 with --experimental-strip-types)
 */
import { createHash, randomBytes } from 'node:crypto';
import { md5, sha1, sha256, toUtf8Bytes } from '../src/utils/hash.ts';
import {
  base64Decode, base64Encode, binaryDecode, binaryEncode, detectFormats, hexDecode, hexEncode, urlDecode, urlEncode,
} from '../src/utils/encoding.ts';
import { defang, refang } from '../src/utils/ioc.ts';
import { calculateSubnet, classifyIPv4, intToIPv4, isInSubnet, parseIPv4 } from '../src/utils/network.ts';
import { auditPermissions, fromOctal, fromSymbolic, toOctal, toSymbolic } from '../src/utils/chmod.ts';

let failures = 0;
let passes = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passes++;
  else {
    failures++;
    console.error(`FAIL ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  }
}

const node = (alg: string, b: Uint8Array) => createHash(alg).update(b).digest('hex');

// --- Hashes: fixed vectors + boundary lengths + random fuzzing.
const vectors = ['', 'abc', 'The quick brown fox jumps over the lazy dog', 'ñandú — 🔒 offline', 'a'.repeat(1000)];
for (let len = 50; len <= 130; len++) vectors.push('x'.repeat(len));
for (const v of vectors) {
  const b = toUtf8Bytes(v);
  check(`md5(${v.length})`, md5(b), node('md5', b));
  check(`sha1(${v.length})`, sha1(b), node('sha1', b));
  check(`sha256(${v.length})`, sha256(b), node('sha256', b));
}
for (let i = 0; i < 200; i++) {
  const b = new Uint8Array(randomBytes(Math.floor(Math.random() * 600)));
  check(`md5 rnd`, md5(b), node('md5', b));
  check(`sha1 rnd`, sha1(b), node('sha1', b));
  check(`sha256 rnd`, sha256(b), node('sha256', b));
}

// --- Codecs
const sample = 'Hola, señor! <script>alert(1)</script> 🔐';
check('b64 enc', base64Encode(sample), Buffer.from(sample, 'utf8').toString('base64'));
check('b64 roundtrip', base64Decode(base64Encode(sample)), { ok: true, value: sample });
check('b64 urlsafe', base64Decode('aGVsbG8_d29ybGQ'), { ok: true, value: 'hello?world' });
check('b64 invalid', base64Decode('###').ok, false);
check('url roundtrip', urlDecode(urlEncode(sample)), { ok: true, value: sample });
check('url invalid', urlDecode('%E0%A4%A').ok, false);
check('hex enc', hexEncode('AB', true), '41 42');
check('hex dec 0x', hexDecode('0x41 0x42'), { ok: true, value: 'AB' });
check('hex dec \\x', hexDecode('\\x41\\x42'), { ok: true, value: 'AB' });
check('bin enc', binaryEncode('A'), '01000001');
check('bin roundtrip', binaryDecode(binaryEncode(sample)), { ok: true, value: sample });
check('detect b64', detectFormats('cG93ZXJzaGVsbCAtZW5jIGJ5cGFzcw==')[0]?.kind, 'base64');
check('detect hash not b64', detectFormats('d41d8cd98f00b204e9800998ecf8427e').length, 0);
check('detect url', detectFormats('q=%27%20OR%201%3D1--')[0]?.kind, 'url');
check('detect hex', detectFormats('48656c6c6f20576f726c64')[0]?.kind, 'hex');
check('detect ioc', detectFormats('beacon to http://evil.com and 8.8.8.8').find((d) => d.kind === 'iocs')?.count, 2);

// --- IOC
check('defang', defang('https://evil.example.com/a and 10.0.0.1'), 'hxxps[://]evil[.]example[.]com/a and 10[.]0[.]0[.]1');
check('refang', refang('hxxps[://]evil[.]example[.]com/a and 10[.]0[.]0[.]1'), 'https://evil.example.com/a and 10.0.0.1');
check('refang variants', refang('hxxp://bad(.)site[dot]ru user[@]mail[.]com'), 'http://bad.site.ru user@mail.com');
check('defang idempotent', defang(defang('http://a.com')), defang('http://a.com'));

// --- Network
const ip = parseIPv4('192.168.10.77') as number;
const s26 = calculateSubnet(ip, 26);
check('net', intToIPv4(s26.network), '192.168.10.64');
check('bcast', intToIPv4(s26.broadcast), '192.168.10.127');
check('mask', intToIPv4(s26.mask), '255.255.255.192');
check('wild', intToIPv4(s26.wildcard), '0.0.0.63');
check('hosts', s26.usableHosts, 62);
const s31 = calculateSubnet(parseIPv4('10.0.0.1') as number, 31);
check('/31', [intToIPv4(s31.firstHost), intToIPv4(s31.lastHost), s31.usableHosts], ['10.0.0.0', '10.0.0.1', 2]);
const s32 = calculateSubnet(parseIPv4('8.8.8.8') as number, 32);
check('/32', [intToIPv4(s32.firstHost), s32.usableHosts], ['8.8.8.8', 1]);
const s1 = calculateSubnet(parseIPv4('200.1.2.3') as number, 1);
check('/1', [intToIPv4(s1.network), intToIPv4(s1.broadcast), s1.usableHosts], ['128.0.0.0', '255.255.255.255', 2147483646]);
check('in range', isInSubnet(parseIPv4('192.168.10.100') as number, s26.network, 26), true);
check('out range', isInSubnet(parseIPv4('192.168.10.130') as number, s26.network, 26), false);
check('leading zero rejected', parseIPv4('192.168.010.1'), null);
check('scope 1918', classifyIPv4(parseIPv4('172.20.1.1') as number).scope, 'private');
check('scope 172.32 public', classifyIPv4(parseIPv4('172.32.0.1') as number).scope, 'public');
check('scope cgnat', classifyIPv4(parseIPv4('100.100.0.1') as number).scope, 'cgnat');
check('scope apipa', classifyIPv4(parseIPv4('169.254.3.4') as number).scope, 'linkLocal');
check('scope mcast', classifyIPv4(parseIPv4('239.1.1.1') as number).scope, 'multicast');
check('scope loop', classifyIPv4(parseIPv4('127.0.0.1') as number).scope, 'loopback');

// --- chmod
const p4755 = fromOctal('4755')!;
check('4755 sym', toSymbolic(p4755), '-rwsr-xr-x');
check('1777 sym', toSymbolic(fromOctal('1777')!), '-rwxrwxrwt');
check('sym->oct', toOctal(fromSymbolic('-rwsr-sr-T')!), '7754');
check('640 sym', toSymbolic(fromOctal('640')!), '-rw-r-----');
check('777 critical', auditPermissions(fromOctal('777')!)[0].level, 'critical');
check('600 safe', auditPermissions(fromOctal('600')!)[0].level, 'safe');
check('4755 critical', auditPermissions(p4755)[0].level, 'critical');

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
