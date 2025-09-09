import { Settings } from '../types';

export const defaultSettings: Settings = {
  goals: { valuesKg: [80, 78, 76], labels: ['meta 80', 'meta 78', 'meta 76'] },
  fatGoals: { valuesPct: [20, 18, 16], labels: ['meta 20%', 'meta 18%', 'meta 16%'] },
  checkpoints: [
    { endDateISO: '2025-09-12', lowKg: 81.5, highKg: 82.0 },
    { endDateISO: '2025-09-17', lowKg: 80.0, highKg: 80.5 },
    { endDateISO: '2025-09-24', lowKg: 79.0, highKg: 79.5 },
    { endDateISO: '2025-10-01', lowKg: 78.5, highKg: 79.0 },
    { endDateISO: '2025-10-08', lowKg: 78.0, highKg: 78.5 },
    { endDateISO: '2025-10-15', lowKg: 77.5, highKg: 78.0 },
    { endDateISO: '2025-10-22', lowKg: 77.0, highKg: 77.5 },
    { endDateISO: '2025-10-31', lowKg: 76.0, highKg: 76.5 },
  ],
  fatCheckpoints: [
    { endDateISO: '2025-09-12', lowPct: 21.8, highPct: 22.3 },
    { endDateISO: '2025-09-17', lowPct: 21.2, highPct: 21.7 },
    { endDateISO: '2025-09-24', lowPct: 20.6, highPct: 21.1 },
    { endDateISO: '2025-10-01', lowPct: 20.2, highPct: 20.7 },
    { endDateISO: '2025-10-08', lowPct: 19.8, highPct: 20.3 },
    { endDateISO: '2025-10-15', lowPct: 19.4, highPct: 19.9 },
    { endDateISO: '2025-10-22', lowPct: 18.8, highPct: 19.3 },
    { endDateISO: '2025-10-31', lowPct: 18.0, highPct: 18.5 },
  ],
  projection: {
    bmr: 1724,
    ffmKg: 60.7,
    pal: 1.55,
    kcalPerKg: 7700,
    tdeeDropPerKg: 25,
    ffmFraction: 0.25,
    phase1: { startISO: '2025-08-01', endISO: '2025-09-17', intakeKcal: 1500 },
    phase2: {
      startISO: '2025-09-18',
      intakeRest: 1550,
      intakeTraining: 1800,
      trainingDays: [1, 3, 5],
    },
    weekendSurplusKcal: 0,
  },
  trendWindowShort: 3,
  trendWindowLong: 7,
};
