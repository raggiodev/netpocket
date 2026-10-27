import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Flame,
  Info,
} from 'lucide-react';
import { SearchBar } from '../../components/SearchBar';
import { Chip } from '../../components/Chip';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { HTTP_CODES } from '../../data/httpCodes';
import { useSettings, fmt } from '../../i18n';
import { haptic, writeClipboard } from '../../utils/clipboard';

type FamilyFilter = 'all' | '2xx' | '3xx' | '4xx' | '5xx';

export const HttpCodes: React.FC = () => {
  const { t, tr, trList } = useSettings();

  const [search, setSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<FamilyFilter>('all');
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  const families: { id: FamilyFilter; label: string }[] = [
    { id: 'all', label: t.common.all },
    { id: '2xx', label: '2xx Success' },
    { id: '3xx', label: '3xx Redirect' },
    { id: '4xx', label: '4xx Client / WAF' },
    { id: '5xx', label: '5xx Server Exploit' },
  ];

  const filteredCodes = useMemo(() => {
    const q = search.trim().toLowerCase();

    return HTTP_CODES.filter((item) => {
      // Family filter
      if (selectedFamily !== 'all' && item.family !== selectedFamily) {
        return false;
      }

      if (!q) return true;

      if (item.code.toLowerCase().includes(q)) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      if (tr(item.meaning).toLowerCase().includes(q)) return true;
      if (tr(item.attack).toLowerCase().includes(q)) return true;
      if (trList(item.action).some((a) => a.toLowerCase().includes(q))) return true;

      return false;
    });
  }, [search, selectedFamily, tr, trList]);

  const toggleExpand = (code: string) => {
    haptic(15);
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t.guard.http.searchPlaceholder}
      />

      {/* Family Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {families.map((fam) => (
          <Chip
            key={fam.id}
            label={fam.label}
            active={selectedFamily === fam.id}
            onClick={() => setSelectedFamily(fam.id)}
          />
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted font-mono px-1">
        <span>{fmt(t.common.results, { n: filteredCodes.length })}</span>
      </div>

      {/* Codes List */}
      {filteredCodes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredCodes.map((item) => {
            const isExpanded = expandedCodes.has(item.code);

            return (
              <div
                key={item.code}
                className={`rounded-2xl border transition-all duration-150 overflow-hidden bg-surface ${
                  isExpanded ? 'border-accent/40 shadow-sm' : 'border-line hover:border-line/80'
                }`}
              >
                {/* Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(item.code)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(item.code);
                    }
                  }}
                  className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer select-none active:bg-elevated/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      title={t.common.tapToCopy}
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic(35);
                        writeClipboard(item.code);
                      }}
                      className="font-mono text-base sm:text-lg font-bold text-fg tracking-tight hover:text-accent transition-colors"
                    >
                      {item.code}
                    </button>

                    <Badge variant="neutral" size="sm">
                      {item.family}
                    </Badge>

                    <span className="text-xs sm:text-sm font-semibold text-fg truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={item.risk}>
                      {t.risk[item.risk]}
                    </Badge>

                    <div className="text-muted p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-line/60 flex flex-col gap-3.5 bg-elevated/20 text-xs sm:text-sm animate-fade-in">
                    {/* Standard Meaning */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5 text-accent" />
                        <span>{t.guard.http.meaning}</span>
                      </div>
                      <p className="text-fg leading-relaxed pl-5">
                        {tr(item.meaning)}
                      </p>
                    </div>

                    {/* What it means in Attack / WAF Logs */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-danger-bg/25 border border-danger-line/40">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-danger uppercase tracking-wider">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{t.guard.http.attack}</span>
                      </div>
                      <p className="text-fg leading-relaxed pl-5">
                        {tr(item.attack)}
                      </p>
                    </div>

                    {/* Triage Action */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-safe-bg/30 border border-safe-line/50">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-safe uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t.guard.http.action}</span>
                      </div>
                      <ul className="flex flex-col gap-1 pl-5">
                        {trList(item.action).map((act, idx) => (
                          <li
                            key={idx}
                            className="text-fg flex items-start gap-2 leading-relaxed"
                          >
                            <span className="text-safe mt-1 text-[10px]">✔</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
