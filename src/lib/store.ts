import { DayLog } from '../types';

const SYNC_ID_KEY = 'peso.v1.syncId';
const DATA_PREFIX = 'peso.v1.data.'; // + YYYY-MM

export type MonthPayload = { logs: DayLog[] };

export function monthFromISO(dateISO: string): string {
  return dateISO.slice(0, 7); // YYYY-MM
}

export function getSyncId(): string | null {
  return localStorage.getItem(SYNC_ID_KEY);
}

export function setSyncId(id: string | null) {
  if (!id) localStorage.removeItem(SYNC_ID_KEY); else localStorage.setItem(SYNC_ID_KEY, id);
}

export function loadLocalMonth(month: string): MonthPayload | null {
  const raw = localStorage.getItem(DATA_PREFIX + month);
  if (!raw) return null;
  try { return JSON.parse(raw) as MonthPayload; } catch { return null; }
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
    localStorage.setItem(DATA_PREFIX + month, JSON.stringify(payload));
  }, ms);
}

export async function loadRemoteMonth(baseUrl: string, syncId: string, month: string): Promise<MonthPayload | null> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/storage/${encodeURIComponent(syncId)}/${encodeURIComponent(month)}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return (await resp.json()) as MonthPayload;
  } catch {
    return null;
  }
}

export function saveRemoteMonthDebounced(baseUrl: string, syncId: string, month: string, payload: MonthPayload, ms = 800) {
  debounce('remote:' + month, async () => {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/api/storage/${encodeURIComponent(syncId)}/${encodeURIComponent(month)}`;
      await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch { /* ignore */ }
  }, ms);
}

