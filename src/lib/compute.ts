import { addDays, differenceInCalendarDays, isBefore, isSameDay, parseISO } from 'date-fns';
import { AppState, DayLog, ProjectionPoint, Settings, WeeklyCheckpoint } from '../types';
import { fmtISO, weekEnd, weekStart } from './dates';

export function rollingMean7d(logs: DayLog[]): { dateISO: string; meanKg: number | null }[] {
  const byDate = new Map<string, number>();
  for (const l of logs) {
    const vals = [l.morningKg, l.nightKg].filter((v): v is number => typeof v === 'number');
    if (vals.length) byDate.set(l.dateISO, vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  const dates = [...byDate.keys()].sort();
  return dates.map((d, i) => {
    const slice = dates.slice(Math.max(0, i - 6), i + 1);
    const vals = slice.map((s) => byDate.get(s)!).filter((v) => typeof v === 'number');
    return { dateISO: d, meanKg: vals.length === 7 ? vals.reduce((a, b) => a + b, 0) / 7 : null };
  });
}

export function pickCurrentWeightKg(logs: DayLog[]): number | null {
  if (!logs.length) return null;
  const last = [...logs].sort((a, b) => a.dateISO.localeCompare(b.dateISO)).at(-1)!;
  if (typeof last.nightKg === 'number') return last.nightKg;
  if (typeof last.morningKg === 'number') return last.morningKg;
  return null;
}

export function statusVsCheckpoint(weightKg: number, checkpoint: WeeklyCheckpoint): 'ok' | 'warn' | 'high' {
  if (weightKg <= checkpoint.highKg && weightKg >= checkpoint.lowKg) return 'ok';
  if (weightKg > checkpoint.highKg) return 'high';
  return 'warn';
}

export function findActiveCheckpoint(settings: Settings, dateISO: string): WeeklyCheckpoint | null {
  const end = weekEnd(dateISO);
  const endISO = fmtISO(end);
  const found = [...settings.checkpoints].sort((a, b) => a.endDateISO.localeCompare(b.endDateISO)).find((c) => c.endDateISO >= endISO);
  return found || null;
}

export function findActiveFatCheckpoint(settings: Settings, dateISO: string): { endDateISO: string; lowPct: number; highPct: number } | null {
  const end = weekEnd(dateISO);
  const endISO = fmtISO(end);
  const found = [...settings.fatCheckpoints]
    .sort((a, b) => a.endDateISO.localeCompare(b.endDateISO))
    .find((c) => c.endDateISO >= endISO);
  return found || null;
}

export function weeklyVariationKg(logs: DayLog[]): number | null {
  if (logs.length < 8) return null;
  const byDate = new Map<string, number>();
  for (const l of logs) {
    const vals = [l.morningKg, l.nightKg].filter((v): v is number => typeof v === 'number');
    if (vals.length) byDate.set(l.dateISO, vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  const dates = [...byDate.keys()].sort();
  if (dates.length === 0) return null;
  const last = dates[dates.length - 1]!;
  const prevIdx = dates.findIndex((d) => differenceInCalendarDays(parseISO(last), parseISO(d)) === 7);
  if (prevIdx === -1) return null;
  return byDate.get(last)! - byDate.get(dates[prevIdx]!)!;
}

export function weeklyVariationFatPct(logs: DayLog[]): number | null {
  const byDate = new Map<string, number>();
  for (const l of logs) if (typeof l.bodyFatPct === 'number') byDate.set(l.dateISO, l.bodyFatPct);
  const dates = [...byDate.keys()].sort();
  if (dates.length < 8) return null;
  const last = dates[dates.length - 1]!;
  const prevIdx = dates.findIndex((d) => differenceInCalendarDays(parseISO(last), parseISO(d)) === 7);
  if (prevIdx === -1) return null;
  return byDate.get(last)! - byDate.get(dates[prevIdx]!)!;
}

export function rollingMean7dFatPct(logs: DayLog[]): { dateISO: string; meanPct: number | null }[] {
  const byDate = new Map<string, number>();
  for (const l of logs) {
    if (typeof l.bodyFatPct === 'number') byDate.set(l.dateISO, l.bodyFatPct);
  }
  const dates = [...byDate.keys()].sort();
  return dates.map((d, i) => {
    const slice = dates.slice(Math.max(0, i - 6), i + 1);
    const vals = slice.map((s) => byDate.get(s)!).filter((v) => typeof v === 'number');
    return { dateISO: d, meanPct: vals.length === 7 ? vals.reduce((a, b) => a + b, 0) / 7 : null };
  });
}

export function statusVsRange(value: number, low: number, high: number): 'ok' | 'warn' | 'high' {
  if (value <= high && value >= low) return 'ok';
  if (value > high) return 'high';
  return 'warn';
}

// Nonlinear projection per spec
export function simulateProjection(state: AppState, initialWeightKg: number, initialDateISO: string): ProjectionPoint[] {
  const p = state.settings.projection;
  const kcalPerKg = p.kcalPerKg;
  const calib = p.bmr / (500 + 22 * p.ffmKg);
  let currentFFM = p.ffmKg;
  let currentWeight = initialWeightKg;
  let cursor = weekStart(initialDateISO); // start from week start (Sun)
  const out: ProjectionPoint[] = [];

  // Simulate 26 weeks by default or until phase2 end if set
  const maxWeeks = 26;
  for (let w = 0; w < maxWeeks; w++) {
    let weeklyDeficit = 0; // TDEE - intake
    for (let d = 0; d < 7; d++) {
      const date = addDays(cursor, d);
      const dateISO = fmtISO(date);
      const inPhase1 = !isBefore(date, parseISO(p.phase1.startISO)) && !isBefore(parseISO(p.phase1.endISO), date);
      const inPhase2 = isBefore(parseISO(p.phase2.startISO), addDays(date, 1)); // from phase2.start inclusive

      // Calibrated BMR from current FFM
      const bmr = (500 + 22 * currentFFM) * calib;
      const kgLost = initialWeightKg - currentWeight;
      const tdee = bmr * p.pal - p.tdeeDropPerKg * Math.max(0, kgLost);

      let intake = inPhase1 && !inPhase2 ? p.phase1.intakeKcal : (isTrainingDay(p, date) ? p.phase2.intakeTraining : p.phase2.intakeRest);

      // Weekend surplus Sat(6) Sun(0)
      const dow = date.getDay();
      if (p.weekendSurplusKcal && (dow === 0 || dow === 6)) intake += p.weekendSurplusKcal;

      weeklyDeficit += (tdee - intake);
    }

    const deltaKg = weeklyDeficit / kcalPerKg; // positive = loss
    const ffmLoss = Math.max(0, deltaKg) * p.ffmFraction;
    currentFFM = Math.max(55, currentFFM - ffmLoss);
    currentWeight = currentWeight - deltaKg;

    const weekEndDate = addDays(cursor, 6);
    out.push({ dateISO: fmtISO(weekEndDate), kg: Number(currentWeight.toFixed(2)) });

    cursor = addDays(cursor, 7);
    const endISO = p.phase2.endISO;
    if (endISO && isBefore(parseISO(endISO), cursor)) break;
  }
  return out;
}

function isTrainingDay(p: AppState['settings']['projection'], date: Date) {
  // trainingDays array uses 1..7 Mon..Sun
  const dow = date.getDay(); // 0..6 Sun..Sat
  const as1to7 = dow === 0 ? 7 : dow; // 1..7
  return p.phase2.trainingDays.includes(as1to7);
}
