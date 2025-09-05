import React, { useMemo } from 'react';
import { DayLog, Settings } from '../types';
import { findActiveCheckpoint, pickCurrentWeightKg, rollingMean7d, statusVsCheckpoint, weeklyVariationKg } from '../lib/compute';

type Props = { logs: DayLog[]; settings: Settings };

export default function WeekCard({ logs, settings }: Props) {
  const mean7 = useMemo(() => {
    const arr = rollingMean7d(logs);
    const last = arr.filter((r) => r.meanKg != null).at(-1);
    return last?.meanKg ?? null;
  }, [logs]);
  const variation = useMemo(() => weeklyVariationKg(logs), [logs]);
  const currentWeight = useMemo(() => pickCurrentWeightKg(logs), [logs]);
  const checkpoint = useMemo(() => (currentWeight ? findActiveCheckpoint(settings, logs.at(-1)?.dateISO ?? new Date().toISOString().slice(0,10)) : null), [settings, logs, currentWeight]);
  const status = useMemo(() => (currentWeight && checkpoint ? statusVsCheckpoint(currentWeight, checkpoint) : null), [currentWeight, checkpoint]);

  return (
    <article>
      <header><strong>Semana</strong></header>
      <div className="grid">
        <div>
          <small>Média 7d</small>
          <h3>{mean7 ? mean7.toFixed(2) + ' kg' : '—'}</h3>
        </div>
        <div>
          <small>Variação semanal</small>
          <h3>{variation != null ? variation.toFixed(2) + ' kg' : '—'}</h3>
        </div>
        <div>
          <small>Status vs checkpoint</small>
          <h3>
            {status === 'ok' && '✅ ok'}
            {status === 'warn' && '⚠️ atenção'}
            {status === 'high' && '❌ acima'}
            {status == null && '—'}
          </h3>
          {checkpoint && <small>Faixa: {checkpoint.lowKg}–{checkpoint.highKg} até {checkpoint.endDateISO}</small>}
        </div>
      </div>
    </article>
  );
}

