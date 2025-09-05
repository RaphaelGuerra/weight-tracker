import { AppState } from '../types';

const KEY = 'peso-coach-state-v1';

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function loadState(): AppState | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function exportJSON(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importJSON(json: string): AppState {
  return JSON.parse(json) as AppState;
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

