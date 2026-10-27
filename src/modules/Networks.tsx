import React, { useState, useMemo, useEffect } from 'react';
import {
  Network as NetIcon,
  Minus,
  Plus,
  Binary,
  Layers,
  Radio,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { TextField } from '../components/TextField';
import { CopyCard } from '../components/CopyCard';
import { Badge } from '../components/Badge';
import { Chip } from '../components/Chip';
import { useSettings, fmt } from '../i18n';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  parseIPv4,
  parseIPv4WithCidr,
  intToIPv4,
  calculateSubnet,
  classifyIPv4,
  isInSubnet,
  toBits,
  formatCount,
  type SubnetInfo,
} from '../utils/network';
import { haptic } from '../utils/clipboard';

const isCidr = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 32;

const PRESET_CIDRS = [8, 16, 24, 26, 28, 30, 32];

export const Networks: React.FC = () => {
  const { t, locale } = useSettings();

  // Air-Gap Guarantee: Target IPs and subnets are held strictly in volatile RAM (never written to disk)
  const [ipInput, setIpInput] = useState('192.168.1.1');
  const [targetIpInput, setTargetIpInput] = useState('');

  // Persist only non-sensitive UI preference (CIDR slider value) with strict validation
  const [cidr, setCidr] = useLocalStorage<number>('networks:default_cidr', 24, isCidr);

  // Proactively purge legacy persistent storage key to ensure zero residual IP addresses on disk
  useEffect(() => {
    try {
      window.localStorage.removeItem('netpocket:networks:state');
    } catch {
      /* ignore storage unavailable */
    }
  }, []);

  // Handle embedded CIDR (e.g., user pastes "10.0.0.1/22")
  const parsed = useMemo(() => {
    const withCidr = parseIPv4WithCidr(ipInput);
    if (withCidr && withCidr.cidr !== null) {
      return { ipNum: withCidr.ip, inlineCidr: withCidr.cidr, valid: true };
    }
    const ipNum = parseIPv4(ipInput);
    return { ipNum, inlineCidr: null, valid: ipNum !== null };
  }, [ipInput]);

  // Update slider if user typed a slash notation
  useEffect(() => {
    if (parsed.inlineCidr !== null && parsed.inlineCidr !== cidr) {
      setCidr(parsed.inlineCidr);
    }
  }, [parsed.inlineCidr, cidr]);

  // Calculate subnet parameters
  const subnet: SubnetInfo | null = useMemo(() => {
    if (parsed.ipNum === null) return null;
    return calculateSubnet(parsed.ipNum, cidr);
  }, [parsed.ipNum, cidr]);

  // RFC Classification
  const scopeInfo = useMemo(() => {
    if (parsed.ipNum === null) return null;
    return classifyIPv4(parsed.ipNum);
  }, [parsed.ipNum]);

  // 32-bit array for Binary X-Ray
  const ipBits = useMemo(() => {
    if (parsed.ipNum === null) return null;
    return toBits(parsed.ipNum);
  }, [parsed.ipNum]);

  // Target Verifier logic
  const verifierResult = useMemo(() => {
    if (!targetIpInput.trim() || !subnet) return null;
    const targetNum = parseIPv4(targetIpInput);
    if (targetNum === null) {
      return { status: 'invalid' as const };
    }
    const inRange = isInSubnet(targetNum, subnet.network, cidr);
    const targetSubnet = calculateSubnet(targetNum, cidr);
    return {
      status: inRange ? ('in' as const) : ('out' as const),
      targetBlock: `${intToIPv4(targetSubnet.network)}/${cidr}`,
    };
  }, [targetIpInput, subnet, cidr]);

  const handleCidrChange = (val: number) => {
    const clamped = Math.max(1, Math.min(32, val));
    setCidr(clamped);
    haptic(15);
  };

  const getScopeBadgeVariant = (scope?: string) => {
    switch (scope) {
      case 'private':
        return 'accent';
      case 'public':
        return 'info';
      case 'loopback':
      case 'linkLocal':
      case 'cgnat':
        return 'warning';
      case 'multicast':
      case 'reserved':
      case 'broadcast':
        return 'critical';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-24 pt-2">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-fg flex items-center gap-2">
          <span>{t.networks.title}</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
          {t.networks.subtitle}
        </p>
      </div>

      {/* Main Controls Card */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl bg-surface border border-line shadow-card">
        {/* IPv4 Address Input */}
        <TextField
          label={t.networks.ipLabel}
          value={ipInput}
          onChange={(val) => {
            setIpInput(val);
          }}
          placeholder={t.networks.ipPlaceholder}
          error={!parsed.valid && ipInput.trim().length > 0 ? t.networks.invalidIp : null}
        />

        {/* CIDR Prefix Slider + Fine Tuning */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-accent" />
              <span>{t.networks.cidrLabel}</span>
            </label>
            <span className="font-mono text-base font-bold text-accent px-2 py-0.5 rounded bg-accent/15 border border-accent/30">
              /{cidr}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleCidrChange(cidr - 1)}
              disabled={cidr <= 1}
              aria-label={t.networks.decrement}
              className="p-2 rounded-xl bg-elevated border border-line text-fg hover:border-accent hover:text-accent disabled:opacity-40 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="range"
              min={1}
              max={32}
              value={cidr}
              onChange={(e) => handleCidrChange(Number(e.target.value))}
              className="flex-1 w-full"
            />

            <button
              type="button"
              onClick={() => handleCidrChange(cidr + 1)}
              disabled={cidr >= 32}
              aria-label={t.networks.increment}
              className="p-2 rounded-xl bg-elevated border border-line text-fg hover:border-accent hover:text-accent disabled:opacity-40 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <span className="text-[11px] font-medium text-muted shrink-0 mr-1">
              {t.networks.presets}:
            </span>
            {PRESET_CIDRS.map((p) => (
              <Chip
                key={p}
                label={`/${p}`}
                active={cidr === p}
                onClick={() => handleCidrChange(p)}
                className="font-mono text-xs px-2.5 py-1"
              />
            ))}
          </div>
        </div>

        {/* RFC Scope Classification Badge */}
        {scopeInfo && (
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-elevated/60 border border-line/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-fg">
                  {t.networks.scope[scopeInfo.scope]}
                </span>
                <span className="text-[11px] font-mono text-muted">({scopeInfo.rfc})</span>
              </div>
              <Badge variant={getScopeBadgeVariant(scopeInfo.scope)}>
                {scopeInfo.block}
              </Badge>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              {t.networks.scopeDesc[scopeInfo.scope]}
            </p>
          </div>
        )}
      </div>

      {/* 32-Bit Binary X-Ray */}
      {ipBits && (
        <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-surface border border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.networks.xray}
              </h2>
            </div>
            {subnet && (
              <Badge variant="neutral">
                {fmt(t.networks.classLabel, { c: subnet.ipClass })}
              </Badge>
            )}
          </div>

          {/* 32-bit Interactive Grid */}
          <div className="p-3 rounded-xl bg-bg border border-line/80 font-mono text-xs sm:text-sm overflow-x-auto">
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 min-w-[280px]">
              {[0, 1, 2, 3].map((octetIdx) => (
                <React.Fragment key={octetIdx}>
                  <div className="flex items-center gap-[2px] sm:gap-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((bitIdx) => {
                      const absoluteBit = octetIdx * 8 + bitIdx;
                      const isNetworkBit = absoluteBit < cidr;
                      const isBoundary = absoluteBit === cidr - 1;

                      return (
                        <div
                          key={bitIdx}
                          className={`relative flex items-center justify-center w-6 h-7 sm:w-7 sm:h-8 rounded text-center font-bold transition-colors ${
                            isNetworkBit
                              ? 'bg-cyanbit/20 text-cyanbit border border-cyanbit/50'
                              : 'bg-hostbit/15 text-hostbit border border-hostbit/40'
                          }`}
                        >
                          {ipBits[absoluteBit]}
                          {isBoundary && (
                            <span
                              title={`CIDR /${cidr}`}
                              className="absolute -right-[3px] top-0 bottom-0 w-[2px] bg-accent z-10 shadow-glow"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {octetIdx < 3 && <span className="text-muted font-bold px-0.5">.</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Binary X-Ray Legend */}
          <div className="flex items-center justify-between text-[11px] font-mono px-1">
            <div className="flex items-center gap-1.5 text-cyanbit">
              <span className="w-2.5 h-2.5 rounded bg-cyanbit/40 border border-cyanbit" />
              <span>
                {t.networks.networkBits}: {cidr}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-hostbit">
              <span className="w-2.5 h-2.5 rounded bg-hostbit/40 border border-hostbit" />
              <span>
                {t.networks.hostBits}: {32 - cidr}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tappable Output Cards (Subnet Calculation Results) */}
      {subnet && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-accent" />
            <span>{t.networks.title}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Network Address */}
            <CopyCard
              label={t.networks.results.network}
              value={`${intToIPv4(subnet.network)}/${subnet.cidr}`}
              badge={<Badge variant="accent">Network</Badge>}
            />

            {/* Broadcast Address */}
            <CopyCard
              label={t.networks.results.broadcast}
              value={
                subnet.mode === 'standard'
                  ? intToIPv4(subnet.broadcast)
                  : t.networks.results.noBroadcast
              }
              badge={<Badge variant="neutral">Broadcast</Badge>}
            />

            {/* Subnet Mask */}
            <CopyCard
              label={t.networks.results.mask}
              value={intToIPv4(subnet.mask)}
            />

            {/* Wildcard Mask (Cisco ACL / OSPF) */}
            <CopyCard
              label={t.networks.results.wildcard}
              value={intToIPv4(subnet.wildcard)}
              hint={t.networks.results.wildcardHint}
              badge={<Badge variant="info">ACL / OSPF</Badge>}
            />

            {/* Usable Host Range */}
            <CopyCard
              label={t.networks.results.range}
              value={
                subnet.mode === 'host'
                  ? intToIPv4(subnet.firstHost)
                  : `${intToIPv4(subnet.firstHost)} - ${intToIPv4(subnet.lastHost)}`
              }
              hint={
                subnet.mode === 'p2p'
                  ? t.networks.results.rangeP2p
                  : subnet.mode === 'host'
                  ? t.networks.results.rangeHost
                  : undefined
              }
              badge={
                subnet.mode === 'p2p' ? (
                  <Badge variant="warning">RFC 3021 /31</Badge>
                ) : subnet.mode === 'host' ? (
                  <Badge variant="neutral">Host Route /32</Badge>
                ) : undefined
              }
            />

            {/* Total Usable Hosts */}
            <CopyCard
              label={t.networks.results.hosts}
              value={formatCount(subnet.usableHosts, locale)}
              hint={fmt(t.networks.results.totalAddresses, {
                n: formatCount(subnet.totalAddresses, locale),
              })}
              badge={<Badge variant="safe">Usable</Badge>}
            />
          </div>
        </div>
      )}

      {/* Subnet Scope Verifier */}
      {subnet && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-surface border border-line">
          <div className="flex items-center gap-2">
            <NetIcon className="w-4 h-4 text-accent" />
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fg">
                {t.networks.verifier.title}
              </h3>
              <p className="text-[11px] text-muted">{t.networks.verifier.subtitle}</p>
            </div>
          </div>

          <TextField
            value={targetIpInput}
            onChange={setTargetIpInput}
            placeholder={t.networks.verifier.placeholder}
          />

          {verifierResult && (
            <div className="mt-1 animate-fade-in">
              {verifierResult.status === 'in' ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-safe-bg border border-safe-line text-safe text-xs font-mono font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t.networks.verifier.inRange}</span>
                </div>
              ) : verifierResult.status === 'out' ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-bg border border-danger-line text-danger text-xs font-mono font-semibold">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {fmt(t.networks.verifier.outRange, {
                      block: verifierResult.targetBlock,
                    })}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-elevated border border-line text-muted text-xs font-mono">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>{t.networks.verifier.invalid}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
