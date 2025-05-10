import puppeteer from 'puppeteer';

export const config = {
  api: {
    bodyParser: false, // disable automatic body parsing
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Manually parse raw JSON body
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  let urls;
  try {
    const parsed = JSON.parse(body);
    urls = parsed.urls;
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: 'Expected an array of URLs' });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  let workingUrl = null;

  for (const url of urls) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      if (response.status() === 200) {
        workingUrl = url;
        break;
      }
    } catch (err) {
      continue;
    }
  }

  await browser.close();

  return res.status(200).json({ workingUrl });
}
