import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  const urls = req.body.urls;

  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: 'Invalid request. Expected "urls" array.' });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  let workingUrl = null;

  for (const url of urls) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      const status = response.status();
      if (status === 200) {
        workingUrl = url;
        break;
      }
    } catch (err) {
      continue;
    }
  }

  await browser.close();

  return res.json({ workingUrl });
}
