import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Screenshot-driven visual pass: recapture current main after Network/Resources/Agreement fixes.
const OUT='visual-captures';
await mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
const page=await context.newPage();

async function open(path){
  await page.goto(`http://127.0.0.1:3000${path}`,{waitUntil:'networkidle',timeout:60000});
  await page.waitForTimeout(1500);
}
async function shot(name){
  await page.screenshot({path:`${OUT}/${name}.png`,animations:'allow'});
}
async function scrollTo(selector){
  await page.locator(selector).first().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  await page.waitForTimeout(1000);
}

await open('/experience');
await shot('01-experience-opening');
await scrollTo('#story-1');
await shot('02-experience-origin');
await scrollTo('#story-5');
await shot('03-experience-clinical');
await scrollTo('#provider-portals');
await shot('04-experience-portals');

await open('/experience/history');
await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight*.46,behavior:'instant'}));
await page.waitForTimeout(1200);
await shot('05-history-midpoint');

await open('/experience/network');
await shot('06-network-world');
const europe=page.getByRole('button',{name:'Europe',exact:true});
if(await europe.count()){await europe.click();await page.waitForTimeout(1100);await shot('07-network-europe')}

await open('/experience/resources');
await shot('08-resources-dive');
const resourceHeading=page.getByRole('heading',{name:'Start with what you do.'});
if(await resourceHeading.count()){await resourceHeading.evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(1100);await shot('09-resources-field')}

await open('/experience/questions');
await shot('10-questions-receive');
const examine=page.getByRole('button',{name:/Examine/}).first();
if(await examine.count()){await examine.click();await page.waitForTimeout(700);await shot('11-questions-examine')}

await open('/experience/agreement');
await shot('12-agreement-portal');

await browser.close();
