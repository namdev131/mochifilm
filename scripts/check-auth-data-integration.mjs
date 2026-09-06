import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));
const provider = read("src/lib/auth-data-provider.tsx");
const auth = read("src/routes/auth.tsx");
const users = read("convex/users.ts");
const root = read("src/routes/__root.tsx");
const loader = read("src/components/common/MochiLoadingScreen.tsx");

assert(pkg.dependencies["@clerk/clerk-react"], "Clerk dependency missing");
assert.doesNotMatch(
  loader,
  /hasShownInitialWebLoading/,
  "Initial loader state must not mutate during render",
);
assert(
  root.indexOf("</AuthDataProvider>") < root.indexOf("<MochiLoadingScreen />"),
  "Initial loader must not depend on Clerk initialization",
);
assert(pkg.dependencies.convex, "Convex dependency missing");
assert.match(provider, /ConvexProviderWithClerk/, "Convex is not using Clerk auth");
assert.match(auth, /id="clerk-captcha"/, "Clerk CAPTCHA mount point missing from sign-up form");
assert.doesNotMatch(
  auth,
  /localStorage\.setItem\("mochi_user"/,
  "Clerk identity must not be duplicated in localStorage",
);
assert.match(users, /getUserIdentity\(\)/, "Convex user sync must derive identity server-side");
assert.match(users, /by_clerk_id/, "Convex user records must be keyed by Clerk identity");

console.log("Clerk auth + Convex data contract passed");
