import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
assert(
  existsSync(new URL("../src/routes/search.tsx", import.meta.url)),
  "Missing dedicated search route",
);
const page = read("src/routes/search.tsx");
assert.match(page, /createFileRoute\("\/search"\)/);
assert.match(page, /searchMoviesMerged\(q, source, pageParam\)/);
assert.doesNotMatch(page, /movies\.slice\(/, "Full results must not be truncated like suggestions");
assert.match(page, /queryKey:.*q.*source/);
assert.match(page, /isError/);
assert.match(page, /Không tìm thấy/);
for (const path of [
  "src/routes/index.tsx",
  "src/components/player/PlayerTopbar.tsx",
  "src/components/movie-detail/DetailTopbar.tsx",
]) {
  assert.match(read(path), /to[=:]\s*["']\/search["']/, `${path} must navigate to search results`);
}
const { build } = await import("esbuild");
const bundled = await build({
  entryPoints: [
    new URL("../src/lib/api.ts", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
  ],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { searchMoviesMerged } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
);
assert.deepEqual(await searchMoviesMerged("   ", "all", 1), []);
const first = await searchMoviesMerged("love", "kkphim", 1);
const second = await searchMoviesMerged("love", "kkphim", 2);
assert(first.length > 6, "Real results must exceed dropdown preview");
assert(
  second.some((movie) => !first.some((previous) => previous.slug === movie.slug)),
  "Page two must fetch additional results",
);
console.log(
  `PASS: route contract + real API pagination (${first.length} / ${second.length} results)`,
);
