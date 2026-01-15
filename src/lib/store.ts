import { DayLog } from '../types';

const SYNC_ID_KEY = 'coach.v1.syncId';
const DATA_PREFIX = 'coach.v1.logs.'; // + YYYY-MM
const LEGACY_LOG_PREFIXES = ['coach.logs.', 'coach.v0.logs.'];
const BASE_URL_KEY = 'coach.v1.baseUrl';
const MONTH_SCHEMA_VERSION = 1;

export type MonthPayload = { logs: DayLog[] };
type PersistedMonthPayload = MonthPayload & { version: number };

function normalizeMonthPayload(input: unknown): MonthPayload | null {
  if (!input) return null;
  if (Array.isArray(input)) return { logs: input as DayLog[] };
  if (typeof input !== 'object') return null;
  const wrapped = input as { logs?: unknown };
  if (Array.isArray(wrapped.logs)) return { logs: wrapped.logs as DayLog[] };
  return null;
}

function persistMonthPayload(payload: MonthPayload): PersistedMonthPayload {
  return { version: MONTH_SCHEMA_VERSION, logs: payload.logs };
}

function loadMonthFromKey(key: string): MonthPayload | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return normalizeMonthPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function monthFromISO(dateISO: string): string {
  return dateISO.slice(0, 7); // YYYY-MM
}

export function getSyncId(): string | null {
  return localStorage.getItem(SYNC_ID_KEY);
}

export function setSyncId(id: string | null) {
  if (!id) localStorage.removeItem(SYNC_ID_KEY); else localStorage.setItem(SYNC_ID_KEY, id);
}

export function getBaseUrl(): string | null {
  return localStorage.getItem(BASE_URL_KEY);
}

export function setBaseUrl(url: string | null) {
  if (!url) localStorage.removeItem(BASE_URL_KEY); else localStorage.setItem(BASE_URL_KEY, url);
}

export function loadLocalMonth(month: string): MonthPayload | null {
  const key = DATA_PREFIX + month;
  const payload = loadMonthFromKey(key);
  if (payload) return payload;
  for (const legacyPrefix of LEGACY_LOG_PREFIXES) {
    const legacyKey = legacyPrefix + month;
    const legacyPayload = loadMonthFromKey(legacyKey);
    if (!legacyPayload) continue;
    localStorage.setItem(key, JSON.stringify(persistMonthPayload(legacyPayload)));
    localStorage.removeItem(legacyKey);
    return legacyPayload;
  }
  return null;
}

const debounceMap = new Map<string, number>();
function debounce(key: string, fn: () => void, ms: number) {
  const prev = debounceMap.get(key);
  if (prev) clearTimeout(prev);
  const t = window.setTimeout(fn, ms);
  debounceMap.set(key, t);
}

export function saveLocalMonthDebounced(month: string, payload: MonthPayload, ms = 300) {
  debounce('local:' + month, () => {
    localStorage.setItem(DATA_PREFIX + month, JSON.stringify(persistMonthPayload(payload)));
  }, ms);
}

export async function loadRemoteMonth(baseUrl: string, syncId: string, month: string): Promise<MonthPayload | null> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/storage/${encodeURIComponent(syncId)}/${encodeURIComponent(month)}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return normalizeMonthPayload(await resp.json());
  } catch {
    return null;
  }
}

export function saveRemoteMonthDebounced(baseUrl: string, syncId: string, month: string, payload: MonthPayload, ms = 500) {
  debounce('remote:' + month, async () => {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/api/storage/${encodeURIComponent(syncId)}/${encodeURIComponent(month)}`;
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persistMonthPayload(payload)),
      });
    } catch { /* ignore */ }
  }, ms);
}
