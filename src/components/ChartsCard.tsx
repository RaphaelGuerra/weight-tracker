import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { DayLog, ProjectionPoint, Settings } from '../types';
import { buildDailyChartConfig, buildFatDailyChartConfig, buildProjectionChartConfig, ensureChart } from '../lib/charts';
import { rollingMean7d, rollingMean7dFatPct } from '../lib/compute';

type Props = {
  logs: DayLog[];
  settings: Settings;
  projection: ProjectionPoint[];
};

export default function ChartsCard({ logs, settings, projection }: Props) {
  const dailyRef = useRef<HTMLCanvasElement | null>(null);
  const fatRef = useRef<HTMLCanvasElement | null>(null);
  const projRef = useRef<HTMLCanvasElement | null>(null);
  const [dailyChart, setDailyChart] = useState<Chart | null>(null);
  const [fatChart, setFatChart] = useState<Chart | null>(null);
  const [projChart, setProjChart] = useState<Chart | null>(null);

  useEffect(() => {
    if (!dailyRef.current) return;
    const cfg = buildDailyChartConfig(logs, rollingMean7d(logs), settings);
    const chart = ensureChart(dailyRef.current.getContext('2d')!, cfg, dailyChart);
    setDailyChart(chart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(logs), JSON.stringify(settings.goals)]);

  useEffect(() => {
    if (!fatRef.current) return;
    const cfg = buildFatDailyChartConfig(logs, rollingMean7dFatPct(logs), settings);
    const chart = ensureChart(fatRef.current.getContext('2d')!, cfg, fatChart);
    setFatChart(chart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(logs), JSON.stringify(settings.fatGoals)]);

  useEffect(() => {
    if (!projRef.current) return;
    const cfg = buildProjectionChartConfig(projection, settings);
    const chart = ensureChart(projRef.current.getContext('2d')!, cfg, projChart);
    setProjChart(chart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(projection), JSON.stringify(settings.goals)]);

  return (
    <article>
      <header><strong>Gráficos</strong></header>
      <div>
        <h5>Gordura % diária + média 7d + metas (hard)</h5>
        <canvas ref={fatRef} height={140} />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <h5>Peso diário + média 7d + metas (soft)</h5>
        <canvas ref={dailyRef} height={140} />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <h5>Curva projetada</h5>
        <canvas ref={projRef} height={140} />
      </div>
    </article>
  );
}
