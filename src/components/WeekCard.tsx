import React, { useMemo } from 'react';
import { DayLog, Settings } from '../types';
import { deltaWeek, findActiveFatCheckpoint, movingAverageOnSeries, nightlySeries, rollingMean7dFatPct, statusFor, statusVsRange, weeklyVariationFatPct } from '../lib/compute';

type Props = { logs: DayLog[]; settings: Settings };

export default function WeekCard({ logs, settings }: Props) {
  // Night weight trends (official): MM3 + MM7 and delta week from MM7
  const mmData = useMemo(() => {
    const series = nightlySeries(logs);
    const w3 = settings.trendWindowShort ?? 3;
    const w7 = settings.trendWindowLong ?? 7;
    const mm3 = movingAverageOnSeries(series, w3);
    const mm7 = movingAverageOnSeries(series, w7);
    const last3 = mm3.at(-1)?.value ?? null;
    const last7 = mm7.at(-1)?.value ?? null;
    const d7 = deltaWeek(mm7 as { dateISO: string; value: number }[]);
    const refDate = logs.at(-1)?.dateISO ?? new Date().toISOString().slice(0,10);
    const status = last3 != null ? statusFor(refDate, last3, settings.checkpoints) : null;
    return { last3, last7, d7, status };
  }, [logs, settings.trendWindowShort, settings.trendWindowLong, settings.checkpoints]);

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
      <div className="stat-grid">
        <div>
          <small>Peso MM3 (noite, pré‑OMAD)</small>
          <h3>{mmData.last3 != null ? mmData.last3.toFixed(2) + ' kg' : '—'}</h3>
        </div>
        <div>
          <small>Peso MM7 (noite)</small>
          <h3>{mmData.last7 != null ? mmData.last7.toFixed(2) + ' kg' : '—'}</h3>
        </div>
        <div>
          <small>∆ 7d (MM7 atual − MM7 -7d)</small>
          <h3>{mmData.d7 != null ? mmData.d7.toFixed(2) + ' kg' : '—'}</h3>
        </div>
        <div>
          <small>Status vs checkpoint (peso noturno)</small>
          <h3>
            {mmData.status === 'ok' && '✅ ok'}
            {mmData.status === 'warn' && '⚠️ atenção'}
            {mmData.status === 'bad' && '❌ acima'}
            {mmData.status == null && '—'}
          </h3>
        </div>
      </div>

      <hr />
      <div className="stat-grid">
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
    </article>
  );
}
