import React from 'react';

type Props = { onOpenCheckpoints: () => void };

export default function TopBar({ onOpenCheckpoints }: Props) {
  return (
    <header className="topbar">
      <h1>Peso Coach</h1>
      <div>
        <button onClick={onOpenCheckpoints}>Definições de Checkpoints</button>
      </div>
    </header>
  );
}

