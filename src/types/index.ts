export type Lang = 'en' | 'es' | 'pt';
export type Theme = 'dark' | 'light';
export type TabId = 'inspector' | 'networks' | 'ports' | 'guard';
export type GuardTool = 'events' | 'chmod' | 'http';

/** A string localized in every supported language. */
export type L10n = Record<Lang, string>;
/** A list of strings localized in every supported language. */
export type L10nList = Record<Lang, string[]>;

/** Shared three-level semaphore used by ports, events and HTTP codes. */
export type RiskLevel = 'critical' | 'warning' | 'safe';

export type Protocol = 'TCP' | 'UDP' | 'TCP/UDP';

export type PortCategory =
  | 'critical-wan'
  | 'ad-windows'
  | 'linux-remote'
  | 'databases'
  | 'web-mail'
  | 'infra-routing';

export interface PortEntry {
  /** Stable identifier, used for favorites persistence. */
  id: string;
  /** Display label (e.g. "445", "137-139", "67/68"). */
  port: string;
  /** Numeric ports covered by this entry (used for exact search). */
  numbers: number[];
  protocol: Protocol;
  service: string;
  risk: RiskLevel;
  categories: PortCategory[];
  /** Extra non-localized search terms (CVE names, tools, acronyms). */
  keywords: string[];
  purpose: L10n;
  attacks: L10nList;
  hardening: L10nList;
}

export type EventCategory = 'auth' | 'privesc' | 'antiforensics' | 'persistence' | 'lateral';
export type EventLogChannel = 'Security' | 'System' | 'PowerShell/Operational';

export interface EventIdEntry {
  id: number;
  channel: EventLogChannel;
  severity: RiskLevel;
  categories: EventCategory[];
  title: L10n;
  summary: L10n;
  triage: L10nList;
  /** Optional structured breakdown (e.g. Logon Types for 4624). */
  details?: { heading: L10n; rows: { code: string; label: L10n }[] };
  /** MITRE ATT&CK technique references. */
  mitre: string[];
}

export interface HttpCodeEntry {
  code: string;
  name: string;
  family: '2xx' | '3xx' | '4xx' | '5xx';
  risk: RiskLevel;
  meaning: L10n;
  attack: L10n;
  action: L10nList;
}

export interface ChmodState {
  suid: boolean;
  sgid: boolean;
  sticky: boolean;
  /** [ur, uw, ux, gr, gw, gx, or, ow, ox] */
  bits: boolean[];
}

export type AuditLevel = 'critical' | 'warning' | 'safe' | 'info';

export interface AuditFinding {
  level: AuditLevel;
  key: string;
}
