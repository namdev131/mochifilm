import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("mochi_film_auth.html", "utf8");
const m = html.match(/class="mascot"[^>]*src="data:image\/png;base64,([^"]+)"/);
if (m) {
  const buf = Buffer.from(m[1], "base64");
  writeFileSync("public/assets/mochi/mascot-auth.png", buf);
  console.log("Saved mascot-auth.png, size:", buf.length);
} else {
  console.log("No mascot found");
}

const logoMatch = html.match(/class="brand-logo"[^>]*src="data:image\/png;base64,([^"]+)"/);
if (logoMatch) {
  const buf = Buffer.from(logoMatch[1], "base64");
  writeFileSync("public/assets/mochi/old-wrong-logo.png", buf);
  console.log("Saved old-wrong-logo.png, size:", buf.length);
}
