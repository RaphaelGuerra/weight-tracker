import { Chart, ChartConfiguration } from 'chart.js/auto';
import { DayLog, ProjectionFatPoint, ProjectionPoint, Settings } from '../types';
import { movingAverageOnSeries, nightlySeries } from './compute';

export function buildDailyChartConfig(logs: DayLog[], _rolling: { dateISO: string; meanKg: number | null }[], settings: Settings): ChartConfiguration {
  const series = nightlySeries(logs);
  const labels = series.dates;
  const dataNight = series.values; // nightly values only (official metric)

  const w3 = settings.trendWindowShort ?? 3;
  const w7 = settings.trendWindowLong ?? 7;
  const mm3 = movingAverageOnSeries(series, w3);
  const mm7 = movingAverageOnSeries(series, w7);
  const mm3Map = new Map(mm3.map(r => [r.dateISO, r.value]));
  const mm7Map = new Map(mm7.map(r => [r.dateISO, r.value]));
  const dataMM3 = labels.map(d => mm3Map.get(d) ?? null);
  const dataMM7 = labels.map(d => mm7Map.get(d) ?? null);

  // Detect crossings where MM7 crosses a goal value (up or down)
  const crossingDatasets: ChartConfiguration['data']['datasets'] = [];
  for (let gi = 0; gi < settings.goals.valuesKg.length; gi++) {
    const goal = settings.goals.valuesKg[gi]!;
    const points = labels.map((_, i) => null as number | null);
    let prev: number | undefined;
    for (let i = 0; i < labels.length; i++) {
      const v = dataMM7[i] as number | null;
      if (v == null) { prev = prev; continue; }
      if (prev != null) {
        const a = prev - goal;
        const b = v - goal;
        if (a === 0 || b === 0 || (a < 0 && b > 0) || (a > 0 && b < 0)) {
          points[i] = goal; // marker sits on goal line
        }
      }
      prev = v;
    }
    crossingDatasets.push({
      label: `Cruzou meta ${settings.goals.labels?.[gi] ?? goal}`,
      data: points,
      borderColor: '#f59e0b',
      backgroundColor: '#f59e0b',
      pointRadius: 5,
      pointStyle: 'triangle',
      showLine: false,
    } as any);
  }

  const datasets: ChartConfiguration['data']['datasets'] = [
    { label: 'Peso noturno (pontos)', data: dataNight, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', spanGaps: true, pointRadius: 3, showLine: false },
    { label: 'MM3', data: dataMM3, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)', spanGaps: true, pointRadius: 0, borderWidth: 2 },
    { label: 'MM7', data: dataMM7, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.2)', spanGaps: true, pointRadius: 0, borderWidth: 3 },
    ...crossingDatasets,
    ...settings.goals.valuesKg.map((g, i) => ({
      label: settings.goals.labels?.[i] ?? `Meta ${g}`,
      data: labels.map(() => g),
      borderColor: '#f59e0b',
      borderDash: [6, 6],
      pointRadius: 0,
    })),
  ];
  return { type: 'line', data: { labels, datasets }, options: { responsive: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: false } } } };
}

export function buildProjectionChartConfig(proj: ProjectionPoint[], settings: Settings): ChartConfiguration {
  const labels = proj.map(p => p.dateISO);
  const data = proj.map(p => p.kg);
  const datasets: ChartConfiguration['data']['datasets'] = [
    { label: 'Projeção', data, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.2)' },
    ...settings.goals.valuesKg.map((g, i) => ({
      label: settings.goals.labels?.[i] ?? `Meta ${g}`,
      data: labels.map(() => g),
      borderColor: '#f59e0b',
      borderDash: [6, 6],
      pointRadius: 0,
    })),
  ];
  return { type: 'line', data: { labels, datasets }, options: { responsive: true, plugins: { legend: { position: 'top' } } } };
}

export function ensureChart(ctx: CanvasRenderingContext2D, cfg: ChartConfiguration, prev?: Chart | null): Chart {
  if (prev) prev.destroy();
  return new Chart(ctx, cfg);
}

export function buildFatDailyChartConfig(logs: DayLog[], rolling: { dateISO: string; meanPct: number | null }[], settings: Settings): ChartConfiguration {
  const byDate = new Map<string, number>();
  for (const l of logs) if (typeof l.bodyFatPct === 'number') byDate.set(l.dateISO, l.bodyFatPct);
  const dates = [...byDate.keys()].sort();
  const labels = dates;
  const meanMap = new Map(rolling.filter(r => r.meanPct != null).map(r => [r.dateISO, r.meanPct as number]));
  const dataDaily = labels.map(d => (byDate.get(d) ?? null));
  const dataMean = labels.map(d => (meanMap.get(d) ?? null));
  const datasets: ChartConfiguration['data']['datasets'] = [
    { label: 'Gordura % diária', data: dataDaily, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.2)', spanGaps: true },
    { label: 'Gordura % média 7d', data: dataMean, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.2)', spanGaps: true },
    ...settings.fatGoals.valuesPct.map((g, i) => ({
      label: settings.fatGoals.labels?.[i] ?? `Meta ${g}%`,
      data: labels.map(() => g),
      borderColor: '#f59e0b',
      borderDash: [6, 6],
      pointRadius: 0,
    })),
  ];
  return { type: 'line', data: { labels, datasets }, options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { suggestedMin: 10, suggestedMax: 35 } } } };
}
export function buildFatProjectionChartConfig(proj: ProjectionFatPoint[], settings: Settings): ChartConfiguration {
  const labels = proj.map(p => p.dateISO);
  const data = proj.map(p => p.fatPct);
  const datasets: ChartConfiguration['data']['datasets'] = [
    { label: 'Projeção Gordura %', data, borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.2)' },
    ...settings.fatGoals.valuesPct.map((g, i) => ({
      label: settings.fatGoals.labels?.[i] ?? `Meta ${g}%`,
      data: labels.map(() => g),
      borderColor: '#f59e0b',
      borderDash: [6, 6],
      pointRadius: 0,
    })),
  ];
  return { type: 'line', data: { labels, datasets }, options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { suggestedMin: 10, suggestedMax: 35 } } } };
}
