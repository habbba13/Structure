import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Parse JSON manually (Vercel requires this)
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString();
  let urls;
  try {
    urls = JSON.parse(rawBody).urls;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // 👇 THIS LINE IS CRITICAL – use chrome-aws-lambda's path only
  const executablePath = await chromium.executablePath;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport,
  });

  const page = await browser.newPage();

  let workingUrl = null;

  for (const url of urls) {
    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 8000,
      });
      if (response.status() === 200) {
        workingUrl = url;
        break;
      }
    } catch (_) {}
  }

  await browser.close();
  res.status(200).json({ workingUrl });
}
