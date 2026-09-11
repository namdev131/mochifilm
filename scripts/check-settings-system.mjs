import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
for (const path of [
  "src/lib/mochi-settings.ts",
  "src/routes/settings.tsx",
  "src/styles/settings.css",
]) assert(existsSync(new URL(`../${path}`, import.meta.url)), `missing ${path}`);

const store = read("src/lib/mochi-settings.ts");
const route = read("src/routes/settings.tsx");
const root = read("src/routes/__root.tsx");
const player = read("src/routes/watch.$slug.tsx");
const controls = read("src/components/player/PlayerControls.tsx");
const dock = read("src/components/common/MobileBottomDock.tsx");

assert.match(store, /STORAGE_KEY\s*=\s*"mochi-settings"/);
assert.match(store, /useSyncExternalStore/);
assert.match(store, /defaultSource:\s*"auto"/);
assert.match(store, /sourceFallback:\s*true/);
assert.match(store, /performanceMode:\s*"balanced"/);
assert.match(store, /document\.documentElement/);
assert.match(store, /root\.dataset\.performance/);
assert.match(store, /sourcePriority/);
assert.match(route, /Nguồn phát mặc định/);
assert.match(route, /Tự động tối ưu cho thiết bị/);
assert.match(route, /Xóa lịch sử xem/);
assert.match(route, /Khôi phục cài đặt mặc định/);
assert.match(route, /window\.confirm/);
assert.match(root, /initializeMochiSettings/);
assert.match(`${dock}\n${read("src/components/player/PlayerTopbar.tsx")}\n${read("src/components/movie-detail/DetailTopbar.tsx")}`, /to="\/settings"/);
assert.match(player, /getSourceOrder/);
assert.match(player, /sourceFallback/);
assert.match(player, /rememberProgress/);
assert.match(controls, /autoplayNext/);
assert.match(controls, /settings\.playbackRate/);
console.log("PASS: shared Settings store, UI, navigation, source fallback, player preferences");
