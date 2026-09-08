import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { build } from "esbuild";
assert(existsSync("src/lib/movie-metadata.server.ts"), "Missing metadata service");
const output = await build({
  entryPoints: ["src/lib/movie-metadata.server.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { metadataResponse, matchingTitle } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);
assert(matchingTitle("The Matrix", "The Matrix"));
assert(!matchingTitle("The Matrix", "The Matrix Reloaded"));
assert.equal(
  (await metadataResponse(new Request("http://localhost/api/movie-metadata"))).status,
  400,
);
assert.equal(
  (
    await metadataResponse(
      new Request("http://localhost/api/movie-metadata?title=Matrix&type=invalid"),
    )
  ).status,
  400,
);
const response = await metadataResponse(
  new Request("http://localhost/api/movie-metadata?title=The%20Matrix&year=1999&type=movie"),
);
const body = await response.json();
assert.equal(response.status, 200);
assert.equal(body.metadata, null);
assert.equal(body.status, "not_configured");
console.log("PASS title matching, input validation, missing-key graceful fallback");
