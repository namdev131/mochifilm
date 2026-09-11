import assert from "node:assert/strict";

const base = process.argv[2] || "http://127.0.0.1:4173";
const response = await fetch(`${base}/duong-dan-khong-ton-tai`);
const html = await response.text();
assert.equal(response.status, 404);
assert.match(html, /Mochi bị lạc mất đường rồi/);
assert.match(html, /Trang này không tồn tại/);
assert.match(html, /mascot-404\.webp/);
console.log("404 runtime contract passed");
