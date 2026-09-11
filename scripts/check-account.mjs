import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";
const path = new URL("../src/lib/account.ts", import.meta.url);
assert(existsSync(path), "Account membership resolver is missing");
const code = ts.transpileModule(readFileSync(path, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { accountMembership, validateAccountProfile, parseAccountFavorites } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);
const now = Date.parse("2026-09-09T00:00:00Z");
assert.equal(accountMembership({ app_metadata: {} }, now).kind, "member");
assert.equal(
  accountMembership({ user_metadata: { role: "admin", vip_expires_at: "2099-01-01" } }, now).kind,
  "member",
);
assert.equal(accountMembership({ email: "LACVIET55@PROTON.ME" }, now).kind, "admin");
assert.equal(accountMembership({ app_metadata: { role: "admin" } }, now).kind, "admin");
assert.equal(
  accountMembership({ app_metadata: { role: "deputy_admin" } }, now).kind,
  "deputy_admin",
);
assert.equal(
  accountMembership({ app_metadata: { role: "vip", vip_plan: "quarterly", vip_expires_at: "2026-09-10T00:00:00Z" } }, now)
    .kind,
  "vip",
);
assert.equal(
  accountMembership({ app_metadata: { role: "vip", vip_plan: "quarterly", vip_expires_at: "2026-09-10T00:00:00Z" } }, now)
    .label,
  "VIP 3 tháng",
);
assert.equal(
  accountMembership({ app_metadata: { role: "vip", vip_expires_at: "2026-09-09T00:00:00Z" } }, now)
    .kind,
  "member",
);
assert.equal(
  accountMembership({ app_metadata: { role: "vip", vip_expires_at: "invalid" } }, now).kind,
  "member",
);
assert.equal(accountMembership({ app_metadata: { role: "vip" } }, now).kind, "member");
assert.equal(
  accountMembership({ app_metadata: { role: "member", vip_expires_at: "2099-01-01" } }, now).kind,
  "member",
);
assert.equal(
  accountMembership({ app_metadata: { role: "admin", vip_expires_at: "2099-01-01" } }, now).kind,
  "admin",
);
assert.throws(() =>
  validateAccountProfile({
    displayName: " ",
    avatarUrl: "",
    bio: "",
    phone: "",
    country: "",
    birthday: "",
    gender: "",
  }),
);
assert.throws(() =>
  validateAccountProfile({
    displayName: "Test",
    avatarUrl: "javascript:alert(1)",
    bio: "",
    phone: "",
    country: "",
    birthday: "",
    gender: "",
  }),
);
const profile = {
  displayName: " Test ",
  avatarUrl: "https://example.com/avatar.png",
  bio: "Bio",
  phone: "",
  country: "",
  birthday: "",
  gender: "",
};
assert.equal(validateAccountProfile(profile).displayName, "Test");
assert.deepEqual(parseAccountFavorites("broken"), []);
assert.deepEqual(parseAccountFavorites("{}"), []);
assert.equal(
  parseAccountFavorites(
    JSON.stringify([
      { slug: "movie", name: "Movie", source: "ophim" },
      { slug: "bad", source: "invalid" },
    ]),
  ).length,
  1,
);
const route = readFileSync(new URL("../src/routes/account.tsx", import.meta.url), "utf8");
assert.match(route, /accountMembership/);
assert.match(route, /ShieldCheck/);
assert.match(route, /Crown/);
assert.match(route, /UserRound/);
assert.doesNotMatch(
  route,
  /Sếp Đẹp Trai|Còn 120 ngày|FAVORITE_MOVIES|Devices state for demo|142 giờ|1\.2K/,
);
assert.match(route, /account-history-row/);
assert.match(route, /item\.poster \? <img/);
assert.match(route, /account-poster-placeholder/);
assert.match(route, /history\?\.length \?\? "—"/);
assert.match(route, /unlocked \?\? "—"/);
const css = readFileSync(new URL("../src/styles/account.css", import.meta.url), "utf8");
assert.match(css, /grid-template-columns: 54px minmax\(0, 1fr\) auto/);
assert.match(css, /\.account-library-panel \.account-movies-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
console.log("Account checks passed: roles, validation, real data, library layout contracts");
