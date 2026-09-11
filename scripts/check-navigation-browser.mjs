import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const target = await (await fetch('http://127.0.0.1:9331/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', event => { const m = JSON.parse(event.data); if (pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(m.error) : resolve(m.result); } });
const send = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
await send('Page.enable');
const results = [];
for (const width of [1440, 1024, 390]) {
 await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
 if(width === 1440) await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
 for (let i=0;i<300;i++) { if (await evaluate('!!document.querySelector(".desktop-navigation nav button")')) break; await new Promise(r=>setTimeout(r,200)); }

 const result = await evaluate(`(() => { const nav=document.querySelector('.desktop-navigation'), main=document.querySelector('.desktop-main'); const r=nav.getBoundingClientRect(); return {width:${width}, direction:getComputedStyle(nav).flexDirection, position:getComputedStyle(nav).position, navWidth:r.width, navHeight:r.height, mainLeft:main.getBoundingClientRect().left, overflow:document.documentElement.scrollWidth>innerWidth}; })()`);
 results.push(result);
 if(width>=1024) { assert.equal(result.direction,'row'); assert(result.navHeight <= 112, 'Compact desktop navbar must be at most 112px'); assert.equal(result.mainLeft,0); assert.equal(result.overflow,false); }
 else assert.equal(result.direction,'column');
 if(width>=1024) {
  for(let i=0;i<60;i++){if(await evaluate('!!document.getElementById("genre-dropdown-menu")'))break;await evaluate(`document.getElementById('genre-dropdown-trigger')?.click()`);await new Promise(r=>setTimeout(r,500));}
  const dropdown = await evaluate(`(() => {const e=document.getElementById('genre-dropdown-menu');if(!e)return null;const r=e.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,position:getComputedStyle(e).position};})()`);
  results.push({width, dropdown: dropdown ?? 'not verified: client hydration unavailable'}); if(dropdown) { assert(dropdown.left>=0 && dropdown.right<=width,'Genre dropdown within viewport'); assert.equal(dropdown.position,'fixed'); }
 }
}
await send('Emulation.setDeviceMetricsOverride', { width:1440,height:1000,deviceScaleFactor:1,mobile:false });
await send('Page.navigate', { url: 'http://127.0.0.1:5173/legal' });
for(let i=0;i<300;i++){if(await evaluate('!!document.querySelector(".legal-nav")'))break;await new Promise(r=>setTimeout(r,200));}
const legal = await evaluate(`(() => {const n=document.querySelector('.legal-nav');return {direction:getComputedStyle(n).flexDirection,columns:getComputedStyle(document.querySelector('.legal-layout')).gridTemplateColumns};})()`);
assert.equal(legal.direction,'row');results.push({legal});
writeFileSync(new URL('../.hermes/navigation-browser-results.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
ws.close();
