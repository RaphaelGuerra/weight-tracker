# Peso Coach

App PWA simples para acompanhamento de peso, com projeção não linear e backup opcional via Cloudflare Worker.

## Como rodar local

- Pré-requisitos: Node 18+ e npm.
- No diretório `peso-coach/`:
  - `npm install`
  - `npm run dev` (abre em http://localhost:5173)
  - `npm run build` (gera `dist/`)
  - `npm run preview`

## Publicar no Cloudflare Pages

- Build: `npm run build` (saída em `dist/`).
- Configure um projeto no Cloudflare Pages apontando para o repo, diretório de build `peso-coach`, comando `npm run build`, output directory `dist`.

## PWA

- O app registra `public/sw.js` e `public/manifest.webmanifest`.
- Os dados do usuário ficam apenas em `localStorage` do navegador.
- Para instalar no iOS/Android, abra no navegador e use "Adicionar à Tela de Início".

## Backup remoto (opcional)

- No diretório `peso-coach/worker/`:
  1. Instale e faça login no Wrangler (`npm i -g wrangler`).
  2. Crie um KV Namespace e substitua `kv_namespace_id_placeholder` em `wrangler.toml`.
  3. Configure o segredo: `wrangler secret put BEARER_TOKEN`.
  4. Deploy: `wrangler deploy`.
- Em `wrangler.toml`, a binding do KV é `COACH`.
- Na UI do app, informe a URL do worker e o `BEARER_TOKEN` para usar os botões Backup/Restore.

## Teste manual (checklist)

- Inserir 7 dias de pesagens → conferir média 7d.
- Editar checkpoints → status atual muda conforme faixa.
- Ajustar parâmetros de projeção → recálculo da curva e exibição em gráfico.
- Exportar JSON, apagar localStorage, Importar JSON → dados restaurados.
- (Opcional) Subir Worker, setar `workerURL` e `bearerToken`, testar Backup e Restore.

## Stack

- Vite + React + TypeScript.
- UI com Pico.css via CDN.
- Chart.js para gráficos.
- date-fns para datas.
- ESLint + Prettier.

## Estrutura

- `src/components`: cartões da UI.
- `src/lib`: utilitários (datas, storage, compute, charts, defaults).
- `worker`: Cloudflare Worker para backup em KV.

## Notas

- Ícones `public/icon-192.png` e `public/icon-512.png` são placeholders; substitua por PNGs reais.
- Simulação semanal roda 26 semanas por padrão ou até `phase2.endISO`.
