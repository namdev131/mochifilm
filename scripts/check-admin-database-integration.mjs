import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [route, panel, convexAdmin, supabaseAdmin] = await Promise.all([
  read("src/routes/admin.tsx"),
  read("src/components/admin/AdminTabPanels.tsx"),
  read("convex/admin.ts"),
  read("src/routes/api/admin.ts"),
]);

assert.match(route, /useConvexQuery\(api\.admin\.dashboard/);
assert.match(route, /databaseStats=/);
assert.match(panel, /Supabase/);
assert.match(panel, /Convex/);
assert.match(convexAdmin, /getUserIdentity\(\)/);
assert.match(convexAdmin, /ADMIN_EMAILS/);
assert.match(convexAdmin, /ADMIN_EMAILS\.has\(identity\.email\.toLowerCase\(\)\)/);
assert.doesNotMatch(convexAdmin, /throw new Error\("Forbidden"\)/);
assert.match(convexAdmin, /watchHistory/);
assert.match(convexAdmin, /favorites/);
assert.match(
  supabaseAdmin,
  /ADMIN_EMAILS = new Set\(\["lacviet55@proton.me", "admin@mochifilm.vn"\]\)/,
);
console.log("Admin Supabase + Convex dashboard contract: OK");
