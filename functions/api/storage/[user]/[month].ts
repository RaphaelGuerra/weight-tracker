export const config = { runtime: 'edge' };

type Env = { LEDGER: KVNamespace };

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), { ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) } });
}

function bad(msg: string, status = 400) { return json({ error: msg }, { status }); }

function validMonth(m: string) { return /^\d{4}-\d{2}$/.test(m); }

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const user = String(params.user || '').trim();
  const month = String(params.month || '').trim();
  if (!user || !validMonth(month)) return bad('invalid params');
  const key = `${user}/${month}`;
  const value = await env.LEDGER.get(key, 'json');
  return json(value ?? null);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, params, env }) => {
  const user = String(params.user || '').trim();
  const month = String(params.month || '').trim();
  if (!user || !validMonth(month)) return bad('invalid params');
  let body: unknown;
  try { body = await request.json(); } catch { return bad('invalid json'); }
  // Minimal validation: object with logs array (bounded)
  if (typeof body !== 'object' || body === null) return bad('invalid shape');
  const b = body as any;
  if (!Array.isArray(b.logs) || b.logs.length > 1200) return bad('invalid logs');
  const key = `${user}/${month}`;
  await env.LEDGER.put(key, JSON.stringify({ logs: b.logs }), { metadata: { updatedAt: new Date().toISOString() } });
  return json({ ok: true });
};

