export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const signalId = formData.get('signalId');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/webm',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: `File type ${file.type} not allowed` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const MAX_SIZE = 25 * 1024 * 1024;
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large. Max 25MB.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ext = file.name.split('.').pop();
    const key = `signals/${signalId || 'standalone'}/${crypto.randomUUID()}.${ext}`;

    await env.SIGNAL_ASSETS.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    const fileUrl = `/api/files/${key}`;

    if (signalId) {
      const raw = await env.SIGNAL_STORE.get('signals_index');
      const signals = raw ? JSON.parse(raw) : [];
      const idx = signals.findIndex(s => s.id === signalId);

      if (idx !== -1) {
        signals[idx].attachments = signals[idx].attachments || [];
        signals[idx].attachments.push({
          name: file.name,
          type: file.type,
          url: fileUrl,
          size: arrayBuffer.byteLength,
          uploadedAt: new Date().toISOString(),
        });
        await env.SIGNAL_STORE.put('signals_index', JSON.stringify(signals));
      }
    }

    return new Response(JSON.stringify({ url: fileUrl, key, name: file.name }), {
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
