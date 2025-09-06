import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import TopBar from './components/TopBar';
import TodayCard from './components/TodayCard';
import WeekCard from './components/WeekCard';
import GoalsProjectionCard from './components/GoalsProjectionCard';
import ChartsCard from './components/ChartsCard';
import DataTableCard from './components/DataTableCard';
import BackupCard from './components/BackupCard';
import CheckpointsModal from './components/CheckpointsModal';
import { AppState, DayLog, ProjectionFatPoint, ProjectionPoint } from './types';
import { defaultSettings } from './lib/defaults';
import { loadState, saveState } from './lib/storage';
import { getBaseUrl, getSyncId, loadRemoteMonth, monthFromISO, saveLocalMonthDebounced, saveRemoteMonthDebounced, setBaseUrl, setSyncId } from './lib/store';
import { simulateProjection, simulateFatProjection } from './lib/compute';

const loadInitial = (): AppState => {
  return (
    loadState() || {
      logs: [],
      settings: defaultSettings,
    }
  );
};

function App() {
  const [state, setState] = useState<AppState>(() => loadInitial());
  const [projection, setProjection] = useState<ProjectionPoint[]>([]);
  const [fatProjection, setFatProjection] = useState<ProjectionFatPoint[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');
  const [activeSyncId, setActiveSyncId] = useState<string | null>(() => getSyncId());
  const [baseUrl, setBaseUrlState] = useState<string | null>(() => getBaseUrl());
  const [toast, setToast] = useState<string>('');

  const showToast = (t: string, ms = 1800) => {
    setToast(t);
    window.setTimeout(() => setToast(''), ms);
  };

  const recalc = () => {
    const initialWeight = (() => {
      const last = [...state.logs].sort((a, b) => a.dateISO.localeCompare(b.dateISO)).at(-1);
      if (last?.nightKg != null) return last.nightKg;
      if (last?.morningKg != null) return last.morningKg;
      return 80; // fallback
    })();
    const initialDateISO = state.logs.at(-1)?.dateISO ?? new Date().toISOString().slice(0, 10);
    const proj = simulateProjection(state, initialWeight, initialDateISO);
    setProjection(proj);
    const lastBf = (() => {
      const withBf = state.logs.filter(l => typeof l.bodyFatPct === 'number').sort((a,b)=>a.dateISO.localeCompare(b.dateISO));
      return withBf.length ? withBf[withBf.length-1]!.bodyFatPct! : null;
    })();
    if (lastBf != null) {
      setFatProjection(simulateFatProjection(state, initialWeight, lastBf, initialDateISO));
    } else {
      setFatProjection([]);
    }
  };

  const persist = (s: AppState) => {
    setState(s);
    saveState(s);
    // Month-scoped persistence (local + remote if syncId and base URL set via BackupCard)
    const lastDate = s.logs.at(-1)?.dateISO ?? new Date().toISOString();
    const month = monthFromISO(lastDate);
    const prefix = month + '-';
    const monthLogs = s.logs.filter((l) => l.dateISO.startsWith(prefix));
    saveLocalMonthDebounced(month, { logs: monthLogs });
    const syncId = activeSyncId ?? undefined;
    const base = baseUrl ?? undefined;
    if (syncId && base) saveRemoteMonthDebounced(base, syncId, month, { logs: monthLogs });
  };

  const onSaveLog = (log: DayLog) => {
    const others = state.logs.filter((l) => l.dateISO !== log.dateISO);
    const next = { ...state, logs: [...others, log].sort((a, b) => a.dateISO.localeCompare(b.dateISO)) };
    persist(next);
    recalc();
  };

  const onEditLog = (log: DayLog) => {
    // open TodayCard prefilled would be complex; reuse saving directly
    onSaveLog(log);
  };

  const onParamsChange = (p: AppState['settings']['projection']) => persist({ ...state, settings: { ...state.settings, projection: p } });
  const onFatGoalsChange = (g: AppState['settings']['fatGoals']) => persist({ ...state, settings: { ...state.settings, fatGoals: g } });
  const onCheckpointsChange = (c: AppState['settings']['checkpoints']) => persist({ ...state, settings: { ...state.settings, checkpoints: c } });

  const latestBodyFatPct = React.useMemo(() => {
    const withBf = state.logs.filter(l => typeof l.bodyFatPct === 'number').sort((a,b)=>a.dateISO.localeCompare(b.dateISO));
    return withBf.length ? withBf[withBf.length-1]!.bodyFatPct! : null;
  }, [state.logs]);

  React.useEffect(() => { recalc(); /* initial */ }, []);
  // Keep reactive copies of localStorage-based settings (if changed elsewhere)
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'coach.v1.syncId') setActiveSyncId(getSyncId());
      if (e.key === 'coach.v1.baseUrl') setBaseUrlState(getBaseUrl());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  // On mount and when active month, Sync ID or Base URL changes, try remote load; fallback to local
  React.useEffect(() => {
    if (!activeSyncId || !baseUrl) { setSyncStatus('idle'); return; }
    const month = monthFromISO((state.logs.at(-1)?.dateISO ?? new Date().toISOString()));
    setSyncStatus('loading');
    loadRemoteMonth(baseUrl, activeSyncId, month).then((data) => {
      if (data && Array.isArray(data.logs)) {
        const prefix = month + '-';
        const others = state.logs.filter((l) => !l.dateISO.startsWith(prefix));
        const next = { ...state, logs: [...others, ...data.logs].sort((a, b) => a.dateISO.localeCompare(b.dateISO)) };
        setState(next);
        saveState(next);
        setSyncStatus('ok');
        showToast('Sync carregado');
      } else {
        setSyncStatus('error'); // fallback to local content (already in state)
        showToast('Falha de sync');
      }
    }).catch(() => { setSyncStatus('error'); showToast('Falha de sync'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSyncId, baseUrl, monthFromISO((state.logs.at(-1)?.dateISO ?? new Date().toISOString()))]);

  const handleConnect = (id: string) => {
    setSyncId(id);
    setActiveSyncId(id);
    if (!getBaseUrl()) {
      setBaseUrl(window.location.origin);
      setBaseUrlState(window.location.origin);
    }
    setSyncStatus('loading');
    showToast('Sync conectado');
  };

  const handleDisconnect = () => {
    setSyncId(null);
    setActiveSyncId(null);
    setSyncStatus('idle');
    showToast('Sync desconectado');
  };

  return (
    <>
      <TopBar
        onOpenCheckpoints={() => setModalOpen(true)}
        syncId={activeSyncId}
        status={activeSyncId ? syncStatus : 'off'}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      <section className="cards">
        <TodayCard onSave={onSaveLog} />
        <WeekCard logs={state.logs} settings={state.settings} />
        <GoalsProjectionCard params={state.settings.projection} onChange={onParamsChange} onRecalc={recalc} fatGoals={state.settings.fatGoals} onFatGoalsChange={onFatGoalsChange} latestBodyFatPct={latestBodyFatPct} />
        <ChartsCard logs={state.logs} settings={state.settings} projection={projection} fatProjection={fatProjection} />
        <DataTableCard logs={state.logs} onEdit={onEditLog} />
        <BackupCard state={state} onState={persist} />
      </section>
      <footer className="footer">PWA: dados locais no navegador; exporte JSON para portabilidade.</footer>
      {toast && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: 'white', padding: '6px 10px', borderRadius: 6, fontSize: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>{toast}</div>
      )}
      <CheckpointsModal open={modalOpen} onClose={() => setModalOpen(false)} checkpoints={state.settings.checkpoints} fatCheckpoints={state.settings.fatCheckpoints} onChange={onCheckpointsChange} onFatChange={(c)=>persist({ ...state, settings: { ...state.settings, fatCheckpoints: c } })} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
