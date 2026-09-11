import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [root, offline, worker, watchParty] = await Promise.all([
  readFile(new URL("../src/routes/__root.tsx", import.meta.url), "utf8"),
  readFile(new URL("../public/offline.html", import.meta.url), "utf8"),
  readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  readFile(new URL("../src/routes/api/watch-party.ts", import.meta.url), "utf8"),
]);

assert.match(root, /serviceWorker\.register\("\/sw\.js"\)/);
assert.match(offline, /Mochi Film/);
assert.doesNotMatch(`${offline}\n${watchParty}`, /Lạc Việt/i);
assert.match(worker, /caches\.match\("\/offline\.html"\)/);
assert.match(worker, /caches\.match\(event\.request\)/);
console.log("Offline branding contract: OK");
