export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { urls } = await req.json();

  const checkUrl = async (url) => {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok ? url : null;
    } catch (err) {
      return null;
    }
  };

  const results = await Promise.all(
    urls.map(async (originalUrl) => {
      // Try rotating n1–n4
      for (let i = 1; i <= 4; i++) {
        const testUrl = originalUrl.replace(/n\d/, `n${i}`);
        const valid = await checkUrl(testUrl);
        if (valid) return valid;
      }
      return null;
    })
  );

  return new Response(JSON.stringify({ workingUrls: results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
