import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const OUT = path.resolve('docs/research/lusion-reference/raw-site');
const NET = path.join(OUT, 'network');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(NET, { recursive: true });

const ALLOWED = new Set(['lusion.co','www.lusion.co','lusion.dev','www.lusion.dev']);
const pending = new Set();
const inflight = new Set();
const seen = new Map();
const resources = [];
const failures = [];
const h = b => crypto.createHash('sha256').update(b).digest('hex');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const known = {
  'bg_box.buf':['2c2b4afd860eed3215af1afbed279e714cc1f452be189c9be6c63b173dee422f',454],
  'camera_spline.buf':['80249a7d29069e6f31d8cd9669273ceb292d8ed14d375a2ae76bbdb0cbe5c64a',4784],
  'letter_placements.buf':['3444250a0ce1bbb285ebc6f2a50dfefbc82c7f82b1994919e1b46a040bf07650',2272],
  'logo_text.buf':['18a123ef46422bb3b67321d255ea8da3da98cd9b1c317ee94ec6209555863f5b',22748],
  'person.buf':['0b5d623b78d3000d2dae46b014eeee6aef27effe7283aafd7b25bfd13eaa72e3',86170],
  'person_idle.buf':['c1efc427813a116f1a7c4f2ab2689972e04e6be8a0cb6a277de04831f9f92945',101372],
  'terrain.buf':['44018abc47fa75ac5e78795528406b07300d7d6981abcbe7ebb640bff6e25052',396996],
  'terrain_lines.buf':['ea3800cbe1090f3381aa26d863fbd6abbc680d5e778e2f4077691faf2a093754',71276],
};

function dst(raw) {
  const u = new URL(raw);
  let parts = decodeURIComponent(u.pathname || '/').split('/').filter(Boolean)
    .map(x => x.replace(/[^A-Za-z0-9._@+()\[\] -]/g,'_').slice(0,160));
  if (!parts.length || u.pathname.endsWith('/')) parts.push('index.html');
  let p = path.join(NET,u.hostname,...parts);
  if (u.search) {
    const e = path.extname(p), b = e ? p.slice(0,-e.length) : p;
    p = `${b}__q_${h(Buffer.from(u.search)).slice(0,10)}${e}`;
  }
  return p;
}

async function bodyWithTimeout(response, ms=20000) {
  return await Promise.race([
    response.body(),
    new Promise((_,rej)=>setTimeout(()=>rej(new Error('response-body-timeout')),ms)),
  ]);
}

async function save(response) {
  const url = response.url();
  let u;
  try { u = new URL(url); } catch { return; }
  if (!ALLOWED.has(u.hostname) || seen.has(url) || inflight.has(url)) return;
  inflight.add(url);
  try {
    const status = response.status();
    if (status < 200 || status >= 400) {
      failures.push({url,status,reason:'http-status'}); return;
    }
    const headers = await response.allHeaders();
    const len = Number(headers['content-length'] || 0);
    if (len > 95_000_000) {
      failures.push({url,status,reason:'content-length-cap',bytes:len}); return;
    }
    const body = await bodyWithTimeout(response,20000);
    if (!body?.length) return;
    const sha256 = h(body), target = dst(url);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,body);
    const item = {url,path:path.relative(OUT,target),status,contentType:headers['content-type']||'application/octet-stream',bytes:body.length,sha256};
    seen.set(url,item); resources.push(item);
  } catch (e) {
    failures.push({url,reason:String(e).includes('timeout')?'body-timeout':'body-read-failed',error:String(e)});
  } finally { inflight.delete(url); }
}

function onResponse(r) {
  let p; p = save(r).finally(()=>pending.delete(p)); pending.add(p);
}

async function settle(maxMs=25000) {
  const end = Date.now()+maxMs;
  while (pending.size && Date.now()<end) {
    await Promise.race([Promise.allSettled([...pending]),sleep(1000)]);
  }
  if (pending.size) failures.push({reason:'pending-response-deadline',count:pending.size});
}

async function pageDump(page,url,label) {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await sleep(5500);
  await page.screenshot({path:path.join(OUT,`${label}-hero.png`)});
  const vp = page.viewportSize() || {width:1440,height:1000};
  for (let i=0;i<6;i++) {
    await page.mouse.move(vp.width*(0.18+(i%4)*0.2),vp.height*(0.25+(i%3)*0.22),{steps:8});
    if (i===2) { await page.mouse.down(); await sleep(1600); await page.mouse.up(); }
    await page.mouse.wheel(0,900); await sleep(550);
  }
  await sleep(1600);
  await page.screenshot({path:path.join(OUT,`${label}-after-interaction.png`)});
  fs.writeFileSync(path.join(OUT,`${label}-dom.html`),await page.content());
  const state = await page.evaluate(()=>({
    url:location.href,title:document.title,userAgent:navigator.userAgent,
    viewport:{width:innerWidth,height:innerHeight,devicePixelRatio},
    resources:performance.getEntriesByType('resource').map(r=>({name:r.name,initiatorType:r.initiatorType,duration:r.duration,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize})),
    canvases:[...document.querySelectorAll('canvas')].map((c,index)=>{
      const o={index,width:c.width,height:c.height,clientWidth:c.clientWidth,clientHeight:c.clientHeight};
      try { const gl=c.getContext('webgl2')||c.getContext('webgl'); if(gl)o.webgl={version:gl.getParameter(gl.VERSION),shadingLanguageVersion:gl.getParameter(gl.SHADING_LANGUAGE_VERSION),vendor:gl.getParameter(gl.VENDOR),renderer:gl.getParameter(gl.RENDERER),maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),extensions:gl.getSupportedExtensions()}; } catch(e){o.webglError=String(e);} return o;
    }),
    scripts:[...document.scripts].map(s=>s.src).filter(Boolean),
    stylesheets:[...document.styleSheets].map(s=>s.href).filter(Boolean),
    images:[...document.images].map(i=>i.currentSrc||i.src).filter(Boolean),
  }));
  fs.writeFileSync(path.join(OUT,`${label}-browser-state.json`),JSON.stringify(state,null,2));
  await settle(15000);
}

const browser = await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const context = await browser.newContext({viewport:{width:1440,height:1000}});
const page = await context.newPage();
page.on('response',onResponse);
page.on('console',m=>fs.appendFileSync(path.join(OUT,'browser-console.log'),`[${m.type()}] ${m.text()}\n`));
page.on('pageerror',e=>fs.appendFileSync(path.join(OUT,'browser-errors.log'),`${String(e)}\n`));

await pageDump(page,'https://lusion.co/','home');
await pageDump(page,'https://lusion.co/about','about');
await settle(20000);
await browser.close();

resources.sort((a,b)=>a.url.localeCompare(b.url));
const byHash = new Map(resources.map(x=>[x.sha256,x]));
const recovered = path.join(OUT,'recovered-known-assets'); fs.mkdirSync(recovered,{recursive:true});
const knownAssetValidation = {};
for (const [name,[sha256,bytes]] of Object.entries(known)) {
  const hit = byHash.get(sha256);
  knownAssetValidation[name]={expectedSha256:sha256,expectedBytes:bytes,matched:!!hit,source:hit?.path||null};
  if(hit)fs.copyFileSync(path.join(OUT,hit.path),path.join(recovered,name));
}
const totalBytes=resources.reduce((n,x)=>n+x.bytes,0);
fs.writeFileSync(path.join(OUT,'archive-manifest.json'),JSON.stringify({generatedAtUtc:new Date().toISOString(),resourceCount:resources.length,totalBytes,resources,failures,knownAssetValidation},null,2));
fs.writeFileSync(path.join(OUT,'resource-urls.txt'),resources.map(x=>x.url).join('\n')+'\n');
fs.writeFileSync(path.join(OUT,'missing-or-blocked.txt'),failures.map(x=>JSON.stringify(x)).join('\n')+(failures.length?'\n':''));
console.log(JSON.stringify({resourceCount:resources.length,totalBytes,knownAssetValidation,failures:failures.length},null,2));
