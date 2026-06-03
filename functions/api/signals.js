export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method === 'GET') {
    try {
      const list = await env.SIGNAL_STORE.get('signals_index');
      const signals = list ? JSON.parse(list) : [];
      return new Response(JSON.stringify(signals), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { text, type, author } = body;

      if (!text || !text.trim()) {
        return new Response(JSON.stringify({ error: 'Text required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const id = crypto.randomUUID();
      const signal = {
        id,
        text: text.trim(),
        type: type || 'General',
        author: author || 'nari',
        ts: new Date().toISOString(),
        attachments: [],
        status: 'new',
        editedAt: null,
      };

      const existing = await env.SIGNAL_STORE.get('signals_index');
      const signals = existing ? JSON.parse(existing) : [];
      signals.unshift(signal);
      await env.SIGNAL_STORE.put('signals_index', JSON.stringify(signals));

      return new Response(JSON.stringify(signal), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
}
