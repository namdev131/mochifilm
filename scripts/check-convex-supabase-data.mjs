import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const auth = read("convex/auth.config.ts");
const favorites = read("convex/favorites.ts");
const history = read("convex/watchHistory.ts");

assert.match(auth, /macmhdkmkkjnfrskhwkr\.supabase\.co\/auth\/v1/);
assert.match(favorites, /getUserIdentity\(\)/);
assert.match(favorites, /export const list/);
assert.match(favorites, /export const toggle/);
assert.match(history, /getUserIdentity\(\)/);

console.log("Supabase identity + Convex user data contract passed");
