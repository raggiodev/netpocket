import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  Terminal,
  Layers,
} from 'lucide-react';
import { CopyCard } from '../../components/CopyCard';
import { Badge } from '../../components/Badge';
import { Chip } from '../../components/Chip';
import { TextField } from '../../components/TextField';
import { useSettings } from '../../i18n';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  DEFAULT_CHMOD,
  toOctal,
  toShortOctal,
  toSymbolic,
  parsePermission,
  auditPermissions,
  fromOctal,
  CHMOD_PRESETS,
} from '../../utils/chmod';
import type { ChmodState, AuditLevel } from '../../types';
import { haptic } from '../../utils/clipboard';

const isChmodState = (v: unknown): v is ChmodState => {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.suid === 'boolean' &&
    typeof s.sgid === 'boolean' &&
    typeof s.sticky === 'boolean' &&
    Array.isArray(s.bits) &&
    s.bits.length === 9 &&
    s.bits.every((b) => typeof b === 'boolean')
  );
};

export const Chmod: React.FC = () => {
  const { t } = useSettings();

  // Persisted chmod state with strict schema validation
  const [persisted, setPersisted] = useLocalStorage<ChmodState>(
    'chmod:state',
    DEFAULT_CHMOD,
    isChmodState,
  );

  const [state, setState] = useState<ChmodState>(persisted);
  const [reverseInput, setReverseInput] = useState('');

  useEffect(() => {
    setPersisted(state);
  }, [state, setPersisted]);

  // Bits representation: [ur, uw, ux, gr, gw, gx, or, ow, ox]
  const toggleBit = (idx: number) => {
    haptic(15);
    setState((prev) => {
      const bits = [...prev.bits];
      bits[idx] = !bits[idx];
      return { ...prev, bits };
    });
  };

  const toggleSpecial = (key: 'suid' | 'sgid' | 'sticky') => {
    haptic(20);
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (octal: string) => {
    haptic(25);
    const parsed = fromOctal(octal);
    if (parsed) {
      setState(parsed);
      setReverseInput('');
    }
  };

  const handleReverseLookup = (val: string) => {
    setReverseInput(val);
    const parsed = parsePermission(val);
    if (parsed) {
      haptic(20);
      setState(parsed);
    }
  };

  const octal = useMemo(() => toOctal(state), [state]);
  const shortOctal = useMemo(() => toShortOctal(state), [state]);
  const symbolic = useMemo(() => toSymbolic(state), [state]);
  const findings = useMemo(() => auditPermissions(state), [state]);

  const auditLevelVariant = (level: AuditLevel) => {
    switch (level) {
      case 'critical':
        return 'critical';
      case 'warning':
        return 'warning';
      case 'safe':
        return 'safe';
      case 'info':
      default:
        return 'neutral';
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Reverse Input bar */}
      <TextField
        label={t.guard.chmod.inputLabel}
        value={reverseInput}
        onChange={handleReverseLookup}
        placeholder={t.guard.chmod.inputPlaceholder}
      />

      {/* Quick Best-Practice Presets */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t.guard.chmod.presetsTitle}
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CHMOD_PRESETS.map((p) => {
            const isMatch = shortOctal === p.octal || octal === p.octal;
            return (
              <Chip
                key={p.octal}
                label={`${p.octal} (${t.guard.chmod.presets[p.key]})`}
                active={isMatch}
                onClick={() => applyPreset(p.octal)}
                className="font-mono text-xs"
              />
            );
          })}
        </div>
      </div>

      {/* 3x3 Permission Matrix + Special Bits */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl bg-surface border border-line shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>{t.guard.chmod.matrix}</span>
          </h3>
          <span className="font-mono text-xs text-accent font-semibold px-2 py-0.5 rounded bg-accent/15">
            {symbolic}
          </span>
        </div>

        {/* 3x3 Checkbox Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 px-2 text-left font-sans font-semibold">Scope</th>
                <th className="py-2 px-2 text-center font-bold">r (4)</th>
                <th className="py-2 px-2 text-center font-bold">w (2)</th>
                <th className="py-2 px-2 text-center font-bold">x (1)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {/* Owner */}
              <tr>
                <td className="py-3 px-2 font-sans font-semibold text-fg">
                  {t.guard.chmod.owner}
                </td>
                {[0, 1, 2].map((bit) => (
                  <td key={bit} className="py-3 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleBit(bit)}
                      className={`w-9 h-9 rounded-xl font-bold transition-all active:scale-90 ${
                        state.bits[bit]
                          ? 'bg-accent text-bg shadow-sm'
                          : 'bg-elevated text-muted hover:text-fg'
                      }`}
                    >
                      {state.bits[bit] ? (bit === 0 ? 'r' : bit === 1 ? 'w' : 'x') : '-'}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Group */}
              <tr>
                <td className="py-3 px-2 font-sans font-semibold text-fg">
                  {t.guard.chmod.group}
                </td>
                {[3, 4, 5].map((bit) => (
                  <td key={bit} className="py-3 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleBit(bit)}
                      className={`w-9 h-9 rounded-xl font-bold transition-all active:scale-90 ${
                        state.bits[bit]
                          ? 'bg-accent text-bg shadow-sm'
                          : 'bg-elevated text-muted hover:text-fg'
                      }`}
                    >
                      {state.bits[bit] ? (bit === 3 ? 'r' : bit === 4 ? 'w' : 'x') : '-'}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Others */}
              <tr>
                <td className="py-3 px-2 font-sans font-semibold text-fg">
                  {t.guard.chmod.others}
                </td>
                {[6, 7, 8].map((bit) => (
                  <td key={bit} className="py-3 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleBit(bit)}
                      className={`w-9 h-9 rounded-xl font-bold transition-all active:scale-90 ${
                        state.bits[bit]
                          ? bit === 7 && !state.sticky
                            ? 'bg-danger text-white shadow-sm' // Highlight world-writable
                            : 'bg-accent text-bg shadow-sm'
                          : 'bg-elevated text-muted hover:text-fg'
                      }`}
                    >
                      {state.bits[bit] ? (bit === 6 ? 'r' : bit === 7 ? 'w' : 'x') : '-'}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Special Bits (SUID, SGID, Sticky) */}
        <div className="flex flex-col gap-2 pt-2 border-t border-line/60">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t.guard.chmod.special}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* SUID */}
            <button
              type="button"
              onClick={() => toggleSpecial('suid')}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all active:scale-95 ${
                state.suid
                  ? 'bg-danger-bg text-danger border-danger-line shadow-sm'
                  : 'bg-elevated text-muted border-line hover:text-fg'
              }`}
            >
              <div>
                <span className="font-mono font-bold text-xs block">
                  {t.guard.chmod.suid} (4000)
                </span>
                <span className="text-[11px] opacity-80">{t.guard.chmod.suidDesc}</span>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface border">
                {state.suid ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* SGID */}
            <button
              type="button"
              onClick={() => toggleSpecial('sgid')}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all active:scale-95 ${
                state.sgid
                  ? 'bg-warn-bg text-warn border-warn-line shadow-sm'
                  : 'bg-elevated text-muted border-line hover:text-fg'
              }`}
            >
              <div>
                <span className="font-mono font-bold text-xs block">
                  {t.guard.chmod.sgid} (2000)
                </span>
                <span className="text-[11px] opacity-80">{t.guard.chmod.sgidDesc}</span>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface border">
                {state.sgid ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Sticky Bit */}
            <button
              type="button"
              onClick={() => toggleSpecial('sticky')}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all active:scale-95 ${
                state.sticky
                  ? 'bg-safe-bg text-safe border-safe-line shadow-sm'
                  : 'bg-elevated text-muted border-line hover:text-fg'
              }`}
            >
              <div>
                <span className="font-mono font-bold text-xs block">
                  {t.guard.chmod.sticky} (1000)
                </span>
                <span className="text-[11px] opacity-80">{t.guard.chmod.stickyDesc}</span>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface border">
                {state.sticky ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Output Copy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Octal */}
        <CopyCard
          label={t.guard.chmod.octal}
          value={octal}
          hint={t.guard.chmod.shortForm.replace('{v}', shortOctal)}
        />

        {/* Symbolic */}
        <CopyCard
          label={t.guard.chmod.symbolic}
          value={symbolic}
        />

        {/* Ready Command */}
        <CopyCard
          label={t.guard.chmod.command}
          value={`chmod ${shortOctal} <file>`}
          icon={<Terminal className="w-3.5 h-3.5 text-accent" />}
        />
      </div>

      {/* Automated Blue Team Risk Auditor */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-accent" />
          <span>{t.guard.chmod.auditTitle}</span>
        </h3>

        <div className="flex flex-col gap-2.5">
          {findings.map((f, i) => {
            // @ts-expect-error dynamic audit key indexing
            const info = t.guard.chmod.audit[f.key];
            if (!info) return null;

            return (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 bg-surface ${
                  f.level === 'critical'
                    ? 'border-danger-line bg-danger-bg/20'
                    : f.level === 'warning'
                    ? 'border-warn-line bg-warn-bg/20'
                    : f.level === 'safe'
                    ? 'border-safe-line bg-safe-bg/20'
                    : 'border-line'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs sm:text-sm text-fg">
                    {info.title}
                  </span>
                  <Badge variant={auditLevelVariant(f.level)}>
                    {t.guard.chmod.levels[f.level]}
                  </Badge>
                </div>
                <p className="text-xs text-muted leading-relaxed">{info.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
