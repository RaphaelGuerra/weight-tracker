export type DayLog = {
  dateISO: string; // "2025-09-05"
  morningKg?: number;
  nightKg?: number;
};

export type WeeklyCheckpoint = {
  endDateISO: string; // e.g. "2025-09-12"
  lowKg: number;
  highKg: number;
};

export type Goals = { valuesKg: number[]; labels?: string[] };

export type ProjectionParams = {
  bmr: number; // default 1724
  ffmKg: number; // default 60.7
  pal: number; // default 1.55
  kcalPerKg: number; // default 7700
  tdeeDropPerKg: number; // default 25
  ffmFraction: number; // default 0.25
  phase1: { startISO: string; endISO: string; intakeKcal: number };
  phase2: {
    startISO: string;
    endISO?: string;
    intakeRest: number;
    intakeTraining: number;
    trainingDays: number[]; // 1..7 Mon..Sun
  };
  weekendSurplusKcal?: number;
};

export type Settings = {
  goals: Goals;
  checkpoints: WeeklyCheckpoint[];
  projection: ProjectionParams;
};

export type ProjectionPoint = { dateISO: string; kg: number };

export type AppState = {
  logs: DayLog[];
  settings: Settings;
  bearerToken?: string;
  workerURL?: string;
};

