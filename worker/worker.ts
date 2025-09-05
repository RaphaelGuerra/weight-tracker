export interface Env {
  COACH: KVNamespace;
  BEARER_TOKEN: string;
}

const KEY = 'backup:default';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    if (token !== env.BEARER_TOKEN) return new Response('Unauthorized', { status: 401 });

    if (request.method === 'POST' && url.pathname === '/backup') {
      const body = await request.text();
      await env.COACH.put(KEY, body, { metadata: { updatedAt: new Date().toISOString() } });
      return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
    }
    if (request.method === 'GET' && url.pathname === '/restore') {
      const data = await env.COACH.get(KEY, 'json');
      if (!data) return new Response('Not Found', { status: 404 });
      return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
    }
    return new Response('Not Found', { status: 404 });
  },
};
