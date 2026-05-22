import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.SCREENSHOT_URL || 'http://localhost:3000';
const OUT = './screenshots';
fs.mkdirSync(OUT, { recursive: true });

const viewports = {
  mobile: { width: 380, height: 844, deviceScaleFactor: 2 },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
};

const routes = [
  { name: 'flip-intro', path: '/flip', actions: [] },
  { name: 'flip-playing', path: '/flip', actions: [['click', 'text=CALL IT']] },
  { name: 'flip-reveal', path: '/flip', actions: [
    ['click', 'button:has-text("CALL IT")'],
    ['fill', 'input[inputmode="decimal"] >> nth=0', '10'],
    ['fill', 'input[inputmode="decimal"] >> nth=1', '120'],
    ['click', 'button:has-text("High")'],
    ['click', 'button:has-text("LOCK IN")'],
  ]},
  // /app redirects unauth visitors to / (LoginPage). Without an authed
  // session this route ends up capturing the login splash. The post() hook
  // waits for either the real dashboard chrome (data-dashboard-loaded /
  // <main> / .dashboard) or the splash transition to settle. Magic-link
  // auth (signInWithOtp) means SCREENSHOT_EMAIL/PASS env vars can't sign
  // in headlessly — see report.
  { name: 'app-dashboard', path: '/app', actions: [
    ['waitForLoadState', 'networkidle'],
    ['waitForTimeout', 2500],
  ], post: async (page) => {
    try {
      await page.waitForSelector('[data-dashboard-loaded], main, .dashboard', { timeout: 10000 });
    } catch {
      /* fallthrough — likely on LoginPage, splash already settled */
    }
    await page.waitForTimeout(1000);
  }},
  { name: 'og-flip', path: '/og-flip.png', actions: [], raw: true },
  { name: 'og-flip-daily', path: '/og-flip.png?day=19&item=Carhartt+Detroit+Jacket+J97+(90s)', actions: [], raw: true },
  { name: 'og-app', path: '/og-app.png', actions: [], raw: true },
];

const browser = await chromium.launch();

for (const [vpName, vp] of Object.entries(viewports)) {
  for (const r of routes) {
    if (r.raw && vpName === 'mobile') continue; // OG only desktop
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}${r.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      for (const [action, sel, val] of r.actions) {
        if (action === 'waitForLoadState') {
          await page.waitForLoadState(sel);
          continue;
        }
        if (action === 'waitForTimeout') {
          await page.waitForTimeout(sel);
          continue;
        }
        await page.waitForTimeout(400);
        if (action === 'click') await page.click(sel);
        if (action === 'fill') await page.fill(sel, val);
      }
      if (typeof r.post === 'function') {
        await r.post(page);
      }
      await page.waitForTimeout(800);
      const file = `${OUT}/${r.name}-${vpName}.png`;
      await page.screenshot({ path: file, fullPage: !r.raw });
      console.log(`✓ ${file}`);
    } catch (e) {
      console.error(`✗ ${r.name}-${vpName}: ${e.message}`);
    }
    await ctx.close();
  }
}

await browser.close();
