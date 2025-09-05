import React, { useRef, useState } from 'react';
import { AppState, DayLog } from '../types';
import { exportJSON, importJSON, remoteBackup, remoteRestore } from '../lib/storage';
import { getBaseUrl, getSyncId, loadRemoteMonth, monthFromISO, saveRemoteMonthDebounced, setBaseUrl, setSyncId } from '../lib/store';

type Props = {
  state: AppState;
  onState: (s: AppState) => void;
};

export default function BackupCard({ state, onState }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [url, setUrl] = useState<string>(state.workerURL ?? '');
  const [token, setToken] = useState<string>(state.bearerToken ?? '');
  const [msg, setMsg] = useState<string>('');
  const [pagesBase, setPagesBase] = useState<string>(getBaseUrl() ?? '');
  const [syncId, setSyncIdLocal] = useState<string>(getSyncId() ?? '');

  const doExport = () => {
    const blob = new Blob([exportJSON({ ...state, workerURL: url || undefined, bearerToken: token || undefined })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'peso-coach-export.json';
    a.click();
  };

  const doImport = async (f?: File) => {
    const file = f ?? fileRef.current?.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = importJSON(text);
    onState({ ...data, workerURL: url || undefined, bearerToken: token || undefined });
    setMsg('Importado com sucesso.');
  };

  const doBackup = async () => {
    const res = await remoteBackup({ ...state, workerURL: url || undefined, bearerToken: token || undefined });
    setMsg(res.ok ? 'Backup enviado.' : `Falha no backup: ${res.error}`);
  };

  const doRestore = async () => {
    const data = await remoteRestore(url, token);
    if (data) { onState({ ...data, workerURL: url || undefined, bearerToken: token || undefined }); setMsg('Restaurado do remoto.'); } else { setMsg('Falha ao restaurar.'); }
  };

  return (
    <article>
      <header><strong>Backup</strong></header>
      <div className="grid">
        <button onClick={doExport}>Exportar JSON</button>
        <label>
          Importar JSON
          <input type="file" accept="application/json" ref={fileRef} onChange={() => doImport()} />
        </label>
      </div>
      <details>
        <summary>Sincronização (Cloudflare Pages Functions)</summary>
        <div className="grid">
          <label>Base URL do site (Pages)
            <input type="url" placeholder="https://<projeto>.pages.dev" value={pagesBase} onChange={(e) => setPagesBase(e.target.value)} />
          </label>
          <label>Sync ID (alto entropia)
            <input type="text" value={syncId} onChange={(e) => setSyncIdLocal(e.target.value)} />
          </label>
          <div>
            <small>Armazenado no navegador em coach.v1.syncId</small>
          </div>
        </div>
        <div className="grid">
          <button onClick={() => { setSyncId(syncId || null); setMsg('Sync ID atualizado.'); }}>Salvar Sync ID</button>
          <button onClick={() => { setBaseUrl(pagesBase || null); setMsg('Base URL salva.'); }}>Salvar Base URL</button>
          <button onClick={async () => {
            const id = syncId || getSyncId();
            if (!id || !pagesBase) { setMsg('Preencha base URL e Sync ID.'); return; }
            const month = monthFromISO((state.logs.at(-1)?.dateISO ?? new Date().toISOString()));
            const data = await loadRemoteMonth(pagesBase, id, month);
            if (data) {
              // merge: replace logs for that month
              const prefix = month + '-';
              const others = state.logs.filter(l => !l.dateISO.startsWith(prefix));
              onState({ ...state, logs: [...others, ...data.logs].sort((a,b)=>a.dateISO.localeCompare(b.dateISO)) });
              setMsg('Mês carregado do remoto.');
            } else setMsg('Nada remoto para este mês.');
          }}>Carregar mês remoto</button>
          <button onClick={() => {
            const id = syncId || getSyncId();
            if (!id || !pagesBase) { setMsg('Preencha base URL e Sync ID.'); return; }
            const month = monthFromISO((state.logs.at(-1)?.dateISO ?? new Date().toISOString()));
            const prefix = month + '-';
            const monthLogs: DayLog[] = state.logs.filter(l => l.dateISO.startsWith(prefix));
            saveRemoteMonthDebounced(pagesBase, id, month, { logs: monthLogs }, 0);
            setMsg('Mês salvo no remoto.');
          }}>Salvar mês remoto</button>
        </div>
      </details>
      <details>
        <summary>Backup remoto (Cloudflare Worker)</summary>
        <div className="grid">
          <label>Worker URL
            <input type="url" placeholder="https://seu-worker.workers.dev" value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
          <label>BEARER_TOKEN
            <input type="text" value={token} onChange={(e) => setToken(e.target.value)} />
          </label>
        </div>
        <div className="grid">
          <button onClick={doBackup}>Backup remoto</button>
          <button onClick={doRestore}>Restore remoto</button>
        </div>
      </details>
      {msg && <small>{msg}</small>}
    </article>
  );
}
