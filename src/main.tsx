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
import { AppState, DayLog, ProjectionPoint } from './types';
import { defaultSettings } from './lib/defaults';
import { loadState, saveState } from './lib/storage';
import { getBaseUrl, getSyncId, loadRemoteMonth, monthFromISO, saveLocalMonthDebounced, saveRemoteMonthDebounced } from './lib/store';
import { simulateProjection } from './lib/compute';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');

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
    const syncId = getSyncId();
    const base = getBaseUrl() ?? undefined;
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
  const onCheckpointsChange = (c: AppState['settings']['checkpoints']) => persist({ ...state, settings: { ...state.settings, checkpoints: c } });

  React.useEffect(() => { recalc(); /* initial */ }, []);
  // On mount and when active month changes, try remote load if Sync ID is set; fallback to local
  React.useEffect(() => {
    const syncId = getSyncId();
    const base = getBaseUrl();
    if (!syncId || !base) { setSyncStatus('idle'); return; }
    const month = monthFromISO((state.logs.at(-1)?.dateISO ?? new Date().toISOString()));
    setSyncStatus('loading');
    loadRemoteMonth(base, syncId, month).then((data) => {
      if (data && Array.isArray(data.logs)) {
        const prefix = month + '-';
        const others = state.logs.filter((l) => !l.dateISO.startsWith(prefix));
        const next = { ...state, logs: [...others, ...data.logs].sort((a, b) => a.dateISO.localeCompare(b.dateISO)) };
        setState(next);
        saveState(next);
        setSyncStatus('ok');
      } else {
        setSyncStatus('error'); // fallback to local content (already in state)
      }
    }).catch(() => setSyncStatus('error'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFromISO((state.logs.at(-1)?.dateISO ?? new Date().toISOString()))]);

  return (
    <>
      <TopBar onOpenCheckpoints={() => setModalOpen(true)} />
      <section className="cards">
        <TodayCard onSave={onSaveLog} />
        <WeekCard logs={state.logs} settings={state.settings} />
        <GoalsProjectionCard params={state.settings.projection} onChange={onParamsChange} onRecalc={recalc} />
        <ChartsCard logs={state.logs} settings={state.settings} projection={projection} />
        <DataTableCard logs={state.logs} onEdit={onEditLog} />
        <BackupCard state={state} onState={persist} />
      </section>
      <footer className="footer">PWA: dados locais no navegador; exporte JSON para portabilidade.</footer>
      <CheckpointsModal open={modalOpen} onClose={() => setModalOpen(false)} checkpoints={state.settings.checkpoints} onChange={onCheckpointsChange} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
