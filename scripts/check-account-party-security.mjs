import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [auth, partyApi, rightbar, room, account, home, migration] = await Promise.all([
  readFile(new URL("../src/routes/auth.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/routes/api/watch-party.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/player/PlayerRightbar.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/player/WatchPartyRoomPanel.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/routes/account.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/routes/index.tsx", import.meta.url), "utf8"),
  readFile(
    new URL("../supabase/migrations/20260908000002_watch_party_schedule.sql", import.meta.url),
    "utf8",
  ),
]);

assert.match(auth, /AUTH_ATTEMPT_WINDOW_MS/);
assert.match(auth, /AUTH_MAX_ATTEMPTS/);
assert.match(auth, /retryAfter/);
assert.match(auth, /disabled=\{isLoading \|\| cooldownSeconds > 0\}/);
assert.match(partyApi, /scheduled_at timestamptz/);
assert.match(partyApi, /scheduled_at <= now\(\)/);
assert.match(partyApi, /Phòng chưa đến giờ mở/);
assert.match(rightbar, /type="datetime-local"/);
assert.match(rightbar, /scheduledAt/);
assert.match(room, /api\.qrserver\.com/);
assert.match(room, /Quét QR để tham gia phòng/);
assert.match(room, /Quy tắc/);
assert.match(room, /watch-party-rules\.jpg/);
assert.match(room, /alt="Nội quy cộng đồng Watch Party"/);
assert.match(account, /createFileRoute/);
assert.match(account, /from\("profiles"\)/);
assert.match(account, /auth\.updateUser/);
assert.match(account, /Ngày tham gia/);
assert.match(home, /to: "\/account"/);
assert.match(migration, /scheduled_at timestamptz/);
console.log("Account, auth anti-spam, party QR/schedule contract: OK");
