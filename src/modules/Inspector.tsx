import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Hash,
  Binary as BinaryIcon,
  Code2,
  FileCode,
  Link,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { TextArea } from '../components/TextArea';
import { CopyCard } from '../components/CopyCard';
import { Badge } from '../components/Badge';
import { SegmentedControl } from '../components/SegmentedControl';
import { useToast } from '../components/Toast';
import { useSettings, fmt } from '../i18n';
import { hashAll } from '../utils/hash';
import {
  detectFormats,
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  hexEncode,
  hexDecode,
  binaryEncode,
  binaryDecode,
  type DecodeError,
  type DecodeResult,
} from '../utils/encoding';
import { defang, refang } from '../utils/ioc';
import { haptic } from '../utils/clipboard';

export const MAX_PAYLOAD_BYTES = 262144; // 256 KB security threshold to prevent main-thread UI lockup

export const Inspector: React.FC = () => {
  const { t } = useSettings();
  const { showToast } = useToast();

  const [input, setInput] = useState('');
  const [codecMode, setCodecMode] = useState<'encode' | 'decode'>('decode');
  const [hexSpaced, setHexSpaced] = useState(true);

  const isPayloadTooLarge = input.length > MAX_PAYLOAD_BYTES;

  // Real-time format detections (short-circuited when payload exceeds safe threshold)
  const detections = useMemo(() => (isPayloadTooLarge ? [] : detectFormats(input)), [input, isPayloadTooLarge]);

  // Real-time hashes (short-circuited when payload exceeds safe threshold)
  const hashes = useMemo(
    () => (isPayloadTooLarge ? hashAll('') : hashAll(input)),
    [input, isPayloadTooLarge],
  );

  // Codecs evaluation (short-circuited when payload exceeds safe threshold)
  const codecsResults = useMemo<{
    base64: DecodeResult;
    url: DecodeResult;
    hex: DecodeResult;
    binary: DecodeResult;
  }>(() => {
    if (isPayloadTooLarge) {
      return {
        base64: { ok: false, error: 'empty' },
        url: { ok: false, error: 'empty' },
        hex: { ok: false, error: 'empty' },
        binary: { ok: false, error: 'empty' },
      };
    }
    if (codecMode === 'encode') {
      return {
        base64: { ok: true, value: base64Encode(input) },
        url: { ok: true, value: urlEncode(input) },
        hex: { ok: true, value: hexEncode(input, hexSpaced) },
        binary: { ok: true, value: binaryEncode(input) },
      };
    } else {
      return {
        base64: base64Decode(input),
        url: urlDecode(input),
        hex: hexDecode(input),
        binary: binaryDecode(input),
      };
    }
  }, [input, codecMode, hexSpaced, isPayloadTooLarge]);

  // Action handlers
  const handleDefang = () => {
    haptic(30);
    const result = defang(input);
    if (result !== input) {
      setInput(result);
      showToast(t.inspector.defangDone, 'success');
    } else {
      showToast(t.inspector.nothingChanged, 'info');
    }
  };

  const handleRefang = () => {
    haptic(30);
    const result = refang(input);
    if (result !== input) {
      setInput(result);
      showToast(t.inspector.refangDone, 'warn');
    } else {
      showToast(t.inspector.nothingChanged, 'info');
    }
  };

  const renderErrorMessage = (err: DecodeError) => {
    return t.inspector.errors[err] ?? err;
  };

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-4xl mx-auto px-3.5 sm:px-4 pt-2.5 pb-24 overflow-x-hidden">
      {/* Module Header */}
      <div>
        <h1 className="text-lg font-bold text-fg flex items-center gap-2">
          <span>{t.inspector.title}</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5 leading-relaxed">
          {t.inspector.subtitle}
        </p>
      </div>

      {/* Smart Format Detection Banner */}
      {detections.length > 0 && (
        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-accent/10 border border-accent/30 animate-fade-in min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{t.inspector.detectedTitle}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 min-w-0 max-w-full">
            {detections.map((d, i) => {
              let label = '';
              if (d.kind === 'base64') label = t.inspector.detect.base64;
              else if (d.kind === 'url') label = t.inspector.detect.url;
              else if (d.kind === 'hex') label = t.inspector.detect.hex;
              else if (d.kind === 'binary') label = t.inspector.detect.binary;
              else if (d.kind === 'iocs') {
                label = fmt(t.inspector.detect.iocs, { count: d.count ?? 1 });
              } else if (d.kind === 'defanged') {
                label = t.inspector.detect.defanged;
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    haptic(35);
                    if (d.kind === 'iocs') {
                      setInput(defang(input));
                      showToast(t.inspector.defangDone, 'success');
                    } else if (d.kind === 'defanged') {
                      setInput(refang(input));
                      showToast(t.inspector.refangDone, 'warn');
                    } else {
                      setInput(d.value);
                      showToast(t.common.copied, 'success');
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-accent/10 border border-accent/40 text-accent text-xs font-medium hover:bg-accent/20 transition-all active:scale-95 text-left shadow-sm min-w-0 max-w-full"
                >
                  <Flame className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="break-words">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Textarea */}
      <TextArea
        label={t.inspector.inputLabel}
        value={input}
        onChange={setInput}
        placeholder={t.inspector.placeholder}
        rows={3}
        maxLength={MAX_PAYLOAD_BYTES}
      />

      {/* Input limit warning badge */}
      {isPayloadTooLarge && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-warn-bg border border-warn-line text-warn text-xs font-medium animate-pop-in">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t.inspector.limitExceeded}</span>
        </div>
      )}

      {/* IOC Defang / Refang Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-surface border border-line min-w-0 max-w-full">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-elevated text-muted shrink-0">
            <ShieldAlert className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-fg block truncate">{t.inspector.iocBar}</span>
            <span className="text-[11px] text-muted block truncate">
              {`http:// -> hxxp[://], . -> [.]`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center shrink-0">
          <button
            type="button"
            onClick={handleDefang}
            disabled={!input.trim()}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-safe-bg text-safe border border-safe-line hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.inspector.defang}</span>
          </button>

          <button
            type="button"
            onClick={handleRefang}
            disabled={!input.trim()}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-warn-bg text-warn border border-warn-line hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.inspector.refang}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Encoding / Decoding Grid */}
      <div className="flex flex-col gap-2.5 min-w-0 max-w-full">
        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-accent shrink-0" />
            <span>{t.inspector.codec}</span>
          </h2>

          <div className="flex items-center gap-2 shrink-0">
            {codecMode === 'encode' && (
              <button
                type="button"
                onClick={() => setHexSpaced((p) => !p)}
                className="text-[11px] font-mono px-2 py-1 rounded bg-elevated border border-line text-muted hover:text-fg"
              >
                Hex: {hexSpaced ? t.inspector.spaced : t.inspector.continuous}
              </button>
            )}

            <div className="w-36 sm:w-40">
              <SegmentedControl
                size="sm"
                options={[
                  { id: 'decode', label: t.inspector.decode },
                  { id: 'encode', label: t.inspector.encode },
                ]}
                value={codecMode}
                onChange={setCodecMode}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 min-w-0 max-w-full">
          {/* Base64 */}
          {codecsResults.base64.ok ? (
            <CopyCard
              label={t.inspector.codecs.base64}
              value={codecsResults.base64.value}
              icon={<FileCode className="w-3.5 h-3.5 text-accent" />}
            />
          ) : (
            <div className="p-3 rounded-xl border border-line bg-surface/50 text-xs font-mono text-muted flex flex-wrap items-center justify-between gap-1.5 min-w-0 max-w-full">
              <span className="font-semibold uppercase text-[11px]">{t.inspector.codecs.base64}</span>
              <span className="text-danger text-[11px] break-words">
                {renderErrorMessage(codecsResults.base64.error)}
              </span>
            </div>
          )}

          {/* URL Encoding */}
          {codecsResults.url.ok ? (
            <CopyCard
              label={t.inspector.codecs.url}
              value={codecsResults.url.value}
              icon={<Link className="w-3.5 h-3.5 text-accent" />}
            />
          ) : (
            <div className="p-3 rounded-xl border border-line bg-surface/50 text-xs font-mono text-muted flex flex-wrap items-center justify-between gap-1.5 min-w-0 max-w-full">
              <span className="font-semibold uppercase text-[11px]">{t.inspector.codecs.url}</span>
              <span className="text-danger text-[11px] break-words">
                {renderErrorMessage(codecsResults.url.error)}
              </span>
            </div>
          )}

          {/* Hexadecimal */}
          {codecsResults.hex.ok ? (
            <CopyCard
              label={t.inspector.codecs.hex}
              value={codecsResults.hex.value}
              icon={<Hash className="w-3.5 h-3.5 text-accent" />}
            />
          ) : (
            <div className="p-3 rounded-xl border border-line bg-surface/50 text-xs font-mono text-muted flex flex-wrap items-center justify-between gap-1.5 min-w-0 max-w-full">
              <span className="font-semibold uppercase text-[11px]">{t.inspector.codecs.hex}</span>
              <span className="text-danger text-[11px] break-words">
                {renderErrorMessage(codecsResults.hex.error)}
              </span>
            </div>
          )}

          {/* Binary */}
          {codecsResults.binary.ok ? (
            <CopyCard
              label={t.inspector.codecs.binary}
              value={codecsResults.binary.value}
              icon={<BinaryIcon className="w-3.5 h-3.5 text-accent" />}
            />
          ) : (
            <div className="p-3 rounded-xl border border-line bg-surface/50 text-xs font-mono text-muted flex flex-wrap items-center justify-between gap-1.5 min-w-0 max-w-full">
              <span className="font-semibold uppercase text-[11px]">{t.inspector.codecs.binary}</span>
              <span className="text-danger text-[11px] break-words">
                {renderErrorMessage(codecsResults.binary.error)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Local Cryptographic Hash Generator */}
      <div className="flex flex-col gap-2.5 min-w-0 max-w-full">
        <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-accent shrink-0" />
            <span>{t.inspector.hashes}</span>
          </h2>
          <span className="text-[11px] text-muted">
            {input.length === 0 ? t.inspector.emptyHashNote : t.inspector.hashNote}
          </span>
        </div>

        <div className="flex flex-col gap-2 min-w-0 max-w-full">
          {/* MD5 */}
          <CopyCard
            label="MD5 (128-bit)"
            value={hashes.md5}
            badge={<Badge variant="warning">{t.inspector.md5Badge}</Badge>}
          />

          {/* SHA-1 */}
          <CopyCard
            label="SHA-1 (160-bit)"
            value={hashes.sha1}
            badge={<Badge variant="warning">{t.inspector.sha1Badge}</Badge>}
          />

          {/* SHA-256 */}
          <CopyCard
            label="SHA-256 (256-bit)"
            value={hashes.sha256}
            badge={<Badge variant="safe">{t.inspector.sha256Badge}</Badge>}
          />
        </div>
      </div>
    </div>
  );
};
