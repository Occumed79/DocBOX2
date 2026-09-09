import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Focused portal verification: all five hub destinations plus the single-viewport Agreement gateway.
const OUT='visual-captures';
await mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
const page=await context.newPage();

async function open(path){
  await page.goto(`http://127.0.0.1:3000${path}`,{waitUntil:'networkidle',timeout:60000});
  await page.waitForTimeout(2200);
}
async function shot(name){
  await page.screenshot({path:`${OUT}/${name}.png`,animations:'allow'});
}

await open('/experience');
await page.locator('#provider-portals').first().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
await page.waitForTimeout(2200);
await shot('04-experience-portals');

await open('/experience/agreement');
await page.waitForTimeout(2200);
await shot('12-agreement-portal');

await browser.close();
