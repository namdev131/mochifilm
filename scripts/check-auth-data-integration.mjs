import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));
const provider = read("src/lib/auth-data-provider.tsx");
const auth = read("src/routes/auth.tsx");
const users = read("convex/users.ts");
const root = read("src/routes/__root.tsx");
const loader = read("src/components/common/MochiLoadingScreen.tsx");

assert(pkg.dependencies["@supabase/supabase-js"], "Supabase dependency missing");
assert(!pkg.dependencies["@clerk/clerk-react"], "Clerk dependency must be removed");
assert.doesNotMatch(
  loader,
  /hasShownInitialWebLoading/,
  "Initial loader state must not mutate during render",
);
assert(
  root.indexOf("</AuthDataProvider>") < root.indexOf("<MochiLoadingScreen />"),
  "Initial loader must not depend on auth initialization",
);
assert(pkg.dependencies.convex, "Convex dependency missing");
assert.match(provider, /ConvexProviderWithAuth/, "Convex is not using Supabase auth");
assert.match(provider, /onAuthStateChange/, "Supabase session changes are not observed");
assert.match(auth, /signInWithPassword/, "Supabase password login missing");
assert.match(auth, /signUp/, "Supabase registration missing");
assert.doesNotMatch(auth, /clerk|Clerk/, "Clerk code remains in auth route");
assert.match(users, /getUserIdentity\(\)/, "Convex user sync must derive identity server-side");
assert.match(users, /by_clerk_id/, "Convex user records must be keyed by auth identity");

console.log("Supabase auth + Convex data contract passed");
