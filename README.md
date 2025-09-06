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
- Configure um projeto no Cloudflare Pages apontando para o repo:
  - Project root: `peso-coach`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Functions directory: auto (usa `functions/`)
- KV (persistência): crie um Namespace e faça o binding com o nome `COACH` no projeto do Pages.
  - Em Dashboard → Pages → Seu projeto → Settings → Functions → KV namespaces → Add binding
  - Binding name: `COACH` (exatamente este) → escolha/crie o namespace

### API de persistência (Pages Functions)

- Endpoints: `GET/PUT /api/storage/:syncId/:YYYY-MM`
- Corpo (PUT): `{ logs: DayLog[] }`
- CORS: liberado (`Access-Control-Allow-Origin: *`) para facilitar testes. Recomenda-se usar o mesmo domínio do Pages.
- A UI expõe essa integração em Backup → “Sincronização (Cloudflare Pages Functions)”.
  1. Base URL: informe a origem do seu site (ex.: `https://<projeto>.pages.dev` ou domínio customizado)
  2. Sync ID: gere um identificador de alta entropia (ex.: UUID v4) e salve
  3. Use “Salvar mês remoto” / “Carregar mês remoto” para sincronizar o mês atual

Notas de segurança:
- O Sync ID funciona como token no path. Use um valor longo/difícil de adivinhar.
- Se precisar restringir origens, altere os headers CORS em `functions/api/storage/[user]/[month].ts`.

## PWA

- O app registra `public/sw.js` e `public/manifest.webmanifest`.
- Os dados do usuário ficam apenas em `localStorage` do navegador.
- Para instalar no iOS/Android, abra no navegador e use "Adicionar à Tela de Início".

## Backup remoto (opcional – Cloudflare Worker)

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
