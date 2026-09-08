import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const api = await readFile(new URL("../src/lib/api.ts", import.meta.url), "utf8");
const publicApis = await readFile(
  new URL("../src/lib/sources/public-movie-apis.ts", import.meta.url),
  "utf8",
);

assert.match(api, /const HOME_RESTRICTED_TERMS/);
assert.match(api, /isHomeRestricted/);
assert.match(api, /movie\.content/);
assert.match(api, /filterHomeMovies\(sortByNewest/);
assert.match(publicApis, /content: m\.description/);
for (const term of ["đam mỹ", "boy love", "boys love", "lgbt", "18+", "khiêu dâm"]) {
  assert.ok(api.includes(`"${term}"`), `Thiếu từ khóa ${term}`);
}
console.log("Home content filter contract: OK");
