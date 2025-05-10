import edgechromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString();

  let urls;
  try {
    urls = JSON.parse(rawBody).urls;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const executablePath = await chromium.executablePath;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  );

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  let workingUrl = null;

  for (const url of urls) {
    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 10000,
      });

      await page.waitForTimeout(3000); // Give Cloudflare time

      if (response.status() === 200) {
        workingUrl = url;
        break;
      }
    } catch (_) {}
  }

  await browser.close();
  return res.status(200).json({ workingUrl });
}
