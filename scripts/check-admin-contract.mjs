import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const route = read("src/routes/admin.tsx");
const api = read("src/routes/api/admin.ts");
const panels = read("src/components/admin/AdminTabPanels.tsx");
const layout = read("src/components/admin/AdminLayoutView.tsx");
const constants = read("src/components/admin/admin-constants.ts");
const migration = read("supabase/migrations/20260902000001_admin_watch_party_operations.sql");

assert(existsSync(new URL("../src/styles/admin.css", import.meta.url)), "missing scoped admin CSS");
const css = read("src/styles/admin.css");
assert.match(route, /import "@\/styles\/admin\.css"/);
assert.match(route, /data-admin-theme=\{theme\}/);
assert.match(css, /\[data-admin-theme="light"\]/);
assert.doesNotMatch(css, /box-shadow:\s*0\s+0/);

assert.match(route, /user\.email\?\.toLowerCase\(\) === ADMIN_EMAIL/);
assert.match(api, /isMainAdmin/);
assert.match(api, /actor\.isMainAdmin \|\| actor\.permissions\.has\(permission\)/);
assert.match(api, /SUPABASE_SERVICE_ROLE_KEY/);
assert.match(api, /auth\/v1\/admin\/users/);

for (const action of [
  "createUser",
  "deleteUser",
  "setDeputy",
  "setPermission",
  "warnParty",
  "lockParty",
  "closeParty",
  "moderateComment",
  "deleteComment",
]) {
  assert(route.includes(action) || api.includes(action), `missing ${action}`);
}

assert.match(api, /listComments/);
assert.match(api, /listAuditLog/);
assert.match(api, /for update/);
assert.match(api, /begin/);
assert.match(api, /admin_audit_log/);
assert.match(api, /message\.length > 300/);
assert.match(api, /emailPattern/);
assert.match(api, /password\.length < 8/);

assert.match(panels, /onModerateComment/);
assert.match(panels, /onDeleteComment/);
assert.match(panels, /onTogglePartyLock/);
assert.match(panels, /onTogglePermission/);
assert.doesNotMatch(panels, /chờ kết nối API|UI Disabled \/ Presentation|Presentation/);
assert.doesNotMatch(layout, /Dev Preview|Presentation/);
assert.doesNotMatch(constants, /FALLBACK_USERS|FALLBACK_PARTIES|INITIAL_COMMENTS/);
assert.doesNotMatch(route, /FALLBACK_USERS|FALLBACK_PARTIES|INITIAL_COMMENTS/);

for (const permission of [
  "users.view",
  "users.manage",
  "comments.view",
  "comments.moderate",
  "watch_party.view",
  "watch_party.warn",
  "watch_party.lock",
  "watch_party.close",
  "sources.view",
]) {
  assert(api.includes(permission), `API missing permission ${permission}`);
  assert(migration.includes(permission), `migration missing permission ${permission}`);
}

assert.match(migration, /moderation_status/);
assert.match(migration, /moderated_by/);
assert.match(migration, /staff_permissions_permission_check/);
assert.match(migration, /revoke insert, update, delete/);
assert.match(migration, /watch_party_warnings_rate_limit/);

for (const id of [
  "panel-overview",
  "panel-users",
  "panel-permissions",
  "panel-comments",
  "panel-parties",
  "panel-sources",
]) {
  assert(panels.includes(`id="${id}"`), `missing ${id}`);
}
assert.equal((panels.match(/role="tabpanel"/g) || []).length, 6);
assert.equal(
  (`${route}\n${panels}\n${layout}`.match(/<button/g) || []).length,
  (`${route}\n${panels}\n${layout}`.match(/<button[\s\S]*?type=/g) || []).length,
  "button missing type",
);

console.log("PASS: full admin source contract");
