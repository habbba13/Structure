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

    // Use just the first input URL and rotate its host
    const baseUrl = urls[0];
    const urlParts = baseUrl.split('.coomer.su');
    let workingUrl = null;

    if (urlParts.length === 2) {
      for (const host of ['n1', 'n2', 'n3', 'n4']) {
        const testUrl = `https://${host}.coomer.su${urlParts[1]}`;
        const valid = await checkUrl(testUrl);
        if (valid) {
          workingUrl = valid;
          break;
        }
      }
    }

    return new Response(JSON.stringify({ workingUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
