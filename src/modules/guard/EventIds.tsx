import React, { useState, useMemo } from 'react';
import {
  Star,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { SearchBar } from '../../components/SearchBar';
import { Chip } from '../../components/Chip';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { EVENT_IDS } from '../../data/eventIds';
import { useSettings, fmt } from '../../i18n';
import { useFavorites } from '../../hooks/useFavorites';
import { haptic, writeClipboard } from '../../utils/clipboard';
import type { EventCategory } from '../../types';

type FilterCategory = 'all' | 'favorites' | EventCategory;

export const EventIds: React.FC = () => {
  const { t, tr, trList } = useSettings();
  const { favorites, toggle, count: favCount } = useFavorites('events:favorites');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());

  const categories: { id: FilterCategory; label: string; count?: number }[] = useMemo(
    () => [
      { id: 'all', label: t.guard.events.categories.auth ? t.common.all : 'All', count: EVENT_IDS.length },
      { id: 'favorites', label: t.common.favorites, count: favCount },
      { id: 'auth', label: t.guard.events.categories.auth },
      { id: 'privesc', label: t.guard.events.categories.privesc },
      { id: 'antiforensics', label: t.guard.events.categories.antiforensics },
      { id: 'persistence', label: t.guard.events.categories.persistence },
      { id: 'lateral', label: t.guard.events.categories.lateral },
    ],
    [t, favCount],
  );

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();

    return EVENT_IDS.filter((item) => {
      // Category filter
      if (selectedCategory === 'favorites') {
        if (!favorites.has(item.id.toString())) return false;
      } else if (selectedCategory !== 'all') {
        if (!item.categories.includes(selectedCategory)) return false;
      }

      // Search query filter
      if (!q) return true;

      // Event ID match
      if (item.id.toString().includes(q)) return true;

      // Channel match
      if (item.channel.toLowerCase().includes(q)) return true;

      // Title & Summary match
      if (tr(item.title).toLowerCase().includes(q)) return true;
      if (tr(item.summary).toLowerCase().includes(q)) return true;

      // MITRE techniques match
      if (item.mitre.some((m) => m.toLowerCase().includes(q))) return true;

      // Triage notes match
      if (trList(item.triage).some((note) => note.toLowerCase().includes(q))) return true;

      // Details / Logon Types rows match
      if (item.details?.rows.some((r) => r.code.includes(q) || tr(r.label).toLowerCase().includes(q))) {
        return true;
      }

      return false;
    });
  }, [search, selectedCategory, favorites, tr, trList]);

  const toggleExpand = (id: number) => {
    haptic(15);
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    haptic(25);
    toggle(id.toString());
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t.guard.events.searchPlaceholder}
      />

      {/* Category Chips */}
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

      {/* Result Count Bar */}
      <div className="flex items-center justify-between text-xs text-muted font-mono px-1">
        <span>{fmt(t.common.results, { n: filteredEvents.length })}</span>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredEvents.map((evt) => {
            const isExpanded = expandedEvents.has(evt.id);
            const isFav = favorites.has(evt.id.toString());

            return (
              <div
                key={evt.id}
                className={`rounded-2xl border transition-all duration-150 overflow-hidden bg-surface ${
                  isExpanded ? 'border-accent/40 shadow-sm' : 'border-line hover:border-line/80'
                }`}
              >
                {/* Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(evt.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(evt.id);
                    }
                  }}
                  className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer select-none active:bg-elevated/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, evt.id)}
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

                    <button
                      type="button"
                      title={t.common.tapToCopy}
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic(35);
                        writeClipboard(evt.id.toString());
                      }}
                      className="font-mono text-base sm:text-lg font-bold text-fg tracking-tight hover:text-accent transition-colors"
                    >
                      {evt.id}
                    </button>

                    <Badge variant="neutral" size="sm">
                      {evt.channel}
                    </Badge>

                    <span className="text-xs sm:text-sm font-semibold text-fg truncate">
                      {tr(evt.title)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={evt.severity}>
                      {t.guard.events.severity[evt.severity]}
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
                    {/* Summary */}
                    <p className="text-fg leading-relaxed">
                      {tr(evt.summary)}
                    </p>

                    {/* MITRE ATT&CK References */}
                    {evt.mitre.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Compass className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="text-[11px] font-semibold text-muted uppercase">
                          MITRE ATT&CK:
                        </span>
                        {evt.mitre.map((m) => (
                          <span
                            key={m}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-elevated border border-line text-fg"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Logon Types / Extra Details table if present */}
                    {evt.details && (
                      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface border border-line/80">
                        <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                          {tr(evt.details.heading)}
                        </span>
                        <div className="grid grid-cols-1 gap-1.5 mt-1 font-mono text-xs">
                          {evt.details.rows.map((row) => (
                            <div
                              key={row.code}
                              className="flex items-start gap-2 py-1 px-2 rounded bg-elevated/40"
                            >
                              <span className="font-bold text-accent shrink-0">
                                Type {row.code}:
                              </span>
                              <span className="text-fg font-sans text-[11px] sm:text-xs">
                                {tr(row.label)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SOC Analyst Triage Notes */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-safe-bg/30 border border-safe-line/50">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-safe uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t.guard.events.triage}</span>
                      </div>
                      <ul className="flex flex-col gap-1 pl-5">
                        {trList(evt.triage).map((note, idx) => (
                          <li
                            key={idx}
                            className="text-fg flex items-start gap-2 leading-relaxed"
                          >
                            <span className="text-safe mt-1 text-[10px]">▶</span>
                            <span>{note}</span>
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
