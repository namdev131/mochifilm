import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [legal, auth, home, css] = await Promise.all([
  readFile(new URL("../src/routes/legal.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/routes/auth.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/routes/index.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/styles/legal.css", import.meta.url), "utf8"),
]);

assert.match(legal, /createFileRoute\("\/legal"\)/);
assert.match(legal, /Điều khoản sử dụng/);
assert.match(legal, /Chính sách quyền riêng tư/);
assert.match(legal, /Cookie & công nghệ tương tự/);
assert.match(legal, /Quy tắc cộng đồng/);
assert.match(legal, /Supabase/);
assert.match(legal, /Convex/);
assert.match(legal, /Vercel/);
assert.doesNotMatch(legal, /Clerk/);
assert.match(legal, /Cập nhật lần cuối: 08\/09\/2026/);
assert.match(legal, /không phải tư vấn pháp lý/i);
assert.match(auth, /to="\/legal" hash="terms"/);
assert.match(auth, /to="\/legal" hash="privacy"/);
assert.match(home, /to: "\/legal"/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /focus-visible/);
console.log("Legal pages contract: OK");
