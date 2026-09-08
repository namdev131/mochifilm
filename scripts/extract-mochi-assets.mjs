import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const htmlPath = "C:/Users/ACER/Downloads/mochi.html";
console.log("Reading:", htmlPath);
const html = readFileSync(htmlPath, "utf8");

function extractDataUri(startPattern) {
  const startIdx = html.indexOf(startPattern);
  if (startIdx === -1) throw new Error("Start pattern not found: " + startPattern);
  const dataStart = html.indexOf("data:image/", startIdx);
  const quote = html[dataStart - 1]; // ' or "
  const dataEnd = html.indexOf(quote, dataStart);
  return html.slice(dataStart, dataEnd);
}

const miniUri = extractDataUri("mini:");
const chairUri = extractDataUri("chair:");
const balloonUri = extractDataUri("balloon:");
const wordmarkUri = extractDataUri("MOCHI_WORDMARK =");

function saveUri(uri, defaultName) {
  const commaIdx = uri.indexOf(",");
  const header = uri.slice(0, commaIdx);
  const base64Data = uri.slice(commaIdx + 1);
  const buffer = Buffer.from(base64Data, "base64");

  const isPng = buffer
    .slice(0, 8)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    buffer.slice(0, 4).toString() === "RIFF" && buffer.slice(8, 12).toString() === "WEBP";

  let finalName = defaultName;
  if (!isPng && defaultName.endsWith(".png") && isWebp) {
    finalName = defaultName.replace(/\.png$/, ".webp");
  }

  const outDir = join(process.cwd(), "public", "assets", "mochi");
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const targetPath = join(outDir, finalName);
  writeFileSync(targetPath, buffer);
  console.log(
    `Saved: ${finalName} | Header: ${header} | PNG: ${isPng} | WebP: ${isWebp} | Size: ${buffer.length} bytes`,
  );
  return finalName;
}

const f1 = saveUri(wordmarkUri, "wordmark.webp");
const f2 = saveUri(miniUri, "mascot-mini.png");
const f3 = saveUri(chairUri, "mascot-chair.webp");
const f4 = saveUri(balloonUri, "mascot-balloon.webp");

console.log("Extracted files successfully:", { f1, f2, f3, f4 });
