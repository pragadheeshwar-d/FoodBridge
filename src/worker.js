export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy /api requests to Cloudflare Tunnel backend
    if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
      const backendUrl = env.BACKEND_URL || 'https://save-karen-brook-household.trycloudflare.com';
      const targetUrl = new URL(url.pathname + url.search, backendUrl);

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('Host', targetUrl.host);

      try {
        const response = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: requestHeaders,
          body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
          redirect: 'follow',
        });

        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        if (request.method === 'OPTIONS') {
          return new Response(null, { status: 204, headers: responseHeaders });
        }

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Cloudflare Backend Tunnel connection error: ' + err.message,
          }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          },
        );
      }
    }

    // Default to serving static assets with single-page-application fallback
    return env.ASSETS.fetch(request);
  },
};
