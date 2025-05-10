import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  let rawBody = '';
  for await (const chunk of req) {
    rawBody += chunk;
  }

  let urls;
  try {
    urls = JSON.parse(rawBody).urls;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const executablePath = await chromium.executablePath;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: executablePath || '/usr/bin/chromium-browser',
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
    } catch (err) {
      // Ignore errors and try next URL
    }
  }

  await browser.close();
  res.status(200).json({ workingUrl });
}
