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
    defaultViewport: chromium.defaultViewport,
  });

  const page = await browser.newPage();

  // ✅ Spoof real browser headers
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  let workingUrl = null;

  for (const url of urls) {
    try {
      console.log("Checking URL:", url);
      const response = await page.goto(url
