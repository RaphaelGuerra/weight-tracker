import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import { exportJSON, importJSON, remoteBackup, remoteRestore } from '../lib/storage';

type Props = {
  state: AppState;
  onState: (s: AppState) => void;
};

export default function BackupCard({ state, onState }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [url, setUrl] = useState<string>(state.workerURL ?? '');
  const [token, setToken] = useState<string>(state.bearerToken ?? '');
  const [msg, setMsg] = useState<string>('');

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

