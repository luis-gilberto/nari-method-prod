export async function onRequest(context) {
  const { params, env } = context;
  const key = params.path.join('/');

  try {
    const object = await env.SIGNAL_ASSETS.get(key);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'private, max-age=3600');

    return new Response(object.body, { headers });
  } catch (e) {
    return new Response('Error retrieving file', { status: 500 });
  }
}
