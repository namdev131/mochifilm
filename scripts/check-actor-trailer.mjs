import assert from "node:assert/strict";
import { build } from "esbuild";
const b = await build({
  entryPoints: ["src/lib/trailer.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { trailerEmbed } = await import(
  "data:text/javascript;base64," + Buffer.from(b.outputFiles[0].text).toString("base64")
);
assert.equal(
  trailerEmbed("https://youtu.be/dQw4w9WgXcQ"),
  "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
);
for (const bad of [
  "javascript:alert(1)",
  "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
  "https://example.com/video",
  "",
])
  assert.equal(trailerEmbed(bad), null);
console.log("PASS trailer URL validation");
