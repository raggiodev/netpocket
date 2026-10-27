import React, { useState, useMemo } from 'react';
import {
  Star,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
  Flame,
} from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { Chip } from '../components/Chip';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { PORTS } from '../data/ports';
import { useSettings, fmt } from '../i18n';
import { useFavorites } from '../hooks/useFavorites';
import { haptic, writeClipboard } from '../utils/clipboard';
import type { PortCategory } from '../types';

type FilterCategory = 'all' | 'favorites' | PortCategory;

export const Ports: React.FC = () => {
  const { t, tr, trList } = useSettings();
  const { favorites, toggle, count: favCount } = useFavorites('ports:favorites');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [expandedPorts, setExpandedPorts] = useState<Set<string>>(new Set());

  // Category definitions with localized labels
  const categories: { id: FilterCategory; label: string; count?: number }[] = useMemo(
    () => [
      { id: 'all', label: t.ports.categories.all, count: PORTS.length },
      { id: 'favorites', label: t.ports.categories.favorites, count: favCount },
      { id: 'critical-wan', label: t.ports.categories['critical-wan'] },
      { id: 'ad-windows', label: t.ports.categories['ad-windows'] },
      { id: 'linux-remote', label: t.ports.categories['linux-remote'] },
      { id: 'databases', label: t.ports.categories.databases },
      { id: 'web-mail', label: t.ports.categories['web-mail'] },
      { id: 'infra-routing', label: t.ports.categories['infra-routing'] },
    ],
    [t, favCount],
  );

  // Filtered port list
  const filteredPorts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return PORTS.filter((item) => {
      // Category filter
      if (selectedCategory === 'favorites') {
        if (!favorites.has(item.id)) return false;
      } else if (selectedCategory !== 'all') {
        if (!item.categories.includes(selectedCategory)) return false;
      }

      // Search query filter
      if (!q) return true;

      // Exact port match or number match
      if (item.port.toLowerCase().includes(q)) return true;
      if (item.numbers.some((num) => num.toString() === q)) return true;

      // Service name match
      if (item.service.toLowerCase().includes(q)) return true;

      // Protocol match
      if (item.protocol.toLowerCase().includes(q)) return true;

      // Keywords match
      if (item.keywords.some((k) => k.toLowerCase().includes(q))) return true;

      // Purpose or attacks match
      if (tr(item.purpose).toLowerCase().includes(q)) return true;
      if (trList(item.attacks).some((a) => a.toLowerCase().includes(q))) return true;
      if (trList(item.hardening).some((h) => h.toLowerCase().includes(q))) return true;

      return false;
    });
  }, [search, selectedCategory, favorites, tr, trList]);

  const toggleExpand = (id: string) => {
    haptic(15);
    setExpandedPorts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    haptic(25);
    toggle(id);
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto pb-24 pt-2">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-fg flex items-center gap-2">
          <span>{t.ports.title}</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
          {t.ports.subtitle}
        </p>
      </div>

      {/* Search Input */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t.ports.searchPlaceholder}
      />

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.label}
            active={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            count={cat.count}
          />
        ))}
      </div>

      {/* Results Count bar */}
      <div className="flex items-center justify-between text-xs text-muted font-mono px-1">
        <span>
          {fmt(t.common.results, { n: filteredPorts.length })}
        </span>
        {selectedCategory === 'favorites' && favCount === 0 && (
          <span className="text-accent">{t.ports.categories.favorites} (0)</span>
        )}
      </div>

      {/* Ports List */}
      {filteredPorts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPorts.map((p) => {
            const isExpanded = expandedPorts.has(p.id);
            const isFav = favorites.has(p.id);

            return (
              <div
                key={p.id}
                className={`rounded-2xl border transition-all duration-150 overflow-hidden bg-surface ${
                  isExpanded ? 'border-accent/40 shadow-sm' : 'border-line hover:border-line/80'
                }`}
              >
                {/* Accordion Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(p.id);
                    }
                  }}
                  className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer select-none active:bg-elevated/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Star Favorite Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, p.id)}
                      title={isFav ? t.common.removeFavorite : t.common.addFavorite}
                      aria-label={isFav ? t.common.removeFavorite : t.common.addFavorite}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isFav
                          ? 'text-warn bg-warn/15'
                          : 'text-muted hover:text-fg hover:bg-elevated'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isFav ? 'fill-warn stroke-warn' : 'stroke-current'
                        }`}
                      />
                    </button>

                    {/* Port Number (Monospace) */}
                    <button
                      type="button"
                      title={t.common.tapToCopy}
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic(35);
                        writeClipboard(p.port);
                      }}
                      className="font-mono text-base sm:text-lg font-bold text-fg tracking-tight hover:text-accent transition-colors"
                    >
                      {p.port}
                    </button>

                    {/* Protocol Badge */}
                    <Badge variant="neutral" size="sm">
                      {p.protocol}
                    </Badge>

                    {/* Service Name */}
                    <span className="text-xs sm:text-sm font-semibold text-fg truncate">
                      {p.service}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Risk Badge */}
                    <Badge variant={p.risk}>
                      {t.risk[p.risk]}
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

                {/* Accordion Body (3 Structured Tactical Sections) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-line/60 flex flex-col gap-3.5 bg-elevated/20 text-xs sm:text-sm animate-fade-in">
                    {/* 1. Service Purpose */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5 text-accent" />
                        <span>{t.ports.purpose}</span>
                      </div>
                      <p className="text-fg leading-relaxed pl-5">
                        {tr(p.purpose)}
                      </p>
                    </div>

                    {/* 2. Attack Vectors */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-danger uppercase tracking-wider">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{t.ports.attacks}</span>
                      </div>
                      <ul className="flex flex-col gap-1 pl-5">
                        {trList(p.attacks).map((att, idx) => (
                          <li
                            key={idx}
                            className="text-fg flex items-start gap-2 leading-relaxed"
                          >
                            <span className="text-danger mt-1 text-[10px]">•</span>
                            <span>{att}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 3. Blue Team Hardening */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-safe uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t.ports.hardening}</span>
                      </div>
                      <ul className="flex flex-col gap-1 pl-5">
                        {trList(p.hardening).map((hard, idx) => (
                          <li
                            key={idx}
                            className="text-fg flex items-start gap-2 leading-relaxed"
                          >
                            <span className="text-safe mt-1 text-[10px]">✔</span>
                            <span>{hard}</span>
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
