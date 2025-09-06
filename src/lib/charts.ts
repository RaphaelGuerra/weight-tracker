import { Chart, ChartConfiguration } from 'chart.js/auto';
import { DayLog, ProjectionFatPoint, ProjectionPoint, Settings } from '../types';

export function buildDailyChartConfig(logs: DayLog[], rolling: { dateISO: string; meanKg: number | null }[], settings: Settings): ChartConfiguration {
  const dates = [...new Set(logs.map(l => l.dateISO))].sort();
  const byDate = new Map<string, number>();
  for (const l of logs) {
    const vals = [l.morningKg, l.nightKg].filter((v): v is number => typeof v === 'number');
    if (vals.length) byDate.set(l.dateISO, vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  const avgMap = new Map(rolling.filter(r => r.meanKg != null).map(r => [r.dateISO, r.meanKg as number]));
  const labels = dates;
  const dataDaily = labels.map(d => (byDate.get(d) ?? null));
  const dataMean = labels.map(d => (avgMap.get(d) ?? null));
  const datasets: ChartConfiguration['data']['datasets'] = [
    { label: 'Peso diário', data: dataDaily, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', spanGaps: true },
    { label: 'Peso média 7d', data: dataMean, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.2)', spanGaps: true },
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
