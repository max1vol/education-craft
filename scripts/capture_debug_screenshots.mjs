import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:5173';
const outputDir = path.resolve('docs/images/debug');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function captureDesktop(browser, relativePath, outputName, waitSelector = null) {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 }
  });

  await page.goto(`${baseUrl}${relativePath}`, { waitUntil: 'domcontentloaded' });
  if (waitSelector) {
    await page.locator(waitSelector).first().waitFor({ timeout: 20000 }).catch(() => {});
  }
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(outputDir, outputName),
    fullPage: true
  });
  await page.close();
}

async function captureMobile(browser, relativePath, outputName, waitSelector = null) {
  const context = await browser.newContext({
    ...devices['Pixel 7']
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}${relativePath}`, { waitUntil: 'domcontentloaded' });
  if (waitSelector) {
    await page.locator(waitSelector).first().waitFor({ timeout: 20000 }).catch(() => {});
  }
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(outputDir, outputName),
    fullPage: true
  });

  await context.close();
}

async function main() {
  await ensureDir(outputDir);

  const browser = await chromium.launch({ headless: true });
  try {
    await captureDesktop(browser, '/', 'game-home-desktop.png', '.scene canvas');
    await captureDesktop(
      browser,
      '/debug-render?biome=ring-plains&radius=56&slice=0&layers=terrain,flora,monument,portal,special',
      'debug-ring-plains-all-layers.png',
      'canvas'
    );
    await captureDesktop(
      browser,
      '/debug-render?biome=dune-pyramid&radius=52&slice=0&layers=terrain,monument,portal',
      'debug-dune-pyramid-portal-layers.png',
      'canvas'
    );
    await captureDesktop(
      browser,
      '/debug-render?biome=frost-citadel&radius=60&slice=14&layers=terrain,flora,special',
      'debug-frost-citadel-side-slice.png',
      'canvas'
    );
    await captureMobile(browser, '/', 'game-home-mobile.png', '.scene canvas');
  } finally {
    await browser.close();
  }

  console.log(`Captured screenshots into ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
