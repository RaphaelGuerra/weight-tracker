import React, { useMemo, useState } from 'react';

type SyncStatus = 'off' | 'idle' | 'loading' | 'ok' | 'error';

type Props = {
  onOpenCheckpoints: () => void;
  syncId: string | null;
  status: SyncStatus;
  onConnect: (id: string) => void;
  onDisconnect: () => void;
};

export default function TopBar({ onOpenCheckpoints, syncId, status, onConnect, onDisconnect }: Props) {
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

  return (
    <header className="topbar" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
      <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Peso Coach{syncId ? ` – Sync: ${syncId}` : ''}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span title={`status: ${status}`} style={{ width: 10, height: 10, borderRadius: 9999, background: dotColor, display: 'inline-block' }} />
        <input
          type="text"
          placeholder="Sync ID (ex.: UUID)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ minWidth: 200 }}
        />
        {connected ? (
          <button title="Desconectar (⎋)" onClick={onDisconnect}>⎋</button>
        ) : (
          <button title="Conectar (⏎)" onClick={() => draft && onConnect(draft)}>⏎</button>
        )}
        <button onClick={onOpenCheckpoints}>Definições de Checkpoints</button>
      </div>
    </header>
  );
}
