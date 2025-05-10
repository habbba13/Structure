export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { urls } = await req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or empty "urls" array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const checkUrl = async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok ? url : null;
      } catch {
        return null;
      }
    };

    const rotateHosts = ['n1', 'n2', 'n3', 'n4'];

    const results = await Promise.all(
      urls.map(async (baseUrl) => {
        const urlParts = baseUrl.split('.coomer.su');
        if (urlParts.length < 2) return null;

        for (const host of rotateHosts) {
          const testUrl = `https://${host}.coomer.su${urlParts[1]}`;
          const valid = await checkUrl(testUrl);
          if (valid) return valid;
        }

        return null;
      })
    );

    const flattened = results.filter(Boolean);
    return new Response(JSON.stringify({ workingUrls: flattened }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
