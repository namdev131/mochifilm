import assert from "node:assert";

const base = "http://127.0.0.1:9223";
const playerUrl =
  "http://127.0.0.1:8090/watch/chien-tranh-giua-cac-vi-sao-maul-chua-te-bong-toi?source=kkphim&ep=0&srv=0";

const version = await fetch(`${base}/json/version`).then((r) => r.json());
const browser = new WebSocket(version.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();
browser.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  const resolve = pending.get(msg.id);
  if (resolve) {
    pending.delete(msg.id);
    resolve(msg);
  }
};
await new Promise((resolve) => {
  browser.onopen = resolve;
});
const sendBrowser = (method, params = {}) =>
  new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    browser.send(JSON.stringify({ id, method, params }));
  });
const created = await sendBrowser("Target.createTarget", { url: "about:blank" });
const attached = await sendBrowser("Target.attachToTarget", {
  targetId: created.result.targetId,
  flatten: true,
});
const sessionId = attached.result.sessionId;
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    browser.send(JSON.stringify({ id, sessionId, method, params }));
  });
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Emulation.setEmulatedMedia", {
  features: [
    { name: "pointer", value: "coarse" },
    { name: "hover", value: "none" },
  ],
});
await send("Page.navigate", { url: playerUrl });
await new Promise((r) => setTimeout(r, 12000));
const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result
    .result.value;
const initial = await evaluate(
  `(() => { const p=document.querySelector('#player'); return {cls:p?.className, paused:document.querySelector('video')?.paused, lockDisplay:getComputedStyle(document.querySelector('.player-controls-lock')).display}; })()`,
);
assert(
  initial.cls.includes("controls-visible"),
  `Paused mobile controls must stay visible: ${JSON.stringify(initial)}`,
);
await evaluate(
  `document.querySelector('#player').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch'}))`,
);
await new Promise((r) => setTimeout(r, 50));
const hidden = await evaluate(
  `(() => { const p=document.querySelector('#player'); return {cls:p.className, paused:document.querySelector('video')?.paused}; })()`,
);
assert(hidden.cls.includes("controls-hidden"), `Tap must hide controls: ${JSON.stringify(hidden)}`);
assert(hidden.paused === initial.paused, "Tap changed playback state");
await evaluate(
  `document.querySelector('#player').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch'}))`,
);
await new Promise((r) => setTimeout(r, 50));
const tapped = await evaluate(
  `(() => { const p=document.querySelector('#player'); return {cls:p.className, paused:document.querySelector('video')?.paused}; })()`,
);
assert(
  tapped.cls.includes("controls-visible"),
  `Second tap must reveal controls: ${JSON.stringify(tapped)}`,
);
assert(tapped.paused === initial.paused, "Tap changed playback state");
await evaluate(`document.querySelector('.player-controls-lock').click()`);
const locked = await evaluate(`document.querySelector('#player').className`);
assert(
  locked.includes("controls-locked") && locked.includes("controls-hidden"),
  `Lock must hide and freeze controls: ${locked}`,
);
await evaluate(
  `document.querySelector('#player').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch'}))`,
);
const lockedAfterTap = await evaluate(`document.querySelector('#player').className`);
assert(lockedAfterTap.includes("controls-hidden"), "Locked player revealed controls on tap");
await evaluate(`document.querySelector('.player-controls-lock').click()`);
const unlocked = await evaluate(`document.querySelector('#player').className`);
assert(
  unlocked.includes("controls-visible") && !unlocked.includes("controls-locked"),
  `Unlock must reveal controls: ${unlocked}`,
);

await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Emulation.setTouchEmulationEnabled", { enabled: false });
await send("Emulation.setEmulatedMedia", {
  features: [
    { name: "pointer", value: "fine" },
    { name: "hover", value: "hover" },
  ],
});
await send("Page.navigate", { url: playerUrl });
await new Promise((r) => setTimeout(r, 12000));
await evaluate(
  `document.querySelector('#player').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:300,clientY:300}))`,
);
const desktop = await evaluate(
  `(() => { const p=document.querySelector('#player'); const lock=getComputedStyle(document.querySelector('.player-controls-lock')); return {cls:p.className, lockDisplay:lock.display}; })()`,
);
assert(
  desktop.cls.includes("controls-visible"),
  `Desktop mousemove must reveal controls: ${JSON.stringify(desktop)}`,
);
assert(desktop.lockDisplay === "none", `Desktop must not show lock: ${JSON.stringify(desktop)}`);
console.log("Interactive mobile/desktop player controls: PASS");
browser.close();
