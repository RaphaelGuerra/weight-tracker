import React, { useMemo } from 'react';
import { DayLog, Settings } from '../types';
import { lastNDays } from '../lib/dates';
import { movingAverageOnSeries, nightlySeries, statusFor } from '../lib/compute';

type Props = { logs: DayLog[]; settings: Settings; onEdit: (log: DayLog) => void };

export default function DataTableCard({ logs, settings, onEdit }: Props) {
  const byDate = new Map<string, DayLog>(logs.map((l) => [l.dateISO, l]));
  const days = lastNDays(90).reverse();

  const { mm3Map, mm7Map } = useMemo(() => {
    const series = nightlySeries(logs);
    const mm3 = movingAverageOnSeries(series, (settings.trendWindowShort ?? 3));
    const mm7 = movingAverageOnSeries(series, (settings.trendWindowLong ?? 7));
    return { mm3Map: new Map(mm3.map(x => [x.dateISO, x.value])), mm7Map: new Map(mm7.map(x => [x.dateISO, x.value])) };
  }, [logs, settings.trendWindowShort, settings.trendWindowLong]);
  return (
    <article>
      <header><strong>Dados (últimos 90 dias)</strong></header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th className="hide-sm">Manhã</th>
              <th>Noite</th>
              <th className="hide-sm">Dif</th>
              <th>MM3</th>
              <th className="hide-sm">MM7</th>
              <th>Status</th>
              <th className="hide-sm">Gordura %</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const l = byDate.get(d);
              const diff = l?.nightKg != null && l?.morningKg != null ? (l.nightKg - l.morningKg).toFixed(2) : '';
              const m3 = mm3Map.get(d);
              const m7 = mm7Map.get(d);
              const status = m3 != null ? statusFor(d, m3, settings.checkpoints) : null;
              return (
                <tr key={d}>
                  <td>{d}</td>
                  <td className="hide-sm">{l?.morningKg ?? ''}</td>
                  <td>{l?.nightKg ?? ''}</td>
                  <td className="hide-sm">{diff}</td>
                  <td>{m3 != null ? m3.toFixed(2) : ''}</td>
                  <td className="hide-sm">{m7 != null ? m7.toFixed(2) : ''}</td>
                  <td>
                    {status === 'ok' && '✅'}
                    {status === 'warn' && '⚠️'}
                    {status === 'bad' && '❌'}
                    {status == null && ''}
                  </td>
                  <td className="hide-sm">{l?.bodyFatPct != null ? l.bodyFatPct.toFixed(2) : ''}</td>
                  <td><button onClick={() => onEdit({ dateISO: d, morningKg: l?.morningKg, nightKg: l?.nightKg })}>Editar</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
