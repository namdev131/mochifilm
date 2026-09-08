import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const hero = readFileSync("src/components/movie-detail/DetailHero.tsx", "utf8");
assert.doesNotMatch(
  hero,
  /href=\{movie\.metadata_url\}/,
  "Metadata control must not navigate off-site",
);
assert.match(hero, /<details/);
assert.match(hero, /<summary/);
assert.match(hero, /movie\.actors/);
assert.match(hero, /movie\.director/);
console.log("PASS: inline metadata disclosure, cast/director, no external navigation");
