import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium, devices } from 'playwright';

const baseUrl = process.env.GAME_URL ?? 'http://127.0.0.1:4173';
const outputDir = path.resolve('docs/images/debug');
const startedAtMs = Date.now();

function logStep(message) {
  const elapsedSeconds = ((Date.now() - startedAtMs) / 1000).toFixed(1);
  console.log(`[capture +${elapsedSeconds}s] ${message}`);
}

function readVersionOverlayLines() {
  const fallback = [
    'Version Snapshot',
    'Build metadata unavailable in headless capture',
    `Generated ${new Date().toISOString()}`
  ];

  try {
    const packageJson = JSON.parse(fsSync.readFileSync(path.resolve('package.json'), 'utf8'));
    const packageVersion = packageJson.version ?? '0.0.0';
    const commitShort = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
    const describe = execFileSync('git', ['describe', '--always', '--tags', '--dirty'], { encoding: 'utf8' }).trim();
    const latestTitle = execFileSync('git', ['log', '--pretty=format:%s', '-n', '1'], { encoding: 'utf8' }).trim();

    const compactTitle = latestTitle.length > 78 ? `${latestTitle.slice(0, 75)}...` : latestTitle;
    return [
      'Version Snapshot',
      `Label: v${packageVersion} (${describe})`,
      `Branch: ${branch}  Commit: ${commitShort}`,
      `Latest: ${compactTitle}`,
      `Generated: ${new Date().toISOString()}`
    ];
  } catch {
    return fallback;
  }
}

function stampVersionOverlay(outputName, isMobile = false) {
  const imagePath = path.join(outputDir, outputName);
  if (!fsSync.existsSync(imagePath)) return;

  const tempPath = path.join(outputDir, `${outputName}.tmp.png`);
  const lines = readVersionOverlayLines();
  const box = isMobile ? 'roundrectangle 26,26 1148,380 24,24' : 'roundrectangle 36,36 1588,360 24,24';
  const x = isMobile ? 58 : 70;
  const y = isMobile ? 86 : 86;
  const step = isMobile ? 48 : 46;
  const pointSize = isMobile ? '30' : '34';

  const args = [
    imagePath,
    '-fill',
    'rgba(3,22,42,0.84)',
    '-stroke',
    'rgba(176,214,244,0.66)',
    '-strokewidth',
    '2',
    '-draw',
    box,
    '-stroke',
    'none',
    '-fill',
    '#ecf7ff',
    '-pointsize',
    pointSize
  ];

  for (const [index, line] of lines.entries()) {
    args.push('-annotate', `+${x}+${y + index * step}`, line);
  }

  args.push(tempPath);
  execFileSync('convert', args, { stdio: 'ignore' });
  fsSync.renameSync(tempPath, imagePath);
  logStep(`version overlay stamped -> ${outputName}`);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function waitForStableFrame(page, waitSelector = null, waitMs = 1800) {
  if (waitSelector) {
    await page.locator(waitSelector).first().waitFor({ timeout: 30000 });
  }
  await page.waitForTimeout(waitMs);
}

async function newPageWithTimeouts(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.setDefaultNavigationTimeout(45000);
  return page;
}

async function gotoAndSettle(page, relativePath, waitSelector, waitMs = 1800, afterSettle = null) {
  logStep(`open ${relativePath}`);
  await page.goto(`${baseUrl}${relativePath}`, { waitUntil: 'domcontentloaded' });
  await waitForStableFrame(page, waitSelector, waitMs);
  if (afterSettle) {
    await afterSettle(page);
  }
  logStep(`settled ${relativePath}`);
}

async function captureDesktop(browser, relativePath, outputName, waitSelector, waitMs = 1800, afterSettle = null) {
  logStep(`desktop capture start -> ${outputName}`);
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1.25,
    isMobile: false,
    hasTouch: false
  });

  const page = await newPageWithTimeouts(context);
  await gotoAndSettle(page, relativePath, waitSelector, waitMs, afterSettle);
  await page.screenshot({ path: path.join(outputDir, outputName), fullPage: false });
  await context.close();
  logStep(`desktop capture done -> ${outputName}`);
}

async function captureIphonePortrait(browser, relativePath, outputName, waitSelector, waitMs = 2100, afterSettle = null) {
  logStep(`iphone portrait capture start -> ${outputName}`);
  const context = await browser.newContext({
    ...devices['iPhone 14 Pro']
  });
  const page = await newPageWithTimeouts(context);
  await gotoAndSettle(page, relativePath, waitSelector, waitMs, afterSettle);
  await page.screenshot({ path: path.join(outputDir, outputName), fullPage: true });
  await context.close();
  logStep(`iphone portrait capture done -> ${outputName}`);
}

async function captureIphoneLandscape(browser, relativePath, outputName, waitSelector, waitMs = 2100) {
  logStep(`iphone landscape capture start -> ${outputName}`);
  const iphone = devices['iPhone 14 Pro'];
  const context = await browser.newContext({
    ...iphone,
    viewport: { width: iphone.viewport.height, height: iphone.viewport.width }
  });
  const page = await newPageWithTimeouts(context);
  await gotoAndSettle(page, relativePath, waitSelector, waitMs);
  await page.screenshot({ path: path.join(outputDir, outputName), fullPage: true });
  await context.close();
  logStep(`iphone landscape capture done -> ${outputName}`);
}

async function waitForVersionReady(page) {
  try {
    await page.waitForFunction(() => {
      const hash = document.querySelector('.version-page .hash')?.textContent?.trim() ?? '';
      const row = document.querySelector('.version-page li .row-top')?.textContent?.trim() ?? '';
      return hash.length >= 7 && row.length >= 3;
    }, { timeout: 20000 });
  } catch {
    logStep('version readiness timeout; capturing fallback frame');
  }
  await page.waitForTimeout(900);
}

async function captureDebugCanvas(browser, relativePath, outputName, sectionSelector) {
  logStep(`debug canvas capture start -> ${outputName}`);
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1.25,
    isMobile: false,
    hasTouch: false
  });

  const page = await newPageWithTimeouts(context);
  await gotoAndSettle(page, relativePath, 'section.render-grid canvas', 1700);
  const section = page.locator(sectionSelector).first();
  await section.waitFor({ timeout: 45000 });
  const canvas = section.locator('canvas').first();
  await canvas.waitFor({ timeout: 45000 });
  await canvas.screenshot({ path: path.join(outputDir, outputName) });
  await context.close();
  logStep(`debug canvas capture done -> ${outputName}`);
}

async function captureTexturePanel(page, familyId, outputName) {
  logStep(`texture panel -> ${familyId}`);
  await page.locator('.texture-panel select').selectOption(familyId);
  await page.waitForTimeout(450);
  await page.locator('.texture-panel').screenshot({ path: path.join(outputDir, outputName) });
}

async function captureBiomeCloseup(
  browser,
  {
    biomeId,
    outputName,
    pose
  }
) {
  logStep(`biome closeup start -> ${outputName}`);
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1.25,
    isMobile: false,
    hasTouch: false
  });

  const page = await newPageWithTimeouts(context);
  await gotoAndSettle(page, `/?biome=${biomeId}`, '.scene canvas', 2200);

  if (pose) {
    await page.evaluate((cameraPose) => {
      const api = window.__monumentRealmsDebug;
      if (!api) return false;
      const baseY = api.getState().player.y;
      api.setPlayerView(
        cameraPose.x,
        baseY + cameraPose.yOffset,
        cameraPose.z,
        cameraPose.lookAtX,
        baseY + cameraPose.lookAtYOffset,
        cameraPose.lookAtZ
      );
      return true;
    }, pose);
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: path.join(outputDir, outputName), fullPage: false });
  await context.close();
  logStep(`biome closeup done -> ${outputName}`);
}

async function captureAqueductFlowProof(browser) {
  logStep('aqueduct flow proof start');
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1.25,
    isMobile: false,
    hasTouch: false
  });

  const page = await newPageWithTimeouts(context);
  await gotoAndSettle(page, '/?biome=roman-aqueduct', '.scene canvas', 2200);

  await page.evaluate(() => {
    const api = window.__monumentRealmsDebug;
    if (!api) return;
    const baseY = api.getState().player.y;
    api.setPlayerView(-236, baseY + 5, -170, -227, baseY + 10, -164);
  });
  await page.waitForTimeout(900);
  const frameA = path.join(outputDir, 'aqueduct-flow-frame-a.png');
  const frameB = path.join(outputDir, 'aqueduct-flow-frame-b.png');
  await page.screenshot({ path: frameA, fullPage: false });
  await page.waitForTimeout(750);
  await page.screenshot({ path: frameB, fullPage: false });

  const combined = path.join(outputDir, 'aqueduct-flow-proof-desktop.png');
  execFileSync('montage', [frameA, frameB, '-tile', '2x1', '-geometry', '+8+0', combined], { stdio: 'ignore' });
  await context.close();
  logStep('aqueduct flow proof done');
}

async function verifyTouchDestroy(browser) {
  logStep('touch controls verification start');
  const context = await browser.newContext({
    ...devices['iPhone 14 Pro']
  });
  const page = await newPageWithTimeouts(context);
  await gotoAndSettle(page, '/?biome=stonehenge-salisbury', '.scene canvas', 2200);

  const before = await page.evaluate(() => window.__monumentRealmsDebug?.getState() ?? null);
  if (!before) {
    throw new Error('Touch destroy proof failed: debug API unavailable.');
  }

  await page.screenshot({ path: path.join(outputDir, 'touch-destroy-before-iphone.png'), fullPage: true });

  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error('Touch controls proof failed: missing viewport size.');
  }

  const singleTapPoints = [
    { x: Math.round(viewport.width * 0.5), y: Math.round(viewport.height * 0.58) },
    { x: Math.round(viewport.width * 0.5), y: Math.round(viewport.height * 0.64) },
    { x: Math.round(viewport.width * 0.47), y: Math.round(viewport.height * 0.6) },
    { x: Math.round(viewport.width * 0.53), y: Math.round(viewport.height * 0.6) }
  ];

  let placeState = before;
  let placeSuccessPoint = null;

  for (const point of singleTapPoints) {
    await page.touchscreen.tap(point.x, point.y);
    await page.waitForTimeout(350);
    placeState = await page.evaluate(() => window.__monumentRealmsDebug?.getState() ?? null);
    if (placeState && placeState.placedCount > before.placedCount) {
      placeSuccessPoint = point;
      break;
    }
  }

  await page.screenshot({ path: path.join(outputDir, 'touch-place-after-iphone.png'), fullPage: true });

  const destroyBefore = await page.evaluate(() => window.__monumentRealmsDebug?.getState() ?? null);
  let destroyAttempt = {
    method: 'cdp-two-finger',
    success: false,
    before: destroyBefore?.minedCount ?? 0,
    after: destroyBefore?.minedCount ?? 0,
    statusBefore: destroyBefore?.status ?? null,
    statusAfter: destroyBefore?.status ?? null,
    fallbackUsed: false
  };

  if (!destroyBefore) {
    throw new Error('Touch controls proof failed: debug API unavailable before two-finger destroy.');
  }

  const fingerA = { x: Math.round(viewport.width * 0.47), y: Math.round(viewport.height * 0.58) };
  const fingerB = { x: Math.round(viewport.width * 0.53), y: Math.round(viewport.height * 0.58) };

  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: fingerA.x, y: fingerA.y, radiusX: 1, radiusY: 1, force: 1, id: 1 },
        { x: fingerB.x, y: fingerB.y, radiusX: 1, radiusY: 1, force: 1, id: 2 }
      ]
    });
    await page.waitForTimeout(70);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    await page.waitForTimeout(400);
    const destroyAfter = await page.evaluate(() => window.__monumentRealmsDebug?.getState() ?? null);
    destroyAttempt = {
      ...destroyAttempt,
      success: Boolean(destroyAfter && destroyAfter.minedCount > destroyBefore.minedCount),
      after: destroyAfter?.minedCount ?? destroyAttempt.after,
      statusAfter: destroyAfter?.status ?? destroyAttempt.statusAfter
    };
    await cdp.detach();
  } catch {
    const fallback = await page.evaluate(() => {
      const api = window.__monumentRealmsDebug;
      if (!api) {
        return { success: false, before: 0, after: 0, statusBefore: null, statusAfter: null };
      }
      const beforeState = api.getState();
      const didDestroy = api.touchTwoFingerDestroy();
      const afterState = api.getState();
      return {
        success: didDestroy || afterState.minedCount > beforeState.minedCount,
        before: beforeState.minedCount,
        after: afterState.minedCount,
        statusBefore: beforeState.status,
        statusAfter: afterState.status
      };
    });

    destroyAttempt = {
      method: 'debug-api-fallback',
      success: fallback.success,
      before: fallback.before,
      after: fallback.after,
      statusBefore: fallback.statusBefore,
      statusAfter: fallback.statusAfter,
      fallbackUsed: true
    };
  }

  await page.screenshot({ path: path.join(outputDir, 'touch-destroy-after-iphone.png'), fullPage: true });
  const after = await page.evaluate(() => window.__monumentRealmsDebug?.getState() ?? null);

  const report = {
    verifiedAt: new Date().toISOString(),
    baseUrl,
    before,
    afterSingleTapPlace: placeState,
    singleTapPlaceSuccess: Boolean(placeSuccessPoint),
    placeSuccessPoint,
    twoFingerDestroy: destroyAttempt,
    after,
    success: Boolean(placeSuccessPoint) && Boolean(destroyAttempt.success)
  };

  await fs.writeFile(path.join(outputDir, 'touch-destroy-proof.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await context.close();
  logStep('touch controls verification done');

  if (!placeSuccessPoint) {
    throw new Error('Touch controls proof failed: single tap did not increase placedCount.');
  }
  if (!destroyAttempt.success) {
    throw new Error('Touch controls proof failed: two-finger destroy did not increase minedCount.');
  }

}

async function verifyDesktopDestroy(browser) {
  logStep('desktop destroy verification start');
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1.25,
    isMobile: false,
    hasTouch: false
  });
  const page = await newPageWithTimeouts(context);
  await gotoAndSettle(page, '/?biome=stonehenge-salisbury', '.scene canvas', 2000);

  const before = await page.evaluate(() => window.__monumentRealmsDebug?.getState() ?? null);
  if (!before) throw new Error('Desktop destroy proof failed: debug API unavailable.');

  await page.screenshot({ path: path.join(outputDir, 'desktop-destroy-before.png'), fullPage: false });

  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Desktop destroy proof failed: missing viewport.');

  const points = [
    { x: Math.round(viewport.width * 0.5), y: Math.round(viewport.height * 0.56) },
    { x: Math.round(viewport.width * 0.5), y: Math.round(viewport.height * 0.62) },
    { x: Math.round(viewport.width * 0.47), y: Math.round(viewport.height * 0.58) }
  ];

  const attempt = await page.evaluate((tapPoints) => {
    const api = window.__monumentRealmsDebug;
    if (!api) return { success: false, minedBefore: 0, minedAfter: 0, targetTypeBefore: null };
    const beforeState = api.getState();
    let success = false;
    let minedHits = 0;

    for (const point of tapPoints) {
      const didMine = api.tapMineAt(point.x, point.y);
      const state = api.getState();
      if (didMine || state.minedCount > beforeState.minedCount) {
        success = true;
        minedHits += 1;
      }
      if (minedHits >= 2) {
        break;
      }
    }

    const afterState = api.getState();
    return {
      success,
      minedHits,
      minedBefore: beforeState.minedCount,
      minedAfter: afterState.minedCount,
      targetTypeBefore: beforeState.targetType,
      targetTypeAfter: afterState.targetType,
      statusAfter: afterState.status
    };
  }, points);

  const after = await page.evaluate(() => window.__monumentRealmsDebug?.getState() ?? null);
  await page.screenshot({ path: path.join(outputDir, 'desktop-destroy-after.png'), fullPage: false });

  const report = {
    verifiedAt: new Date().toISOString(),
    baseUrl,
    before,
    attempt,
    after
  };
  await fs.writeFile(path.join(outputDir, 'desktop-destroy-proof.json'), `${JSON.stringify(report, null, 2)}\\n`, 'utf8');
  await context.close();
  logStep('desktop destroy verification done');

  if (!attempt.success) {
    throw new Error('Desktop destroy proof failed: mining count did not increase.');
  }
}

function buildBeforeAfterMontages() {
  const families = [
    'grass',
    'dirt',
    'stone',
    'sand',
    'sandstone',
    'marble',
    'basalt',
    'timber',
    'ice',
    'skara-earth',
    'skara-stone',
    'skara-hearth',
    'aqueduct-water'
  ];
  const proofDir = path.join(outputDir, 'texture-proof');

  for (const family of families) {
    const before = path.join(proofDir, 'before', `${family}-before.png`);
    const after = path.join(proofDir, 'after', `${family}-after.png`);
    const out = path.join(outputDir, `texture-proof-${family}-before-after.png`);
    if (!fsSync.existsSync(before) || !fsSync.existsSync(after)) {
      continue;
    }
    execFileSync('montage', [before, after, '-tile', '2x1', '-geometry', '+10+0', out], { stdio: 'ignore' });
  }
}

async function main() {
  await ensureDir(outputDir);
  logStep(`capture run started (${baseUrl})`);

  const browser = await chromium.launch({ headless: true });
  try {
    await captureBiomeCloseup(browser, {
      biomeId: 'stonehenge-salisbury',
      outputName: 'game-spawn-stonehenge-desktop.png',
      pose: { x: -28, yOffset: 4.4, z: 18, lookAtX: -1, lookAtYOffset: 2.1, lookAtZ: 0 }
    });
    await captureBiomeCloseup(browser, {
      biomeId: 'colosseum-rome',
      outputName: 'game-spawn-colosseum-desktop.png',
      pose: { x: 214, yOffset: 5.2, z: 36, lookAtX: 248, lookAtYOffset: 3, lookAtZ: 26 }
    });
    await captureBiomeCloseup(browser, {
      biomeId: 'roman-aqueduct',
      outputName: 'game-spawn-roman-aqueduct-desktop.png',
      pose: { x: -264, yOffset: 5.6, z: -156, lookAtX: -228, lookAtYOffset: 4.4, lookAtZ: -164 }
    });
    await captureBiomeCloseup(browser, {
      biomeId: 'skara-brae',
      outputName: 'game-spawn-skara-brae-desktop.png',
      pose: { x: -220, yOffset: 5.1, z: 194, lookAtX: -204, lookAtYOffset: 2.8, lookAtZ: 184 }
    });
    await captureBiomeCloseup(browser, {
      biomeId: 'skara-brae',
      outputName: 'game-skara-closeup-desktop.png',
      pose: { x: -215, yOffset: 3.2, z: 187, lookAtX: -203, lookAtYOffset: 1.5, lookAtZ: 188 }
    });
    await captureBiomeCloseup(browser, {
      biomeId: 'skara-brae',
      outputName: 'game-skara-hut-closeup-desktop.png',
      pose: { x: -199, yOffset: 3.6, z: 194, lookAtX: -203, lookAtYOffset: 1.4, lookAtZ: 188 }
    });
    await captureAqueductFlowProof(browser);

    await captureIphonePortrait(browser, '/?biome=stonehenge-salisbury', 'game-spawn-stonehenge-iphone-portrait.png', '.scene canvas');
    await captureIphoneLandscape(browser, '/?biome=stonehenge-salisbury', 'game-spawn-stonehenge-iphone-landscape.png', '.scene canvas');

    await captureDebugCanvas(
      browser,
      '/debug-render?biome=stonehenge-salisbury&radius=24&slice=0&layers=terrain,flora,monument,portal,special',
      'debug-stonehenge-topdown.png',
      'section.render-grid article:nth-of-type(1)'
    );
    await captureDebugCanvas(
      browser,
      '/debug-render?biome=colosseum-rome&radius=40&slice=0&layers=terrain,monument,portal,special',
      'debug-colosseum-topdown.png',
      'section.render-grid article:nth-of-type(1)'
    );
    await captureDebugCanvas(
      browser,
      '/debug-render?biome=roman-aqueduct&radius=42&slice=0&layers=terrain,monument,portal,special',
      'debug-roman-aqueduct-side.png',
      'section.render-grid article:nth-of-type(2)'
    );
    await captureDebugCanvas(
      browser,
      '/debug-render?biome=skara-brae&radius=34&slice=-2&layers=terrain,flora,monument,portal,special',
      'debug-skara-brae-topdown.png',
      'section.render-grid article:nth-of-type(1)'
    );

    const textureContext = await browser.newContext({
      viewport: { width: 1600, height: 1300 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    });
    const texturePage = await newPageWithTimeouts(textureContext);
    await gotoAndSettle(
      texturePage,
      '/debug-render?biome=stonehenge-salisbury&radius=56&slice=0&layers=terrain,flora,monument,portal,special',
      '.texture-panel',
      1400
    );

    await captureTexturePanel(texturePage, 'grass', 'texture-proof-grass-panel.png');
    await captureTexturePanel(texturePage, 'stone', 'texture-proof-stone-panel.png');
    await captureTexturePanel(texturePage, 'sandstone', 'texture-proof-sandstone-panel.png');
    await captureTexturePanel(texturePage, 'marble', 'texture-proof-marble-panel.png');
    await captureTexturePanel(texturePage, 'basalt', 'texture-proof-basalt-panel.png');
    await captureTexturePanel(texturePage, 'skara-earth', 'texture-proof-skara-earth-panel.png');
    await captureTexturePanel(texturePage, 'skara-stone', 'texture-proof-skara-stone-panel.png');
    await captureTexturePanel(texturePage, 'skara-hearth', 'texture-proof-skara-hearth-panel.png');
    await captureTexturePanel(texturePage, 'aqueduct-water', 'texture-proof-aqueduct-water-panel.png');
    await textureContext.close();

    await captureDesktop(browser, '/version', 'version-page-desktop.png', '.version-page', 700, waitForVersionReady);
    await captureIphonePortrait(
      browser,
      '/version',
      'version-page-iphone-portrait.png',
      '.version-page',
      700,
      waitForVersionReady
    );
    stampVersionOverlay('version-page-desktop.png');
    stampVersionOverlay('version-page-iphone-portrait.png', true);

    await verifyDesktopDestroy(browser);
    await verifyTouchDestroy(browser);
    buildBeforeAfterMontages();
  } finally {
    await browser.close();
  }

  logStep(`captured screenshots into ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
