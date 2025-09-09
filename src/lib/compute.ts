import { addDays, differenceInCalendarDays, isBefore, isSameDay, parseISO } from 'date-fns';
import { AppState, DayLog, ProjectionFatPoint, ProjectionPoint, Settings, WeeklyCheckpoint } from '../types';
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

// Generic simple moving average helper. Allows partial windows at the start.
export function getMM(values: number[], window: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] ?? 0;
    if (i >= window) sum -= values[i - window] ?? 0;
    const count = Math.min(i + 1, window);
    out.push(sum / count);
  }
  return out;
}

// Build nightly series (official metric) from logs.
export function nightlySeries(logs: DayLog[]): { dates: string[]; values: (number | null)[] } {
  const byDate = new Map<string, number | null>();
  for (const l of logs) {
    const val = typeof l.nightKg === 'number' ? l.nightKg : null;
    byDate.set(l.dateISO, val);
  }
  const dates = [...byDate.keys()].sort();
  const values = dates.map((d) => byDate.get(d) ?? null);
  return { dates, values };
}

// Compute MM window series for a sparse series; ignores nulls by carrying forward only on existing data points.
export function movingAverageOnSeries(series: { dates: string[]; values: (number | null)[] }, window: number): { dateISO: string; value: number | null }[] {
  const vals: number[] = [];
  const dates: string[] = [];
  for (let i = 0; i < series.values.length; i++) {
    const v = series.values[i];
    if (v == null) continue;
    vals.push(v);
    dates.push(series.dates[i]!);
  }
  const mm = getMM(vals, window);
  return dates.map((d, i) => ({ dateISO: d, value: mm[i]! }));
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

// Nearest checkpoint considering same-week or closest future checkpoint.
export function nearestCheckpoint(dateISO: string, cps: WeeklyCheckpoint[]): WeeklyCheckpoint | undefined {
  const sorted = [...cps].sort((a, b) => a.endDateISO.localeCompare(b.endDateISO));
  for (const c of sorted) if (c.endDateISO >= dateISO) return c;
  return sorted.at(-1) ?? undefined;
}

// Status for a given date using MM3 against checkpoint high with +0.5 tolerance.
export function statusFor(dateISO: string, mm3: number, cps: WeeklyCheckpoint[]): 'ok' | 'warn' | 'bad' {
  const c = nearestCheckpoint(dateISO, cps);
  if (!c) return 'warn';
  if (mm3 <= c.highKg) return 'ok';
  if (mm3 <= c.highKg + 0.5) return 'warn';
  return 'bad';
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

// Delta week for a MM series: last value minus value 7 days before (by matching dates).
export function deltaWeek(mmSeries: { dateISO: string; value: number }[]): number | null {
  if (!mmSeries.length) return null;
  const last = mmSeries[mmSeries.length - 1]!;
  const lastDate = parseISO(last.dateISO);
  for (let i = mmSeries.length - 2; i >= 0; i--) {
    const d = mmSeries[i]!;
    if (differenceInCalendarDays(lastDate, parseISO(d.dateISO)) === 7) {
      return last.value - d.value;
    }
  }
  return null;
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

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

// Adiposity-aware FM/FFM projection producing fat% series
export function simulateFatProjection(
  state: AppState,
  initialWeightKg: number,
  initialFatPct: number,
  initialDateISO: string
): ProjectionFatPoint[] {
  const p = state.settings.projection;
  const calib = p.bmr / (500 + 22 * p.ffmKg);
  const kcalPerKg = p.kcalPerKg;

  let fm = (initialWeightKg * initialFatPct) / 100;
  let ffm = initialWeightKg - fm;
  let weight = initialWeightKg;
  const startFFM = ffm;

  let cursor = weekStart(initialDateISO);
  const out: ProjectionFatPoint[] = [];

  const maxWeeks = 26;
  for (let w = 0; w < maxWeeks; w++) {
    let weeklyDeficit = 0;
    for (let d = 0; d < 7; d++) {
      const date = addDays(cursor, d);
      const bmr = (500 + 22 * ffm) * calib;
      const kgLost = Math.max(0, initialWeightKg - weight);
      const tdee = bmr * p.pal - p.tdeeDropPerKg * kgLost;

      const inPhase1 = !isBefore(date, parseISO(p.phase1.startISO)) && !isBefore(parseISO(p.phase1.endISO), date);
      const inPhase2 = isBefore(parseISO(p.phase2.startISO), addDays(date, 1));
      let intake = inPhase1 && !inPhase2 ? p.phase1.intakeKcal : (isTrainingDay(p, date) ? p.phase2.intakeTraining : p.phase2.intakeRest);
      const dow = date.getDay();
      if (p.weekendSurplusKcal && (dow === 0 || dow === 6)) intake += p.weekendSurplusKcal;
      weeklyDeficit += (tdee - intake);
    }

    const deltaKg = weeklyDeficit / kcalPerKg; // + loss, - gain
    const fatPctNow = (fm / (fm + ffm)) * 100;
    // Make FFM fraction dynamic: higher fat% -> lower FFM loss fraction
    const ffmFracLoss = clamp(p.ffmFraction - 0.01 * (fatPctNow - 20), 0.1, 0.5);

    if (deltaKg >= 0) {
      const ffmLoss = deltaKg * ffmFracLoss;
      const fmLoss = deltaKg - ffmLoss;
      ffm = Math.max(55, ffm - ffmLoss);
      fm = Math.max(0, fm - fmLoss);
    } else {
      // Weight gain: assume 80% fat, 20% FFM by default
      const gain = -deltaKg;
      fm += gain * 0.8;
      ffm += gain * 0.2;
    }
    weight = fm + ffm;

    const weekEndDate = addDays(cursor, 6);
    out.push({ dateISO: fmtISO(weekEndDate), fatPct: Number(((fm / (fm + ffm)) * 100).toFixed(2)), kg: Number(weight.toFixed(2)) });

    cursor = addDays(cursor, 7);
    const endISO = p.phase2.endISO;
    if (endISO && isBefore(parseISO(endISO), cursor)) break;
  }
  return out;
}
