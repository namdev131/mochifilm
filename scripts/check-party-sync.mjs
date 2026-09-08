import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const api=readFileSync('src/routes/api/watch-party.ts','utf8');
const ui=readFileSync('src/components/player/WatchPartyRoomPanel.tsx','utf8');
assert.match(api,/set-password/);assert.match(api,/password_hash=\$3 where id=\$1 and host_id=\$2/);
assert.match(api,/memberOrStaff\(user, partyId\)/);
assert.match(ui,/void syncPlayback\(\)/);assert.match(ui,/syncPlayback\(true\)/);
assert.match(ui,/type="password"/);
console.log('PASS static guards: host password permission, member playback, auto/manual sync');
