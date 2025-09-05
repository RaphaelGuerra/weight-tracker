import React, { useMemo, useState } from 'react';
import { DayLog } from '../types';
import { todayISO } from '../lib/dates';

type Props = {
  onSave: (log: DayLog) => void;
};

export default function TodayCard({ onSave }: Props) {
  const [dateISO, setDateISO] = useState<string>(todayISO());
  const [morningKg, setMorningKg] = useState<string>('');
  const [nightKg, setNightKg] = useState<string>('');
  const diff = useMemo(() => {
    const m = parseFloat(morningKg);
    const n = parseFloat(nightKg);
    if (!isFinite(m) || !isFinite(n)) return '';
    return (n - m).toFixed(2);
  }, [morningKg, nightKg]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(morningKg);
    const n = parseFloat(nightKg);
    const log: DayLog = { dateISO };
    if (isFinite(m)) log.morningKg = m;
    if (isFinite(n)) log.nightKg = n;
    if (!log.morningKg && !log.nightKg) return;
    onSave(log);
  };

  return (
    <article>
      <header><strong>Hoje</strong></header>
      <form onSubmit={submit}>
        <div className="grid">
          <label>Data
            <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} required />
          </label>
          <label>Peso manhã (kg)
            <input type="number" step="0.1" inputMode="decimal" value={morningKg} onChange={(e) => setMorningKg(e.target.value)} placeholder="ex: 81.2" />
          </label>
          <label>Peso noite (kg)
            <input type="number" step="0.1" inputMode="decimal" value={nightKg} onChange={(e) => setNightKg(e.target.value)} placeholder="ex: 82.0" />
          </label>
          <label>Dif. noite–manhã (kg)
            <input type="text" disabled value={diff} />
          </label>
        </div>
        <button type="submit">Salvar</button>
      </form>
    </article>
  );
}

