import { AppState } from '../types';

const KEY = 'peso-coach-state-v1';
const LEGACY_KEYS = ['peso-coach-state', 'peso-coach.state'];
const STATE_SCHEMA_VERSION = 1;

type PersistedState = { version: number; state: AppState };

function normalizeState(input: unknown): AppState | null {
  if (!input || typeof input !== 'object') return null;
  const wrapped = input as PersistedState;
  if (wrapped.state && typeof wrapped.state === 'object') return wrapped.state;
  const legacy = input as AppState;
  if (legacy.logs && legacy.settings) return legacy;
  return null;
}

function parseState(raw: string): AppState | null {
  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function migrateLegacyState(): AppState | null {
  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const state = parseState(raw);
    if (!state) continue;
    saveState(state);
    localStorage.removeItem(key);
    return state;
  }
  return null;
}

export function saveState(state: AppState) {
  const payload: PersistedState = { version: STATE_SCHEMA_VERSION, state };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadState(): AppState | null {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const state = parseState(raw);
    if (state) return state;
  }
  return migrateLegacyState();
}

export function exportJSON(state: AppState): string {
  return JSON.stringify({ version: STATE_SCHEMA_VERSION, state }, null, 2);
}

export function importJSON(json: string): AppState {
  const parsed = JSON.parse(json) as unknown;
  const state = normalizeState(parsed);
  if (!state) throw new Error('Invalid import JSON');
  return state;
}

export async function remoteBackup(state: AppState): Promise<{ ok: boolean; error?: string }>{
  const { workerURL, bearerToken } = state;
  if (!workerURL || !bearerToken) return { ok: false, error: 'Configurar URL e token.' };
  try {
    const resp = await fetch(workerURL.replace(/\/$/, '') + '/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearerToken}` },
      body: JSON.stringify(state),
    });
    if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Erro de rede' };
  }
}

export async function remoteRestore(workerURL?: string, bearerToken?: string): Promise<AppState | null> {
  if (!workerURL || !bearerToken) return null;
  try {
    const resp = await fetch(workerURL.replace(/\/$/, '') + '/restore', {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as AppState;
    return data;
  } catch {
    return null;
  }
}
