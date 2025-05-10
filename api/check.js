import chromium from "chrome-aws-lambda";
import { IncomingMessage, ServerResponse } from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req = IncomingMessage, res = ServerResponse) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString();

  let urls;
  try {
    urls = JSON.parse(rawBody).urls;
    if (!Array.isArray(urls)) throw new Error();
  } catch {
    return res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Invalid JSON body" }));
  }

  const executablePath = await chromium.executablePath;

  const browser = await chromium.puppeteer.launch({
    args: [
      ...chromium.args,
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
    executablePath,
    headless: true,
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  let workingUrl = null;

  for (const url of urls) {
    try {
      const response = await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 10000,
      });

      await page.waitForTimeout(3000);

      if (response.status() === 200) {
        workingUrl = url;
        break;
      }
    } catch (err) {
      console.log(`Error checking ${url}:`, err.message);
    }
  }

  await browser.close();

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ workingUrl }));
}
