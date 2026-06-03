export async function onRequest(context) {
  const { request, env, params } = context;
  const { id } = params;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const getSignals = async () => {
    const raw = await env.SIGNAL_STORE.get('signals_index');
    return raw ? JSON.parse(raw) : [];
  };

  const saveSignals = async (signals) => {
    await env.SIGNAL_STORE.put('signals_index', JSON.stringify(signals));
  };

  if (request.method === 'PATCH') {
    try {
      const body = await request.json();
      const signals = await getSignals();
      const idx = signals.findIndex(s => s.id === id);

      if (idx === -1) {
        return new Response(JSON.stringify({ error: 'Signal not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (body.text !== undefined) signals[idx].text = body.text.trim();
      if (body.status !== undefined) signals[idx].status = body.status;
      if (body.type !== undefined) signals[idx].type = body.type;
      signals[idx].editedAt = new Date().toISOString();

      await saveSignals(signals);

      return new Response(JSON.stringify(signals[idx]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const signals = await getSignals();
      const filtered = signals.filter(s => s.id !== id);

      if (filtered.length === signals.length) {
        return new Response(JSON.stringify({ error: 'Signal not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await saveSignals(filtered);

      return new Response(JSON.stringify({ deleted: id }), {
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
