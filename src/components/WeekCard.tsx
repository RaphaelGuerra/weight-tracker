import React, { useMemo } from 'react';
import { DayLog, Settings } from '../types';
import { findActiveCheckpoint, findActiveFatCheckpoint, pickCurrentWeightKg, rollingMean7d, rollingMean7dFatPct, statusVsCheckpoint, statusVsRange, weeklyVariationFatPct, weeklyVariationKg } from '../lib/compute';

type Props = { logs: DayLog[]; settings: Settings };

export default function WeekCard({ logs, settings }: Props) {
  // Weight (soft)
  const mean7Kg = useMemo(() => {
    const arr = rollingMean7d(logs);
    const last = arr.filter((r) => r.meanKg != null).at(-1);
    return last?.meanKg ?? null;
  }, [logs]);
  const variationKg = useMemo(() => weeklyVariationKg(logs), [logs]);
  const currentWeight = useMemo(() => pickCurrentWeightKg(logs), [logs]);
  const weightCheckpoint = useMemo(() => (currentWeight ? findActiveCheckpoint(settings, logs.at(-1)?.dateISO ?? new Date().toISOString().slice(0,10)) : null), [settings, logs, currentWeight]);
  const weightStatus = useMemo(() => (currentWeight && weightCheckpoint ? statusVsCheckpoint(currentWeight, weightCheckpoint) : null), [currentWeight, weightCheckpoint]);

  // Fat% (hard)
  const mean7Pct = useMemo(() => {
    const arr = rollingMean7dFatPct(logs);
    const last = arr.filter((r) => r.meanPct != null).at(-1);
    return last?.meanPct ?? null;
  }, [logs]);
  const variationPct = useMemo(() => weeklyVariationFatPct(logs), [logs]);
  const lastBf = useMemo(() => {
    const vals = logs.filter(l => typeof l.bodyFatPct === 'number').sort((a,b)=>a.dateISO.localeCompare(b.dateISO));
    return vals.at(-1)?.bodyFatPct ?? null;
  }, [logs]);
  const fatCheckpoint = useMemo(() => (lastBf != null ? findActiveFatCheckpoint(settings, logs.at(-1)?.dateISO ?? new Date().toISOString().slice(0,10)) : null), [settings, logs, lastBf]);
  const fatStatus = useMemo(() => (lastBf != null && fatCheckpoint ? statusVsRange(lastBf, fatCheckpoint.lowPct, fatCheckpoint.highPct) : null), [lastBf, fatCheckpoint]);

  return (
    <article>
      <header><strong>Semana</strong></header>
      <div className="grid">
        <div>
          <small>Gordura % média 7d (hard)</small>
          <h3>{mean7Pct != null ? mean7Pct.toFixed(2) + ' %' : '—'}</h3>
        </div>
        <div>
          <small>Gordura % variação semanal</small>
          <h3>{variationPct != null ? variationPct.toFixed(2) + ' pp' : '—'}</h3>
        </div>
        <div>
          <small>Status vs checkpoint (Gordura %)</small>
          <h3>
            {fatStatus === 'ok' && '✅ ok'}
            {fatStatus === 'warn' && '⚠️ atenção'}
            {fatStatus === 'high' && '❌ acima'}
            {fatStatus == null && '—'}
          </h3>
          {fatCheckpoint && <small>Faixa: {fatCheckpoint.lowPct}–{fatCheckpoint.highPct}% até {fatCheckpoint.endDateISO}</small>}
        </div>
      </div>
      <hr />
      <div className="grid">
        <div>
          <small>Peso média 7d (soft)</small>
          <h3>{mean7Kg != null ? mean7Kg.toFixed(2) + ' kg' : '—'}</h3>
        </div>
        <div>
          <small>Peso variação semanal</small>
          <h3>{variationKg != null ? variationKg.toFixed(2) + ' kg' : '—'}</h3>
        </div>
        <div>
          <small>Status vs checkpoint (Peso)</small>
          <h3>
            {weightStatus === 'ok' && '✅ ok'}
            {weightStatus === 'warn' && '⚠️ atenção'}
            {weightStatus === 'high' && '❌ acima'}
            {weightStatus == null && '—'}
          </h3>
          {weightCheckpoint && <small>Faixa: {weightCheckpoint.lowKg}–{weightCheckpoint.highKg} até {weightCheckpoint.endDateISO}</small>}
        </div>
      </div>
    </article>
  );
}
