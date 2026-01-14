import React, { useMemo, useState } from 'react';

type SyncStatus = 'off' | 'idle' | 'loading' | 'ok' | 'error';

type Props = {
  onOpenCheckpoints: () => void;
  syncId: string | null;
  status: SyncStatus;
  onConnect: (id: string) => void;
  onDisconnect: () => void;
  lastSyncAt: number | null;
};

export default function TopBar({ onOpenCheckpoints, syncId, status, onConnect, onDisconnect, lastSyncAt }: Props) {
  const [draft, setDraft] = useState<string>(syncId ?? '');
  const connected = Boolean(syncId);

  React.useEffect(() => { setDraft(syncId ?? ''); }, [syncId]);

  const dotColor = useMemo(() => {
    switch (status) {
      case 'loading': return '#f59e0b'; // amber
      case 'ok': return '#10b981'; // emerald
      case 'error': return '#ef4444'; // red
      case 'idle': return '#9ca3af'; // gray
      default: return '#9ca3af';
    }
  }, [status]);

  const lastSyncLabel = useMemo(() => {
    if (!lastSyncAt) return '—';
    return new Date(lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }, [lastSyncAt]);

  return (
    <header className="topbar">
      <h1>Peso Coach</h1>
      <div className="actions">
        <span className="status-dot" title={`status: ${status}`} style={{ background: dotColor }} />
        <span className="sync-meta">Ultimo sync: {lastSyncLabel}</span>
        <details className="actions">
          <summary>Sincronização</summary>
          <div className="panel">
            <input
              type="text"
              placeholder="Sync ID (ex.: UUID)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              style={{ minWidth: 180 }}
            />
            {connected ? (
              <button title="Desconectar (⎋)" onClick={onDisconnect}>⎋</button>
            ) : (
              <button title="Conectar (⏎)" onClick={() => draft && onConnect(draft)}>⏎</button>
            )}
            <button onClick={onOpenCheckpoints}>Checkpoints</button>
          </div>
        </details>
      </div>
    </header>
  );
}
