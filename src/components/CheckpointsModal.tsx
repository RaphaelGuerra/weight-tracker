import React, { useState } from 'react';
import { WeeklyCheckpoint } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  checkpoints: WeeklyCheckpoint[];
  fatCheckpoints: { endDateISO: string; lowPct: number; highPct: number }[];
  onChange: (c: WeeklyCheckpoint[]) => void;
  onFatChange: (c: { endDateISO: string; lowPct: number; highPct: number }[]) => void;
};

export default function CheckpointsModal({ open, onClose, checkpoints, fatCheckpoints, onChange, onFatChange }: Props) {
  const [list, setList] = useState<WeeklyCheckpoint[]>([...checkpoints].sort((a,b)=>a.endDateISO.localeCompare(b.endDateISO)));
  const [fatList, setFatList] = useState<{ endDateISO: string; lowPct: number; highPct: number }[]>([...fatCheckpoints].sort((a,b)=>a.endDateISO.localeCompare(b.endDateISO)));
  if (!open) return null;

  const add = () => setList((l) => [...l, { endDateISO: new Date().toISOString().slice(0,10), lowKg: 0, highKg: 0 }]);
  const del = (idx: number) => setList((l) => l.filter((_, i) => i !== idx));
  const addFat = () => setFatList((l) => [...l, { endDateISO: new Date().toISOString().slice(0,10), lowPct: 0, highPct: 0 }]);
  const delFat = (idx: number) => setFatList((l) => l.filter((_, i) => i !== idx));
  const save = () => { onChange(list); onFatChange(fatList); onClose(); };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal>
      <div className="modal">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Definições de Checkpoints</strong>
          <button onClick={onClose} aria-label="Fechar">✕</button>
        </header>
        <small>Edite as faixas alvo por semana (data final, Dom→Sáb)</small>
        <table>
          <thead>
            <tr><th>Data fim (ISO)</th><th>Baixo (kg)</th><th>Alto (kg)</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((c, i) => (
              <tr key={i}>
                <td><input type="date" value={c.endDateISO} onChange={(e) => setList(upd(list, i, { ...c, endDateISO: e.target.value }))} /></td>
                <td><input type="number" step="0.1" value={c.lowKg} onChange={(e) => setList(upd(list, i, { ...c, lowKg: Number(e.target.value) }))} /></td>
                <td><input type="number" step="0.1" value={c.highKg} onChange={(e) => setList(upd(list, i, { ...c, highKg: Number(e.target.value) }))} /></td>
                <td><button onClick={() => del(i)}>Remover</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid">
          <button onClick={add}>Adicionar (Peso)</button>
        </div>
        <hr />
        <strong>Checkpoints — Gordura %</strong>
        <table>
          <thead>
            <tr><th>Data fim (ISO)</th><th>Baixo (%)</th><th>Alto (%)</th><th></th></tr>
          </thead>
          <tbody>
            {fatList.map((c, i) => (
              <tr key={i}>
                <td><input type="date" value={c.endDateISO} onChange={(e) => setFatList(upd(fatList, i, { ...c, endDateISO: e.target.value }))} /></td>
                <td><input type="number" step="0.1" value={c.lowPct} onChange={(e) => setFatList(upd(fatList, i, { ...c, lowPct: Number(e.target.value) }))} /></td>
                <td><input type="number" step="0.1" value={c.highPct} onChange={(e) => setFatList(upd(fatList, i, { ...c, highPct: Number(e.target.value) }))} /></td>
                <td><button onClick={() => delFat(i)}>Remover</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid">
          <button onClick={addFat}>Adicionar (Gordura %)</button>
          <button onClick={save}>Salvar tudo</button>
        </div>
      </div>
    </div>
  );
}

function upd<T>(arr: T[], idx: number, val: T) { return arr.map((x, i) => (i === idx ? val : x)); }
