import React, { useState } from 'react';
import { ProjectionParams } from '../types';

type Props = {
  params: ProjectionParams;
  onChange: (p: ProjectionParams) => void;
  onRecalc: () => void;
};

export default function GoalsProjectionCard({ params, onChange, onRecalc }: Props) {
  const [local, setLocal] = useState<ProjectionParams>(params);
  const apply = () => { onChange(local); onRecalc(); };
  const upd = <K extends keyof ProjectionParams>(key: K, value: ProjectionParams[K]) => setLocal((p) => ({ ...p, [key]: value }));

  return (
    <article>
      <header><strong>Metas & Projeção</strong></header>
      <div className="grid">
        <label>BMR base
          <input type="number" value={local.bmr} onChange={(e) => upd('bmr', Number(e.target.value))} />
        </label>
        <label>FFM base (kg)
          <input type="number" step="0.1" value={local.ffmKg} onChange={(e) => upd('ffmKg', Number(e.target.value))} />
        </label>
        <label>PAL
          <input type="number" step="0.01" value={local.pal} onChange={(e) => upd('pal', Number(e.target.value))} />
        </label>
        <label>Kcal por kg
          <input type="number" value={local.kcalPerKg} onChange={(e) => upd('kcalPerKg', Number(e.target.value))} />
        </label>
        <label>Queda TDEE (kcal/d por kg)
          <input type="number" value={local.tdeeDropPerKg} onChange={(e) => upd('tdeeDropPerKg', Number(e.target.value))} />
        </label>
        <label>Fraç. perda FFM
          <input type="number" step="0.01" value={local.ffmFraction} onChange={(e) => upd('ffmFraction', Number(e.target.value))} />
        </label>
      </div>
      <details>
        <summary>Fases de ingestão</summary>
        <div className="grid">
          <label>Fase 1 início
            <input type="date" value={local.phase1.startISO} onChange={(e) => upd('phase1', { ...local.phase1, startISO: e.target.value })} />
          </label>
          <label>Fase 1 fim
            <input type="date" value={local.phase1.endISO} onChange={(e) => upd('phase1', { ...local.phase1, endISO: e.target.value })} />
          </label>
          <label>Fase 1 ingestão (kcal)
            <input type="number" value={local.phase1.intakeKcal} onChange={(e) => upd('phase1', { ...local.phase1, intakeKcal: Number(e.target.value) })} />
          </label>

          <label>Fase 2 início
            <input type="date" value={local.phase2.startISO} onChange={(e) => upd('phase2', { ...local.phase2, startISO: e.target.value })} />
          </label>
          <label>Fase 2 fim (opcional)
            <input type="date" value={local.phase2.endISO ?? ''} onChange={(e) => upd('phase2', { ...local.phase2, endISO: e.target.value || undefined })} />
          </label>
          <label>Fase 2 repouso (kcal)
            <input type="number" value={local.phase2.intakeRest} onChange={(e) => upd('phase2', { ...local.phase2, intakeRest: Number(e.target.value) })} />
          </label>
          <label>Fase 2 treino (kcal)
            <input type="number" value={local.phase2.intakeTraining} onChange={(e) => upd('phase2', { ...local.phase2, intakeTraining: Number(e.target.value) })} />
          </label>
          <label>Treinos (1=Seg..7=Dom, sep. por vírgula)
            <input type="text" value={local.phase2.trainingDays.join(',')} onChange={(e) => {
              const nums = e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n));
              upd('phase2', { ...local.phase2, trainingDays: nums });
            }} />
          </label>
          <label>Excedente fds (kcal)
            <input type="number" value={local.weekendSurplusKcal ?? 0} onChange={(e) => upd('weekendSurplusKcal', Number(e.target.value))} />
          </label>
        </div>
      </details>
      <footer>
        <button onClick={apply}>Recalcular</button>
      </footer>
    </article>
  );
}

