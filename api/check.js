import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = {
  runtime: 'nodejs20.x', // Ensures it's not run as an Edge Function
};

export default async function handler(req, res) {
  try {
    // Read raw body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString();

    // Parse JSON and validate
    const { urls } = JSON.parse(rawBody);
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty "urls" array' });
    }

    // Launch headless browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Anti-bot headers
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // Find first working URL
    let workingUrl = null;
    for (const url of urls) {
      try {
        const response = await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 15000,
        });

        await page.waitForTimeout(2000); // Let bot detection pass

        if (response.status() === 200) {
          workingUrl = url;
          break;
        }
      } catch (err) {

  await browser.close();
  return res.status(200).json({ workingUrl });
}
