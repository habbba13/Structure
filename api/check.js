import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  let rawBody = '';
  for await (const chunk of req) {
    rawBody += chunk;
  }

  let urls;
  try {
    urls = JSON.parse(rawBody).urls;
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const executablePath = await chromium.executablePath;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
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
    } catch (_) {}
  }

  await browser.close();
  res.status(200).json({ workingUrl });
}
