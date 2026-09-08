import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [home, player, rightbar] = await Promise.all([
  readFile(new URL("../src/routes/index.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/routes/watch.$slug.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/player/PlayerRightbar.tsx", import.meta.url), "utf8"),
]);

assert.match(home, /\.rpc\("gold_board"/);
assert.match(home, /table: "view_events"/);
assert.match(home, /prev_rank/);
assert.doesNotMatch(home, /index % 3/);
assert.doesNotMatch(home, /2 \+ \(index % 2\)/);
assert.match(home, /Bảng vàng/);
assert.match(home, /Watch Party/);
assert.match(player, /party\?: string/);
assert.match(player, /\.from\("view_events"\)/);
assert.match(rightbar, /partyRequest\(joinCode \? "join" : "create"\)/);
assert.match(rightbar, /action: "create" \| "join"/);
assert.match(rightbar, /\/api\/watch-party/);
assert.doesNotMatch(rightbar, /Tính năng đang hoàn thiện/);
console.log("Realtime ranking + Watch Party contract: OK");
