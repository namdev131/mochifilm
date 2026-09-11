import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [home, lobby, rightbar, player, api, migration, timeoutMigration, watchPartyCss] =
  await Promise.all([
    readFile(new URL("../src/routes/index.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/home/WatchPartyLobby.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/player/PlayerRightbar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/watch.$slug.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/api/watch-party.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../supabase/migrations/20260908000000_watch_party_password.sql", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../supabase/migrations/20260908000001_watch_party_host_timeout.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../src/styles/watch-party-room.css", import.meta.url), "utf8"),
  ]);

assert.match(home, /navigateToCategory\("watch-party"\)/);
assert.match(home, /selectedNav === "watch-party"/);
assert.match(home, /<WatchPartyLobby/);
assert.doesNotMatch(home, /trendingMovies\[0\][\s\S]{0,500}Watch Party/);
assert.match(lobby, /action: "list"/);
assert.match(lobby, /has_password/);
assert.match(lobby, /is_member/);
assert.match(lobby, /Nhập mã phòng/);
assert.match(lobby, /joinByCode/);
assert.match(lobby, /Tham gia phòng/);
assert.match(rightbar, /Sao chép mã phòng/);
assert.match(rightbar, /Bạn là chủ phòng/);
const room = await readFile(
  new URL("../src/components/player/WatchPartyRoomPanel.tsx", import.meta.url),
  "utf8",
);
assert.match(player, /<WatchPartyRoomPanel/);
assert.match(player, /className="watch-party-hero"/);
assert.match(player, /className={`app\$\{search\.party \? " watch-party-active" : ""\}`}/);
assert.match(
  watchPartyCss,
  /@media \(min-width: 861px\)[\s\S]*?\.player-page-root \.app\.watch-party-active[\s\S]*?grid-template-columns: minmax\(0, 1fr\) min\(285px, 30vw\);[\s\S]*?\.watch-party-hero[\s\S]*?grid-column: 1 \/ -1;[\s\S]*?\.player-shell[\s\S]*?grid-column: 1;[\s\S]*?\.watch-party-room-panel[\s\S]*?grid-column: 2;[\s\S]*?grid-row: 3;[\s\S]*?margin-top: 0;/,
);
assert.match(room, /Trò chuyện/);
assert.match(room, /Thành viên/);
assert.match(room, /Cài đặt/);
assert.match(room, /action: "chat-send"/);
assert.match(room, /action: "members-list"/);
assert.match(room, /action: "set-lock"/);
assert.match(room, /action: "host-heartbeat"/);
assert.match(room, /30_000/);
assert.match(room, /watch-party-message-admin/);
assert.match(room, /watch-party-admin-notice/);
assert.match(room, /role="status"/);
assert.match(room, /staff_role/);
assert.match(room, /knownMessageIds/);
assert.match(room, /knownMemberIds/);
assert.match(room, /message\.user_id !== userId/);
assert.match(room, /Chia sẻ phòng/);
assert.match(room, /Quét QR/);
assert.match(room, /role="dialog"/);
assert.doesNotMatch(room, /className="watch-party-qr"/);
assert.doesNotMatch(room, /MochiChill|Thùy Linh|QuangAnh/);
assert.match(api, /HOST_ABSENCE_TIMEOUT_MINUTES = 5/);
assert.match(api, /delete from public\.watch_parties/);
assert.match(api, /last_host_seen_at < now\(\) -/);
assert.match(api, /body\.action === "host-heartbeat"/);
assert.match(api, /process\.env\.VITE_SUPABASE_URL/);
assert.match(api, /process\.env\.VITE_SUPABASE_PUBLISHABLE_KEY/);
assert.match(api, /body\.action === "list"/);
assert.match(api, /is_admin/);
assert.match(api, /isAdmin\(user\)/);
assert.match(api, /!isAdmin\(user\)/);
assert.match(api, /member_count/);
assert.match(api, /password_hash/);
assert.match(api, /scrypt/);
assert.doesNotMatch(api, /password\s+text/);
assert.match(rightbar, /action: "set-lock"/);
assert.match(rightbar, /Mật khẩu phòng/);
assert.match(migration, /password_hash text/);
assert.match(timeoutMigration, /last_host_seen_at timestamptz/);
assert.match(timeoutMigration, /delete_stale_watch_parties/);
assert.match(timeoutMigration, /cron\.schedule/);
assert.match(timeoutMigration, /\*\/1 \* \* \* \*/);
console.log("Watch Party lobby/password/lock contract: OK");
