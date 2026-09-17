import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve('docs/research/lusion-reference/raw-site');
const NETWORK = path.join(OUT, 'network');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(NETWORK, { recursive: true });

const allowedHosts = new Set(['lusion.co', 'www.lusion.co', 'lusion.dev', 'www.lusion.dev']);
const seen = new Map();
const failures = [];
const manifest = [];

const knownAssets = {
  'bg_box.buf': { size: 454, sha256: '2c2b4afd860eed3215af1afbed279e714cc1f452be189c9be6c63b173dee422f' },
  'camera_spline.buf': { size: 4784, sha256: '80249a7d29069e6f31d8cd9669273ceb292d8ed14d375a2ae76bbdb0cbe5c64a' },
  'letter_placements.buf': { size: 2272, sha256: '3444250a0ce1bbb285ebc6f2a50dfefbc82c7f82b1994919e1b46a040bf07650' },
  'logo_text.buf': { size: 22748, sha256: '18a123ef46422bb3b67321d255ea8da3da98cd9b1c317ee94ec6209555863f5b' },
  'person.buf': { size: 86170, sha256: '0b5d623b78d3000d2dae46b014eeee6aef27effe7283aafd7b25bfd13eaa72e3' },
  'person_idle.buf': { size: 101372, sha256: 'c1efc427813a116f1a7c4f2ab2689972e04e6be8a0cb6a277de04831f9f92945' },
  'terrain.buf': { size: 396996, sha256: '44018abc47fa75ac5e78795528406b07300d7d6981abcbe7ebb640bff6e25052' },
  'terrain_lines.buf': { size: 71276, sha256: 'ea3800cbe1090f3381aa26d863fbd6abbc680d5e778e2f4077691faf2a093754' },
};

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function safeName(urlString) {
  const u = new URL(urlString);
  let p = decodeURIComponent(u.pathname || '/');
  if (p.endsWith('/')) p += 'index.html';
  const cleanParts = p.split('/').filter(Boolean).map(part => part.replace(/[^A-Za-z0-9._@+()\[\] -]/g, '_').slice(0, 180));
  if (!cleanParts.length) cleanParts.push('index.html');
  let target = path.join(NETWORK, u.hostname, ...cleanParts);
  if (u.search) {
    const ext = path.extname(target);
    const base = ext ? target.slice(0, -ext.length) : target;
    target = `${base}__q_${sha256(Buffer.from(u.search)).slice(0, 12)}${ext}`;
  }
  return target;
}

async function saveResponse(response) {
  const url = response.url();
  let parsed;
  try { parsed = new URL(url); } catch { return; }
  if (!allowedHosts.has(parsed.hostname)) return;
  if (seen.has(url)) return;
  const status = response.status();
  if (status < 200 || status >= 400) {
    failures.push({ url, status, reason: 'http-status' });
    return;
  }
  let body;
  try { body = await response.body(); }
  catch (e) {
    failures.push({ url, status, reason: 'body-read-failed', error: String(e) });
    return;
  }
  if (!body?.length) return;

  const headers = await response.allHeaders();
  const contentType = headers['content-type'] || 'application/octet-stream';
  const digest = sha256(body);
  const target = safeName(url);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body);
  seen.set(url, { target, digest });
  manifest.push({
    url,
    path: path.relative(OUT, target),
    status,
    contentType,
    bytes: body.length,
    sha256: digest,
  });
}

async function capturePage(page, url, label) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(7000);

  const viewport = page.viewportSize() || { width: 1440, height: 1000 };
  for (let i = 0; i < 10; i++) {
    await page.mouse.move(viewport.width * (0.15 + (i % 5) * 0.17), viewport.height * (0.2 + (i % 4) * 0.18), { steps: 12 });
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(700);
  }
  await page.mouse.down();
  await page.waitForTimeout(2200);
  await page.mouse.up();
  await page.waitForTimeout(1200);

  await page.screenshot({ path: path.join(OUT, `${label}-fullpage.png`), fullPage: true });
  const dom = await page.content();
  fs.writeFileSync(path.join(OUT, `${label}-dom.html`), dom);

  const state = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource').map(r => ({
      name: r.name,
      initiatorType: r.initiatorType,
      duration: r.duration,
      transferSize: r.transferSize,
      encodedBodySize: r.encodedBodySize,
      decodedBodySize: r.decodedBodySize,
    }));
    const canvases = [...document.querySelectorAll('canvas')].map((canvas, index) => {
      const result = { index, width: canvas.width, height: canvas.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight };
      try {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          result.webgl = {
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
            extensions: gl.getSupportedExtensions(),
          };
        }
      } catch (e) { result.webglError = String(e); }
      return result;
    });
    return {
      url: location.href,
      title: document.title,
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      resources,
      canvases,
      scriptSources: [...document.scripts].map(s => s.src).filter(Boolean),
      stylesheetSources: [...document.styleSheets].map(s => s.href).filter(Boolean),
      imageSources: [...document.images].map(i => i.currentSrc || i.src).filter(Boolean),
    };
  });
  fs.writeFileSync(path.join(OUT, `${label}-browser-state.json`), JSON.stringify(state, null, 2));

  for (const resource of state.resources) {
    try {
      const u = new URL(resource.name);
      if (!allowedHosts.has(u.hostname) || seen.has(resource.name)) continue;
      const resp = await page.context().request.get(resource.name, { timeout: 60000, failOnStatusCode: false });
      if (resp.status() >= 200 && resp.status() < 400) {
        const body = await resp.body();
        const target = safeName(resource.name);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, body);
        const digest = sha256(body);
        seen.set(resource.name, { target, digest });
        manifest.push({ url: resource.name, path: path.relative(OUT, target), status: resp.status(), contentType: resp.headers()['content-type'] || 'application/octet-stream', bytes: body.length, sha256: digest, source: 'performance-refetch' });
      }
    } catch (e) {
      failures.push({ url: resource.name, reason: 'performance-refetch-failed', error: String(e) });
    }
  }
}

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('response', response => { void saveResponse(response); });
page.on('console', msg => fs.appendFileSync(path.join(OUT, 'browser-console.log'), `[${msg.type()}] ${msg.text()}\n`));
page.on('pageerror', error => fs.appendFileSync(path.join(OUT, 'browser-errors.log'), `${String(error)}\n`));

await capturePage(page, 'https://lusion.co/', 'home');
await capturePage(page, 'https://lusion.co/about', 'about');
await page.waitForTimeout(3000);
await browser.close();

manifest.sort((a, b) => a.url.localeCompare(b.url));
const byHash = new Map(manifest.map(m => [m.sha256, m]));
const validation = {};
const recoveredDir = path.join(OUT, 'recovered-known-assets');
fs.mkdirSync(recoveredDir, { recursive: true });
for (const [name, expected] of Object.entries(knownAssets)) {
  const hit = byHash.get(expected.sha256);
  validation[name] = { expected, matched: Boolean(hit), source: hit?.path || null };
  if (hit) {
    fs.copyFileSync(path.join(OUT, hit.path), path.join(recoveredDir, name));
  }
}

fs.writeFileSync(path.join(OUT, 'archive-manifest.json'), JSON.stringify({
  generatedAtUtc: new Date().toISOString(),
  resourceCount: manifest.length,
  totalBytes: manifest.reduce((sum, x) => sum + x.bytes, 0),
  resources: manifest,
  failures,
  knownAssetValidation: validation,
}, null, 2));
fs.writeFileSync(path.join(OUT, 'resource-urls.txt'), manifest.map(x => x.url).join('\n') + '\n');
fs.writeFileSync(path.join(OUT, 'missing-or-blocked.txt'), failures.map(x => JSON.stringify(x)).join('\n') + (failures.length ? '\n' : ''));

console.log(JSON.stringify({ resourceCount: manifest.length, totalBytes: manifest.reduce((s, x) => s + x.bytes, 0), knownAssetValidation: validation }, null, 2));
