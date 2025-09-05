import React, { useMemo } from 'react';
import { DayLog } from '../types';
import { lastNDays } from '../lib/dates';
import { rollingMean7d } from '../lib/compute';

type Props = { logs: DayLog[]; onEdit: (log: DayLog) => void };

export default function DataTableCard({ logs, onEdit }: Props) {
  const byDate = new Map<string, DayLog>(logs.map((l) => [l.dateISO, l]));
  const last60 = lastNDays(60).reverse();
  const means = useMemo(() => new Map(rollingMean7d(logs).map(r => [r.dateISO, r.meanKg])), [logs]);
  return (
    <article>
      <header><strong>Dados (últimos 60 dias)</strong></header>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Manhã</th><th>Noite</th><th>Dif</th><th>Média7d</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {last60.map((d) => {
              const l = byDate.get(d);
              const diff = l?.nightKg != null && l?.morningKg != null ? (l.nightKg - l.morningKg).toFixed(2) : '';
              const m = means.get(d);
              return (
                <tr key={d}>
                  <td>{d}</td>
                  <td>{l?.morningKg ?? ''}</td>
                  <td>{l?.nightKg ?? ''}</td>
                  <td>{diff}</td>
                  <td>{m != null ? m.toFixed(2) : ''}</td>
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

