import { execSync } from "node:child_process";

const tests = [
  "scripts/check-auth-contract.mjs",
  "scripts/check-home-contract.mjs",
  "scripts/check-inplayer-features.mjs",
  "scripts/check-loading-animation.mjs",
  "scripts/check-movie-detail-contract.mjs",
  "scripts/check-movie-loading-animation.mjs",
  "scripts/check-navbar-contract.mjs",
  "scripts/check-player-contract.mjs",
  "scripts/check-player-controls-visibility.mjs",
  "scripts/check-player-desktop-autohide.mjs",
  "scripts/check-player-page-contract.mjs",
  "scripts/check-realtime-search.mjs",
];

console.log("=== CHẠY TOÀN BỘ BỘ TEST HỢP ĐỒNG (12 TEST SUITES) ===\n");
let passed = 0;

for (const t of tests) {
  try {
    process.stdout.write(`Testing ${t}... `);
    execSync(`node ${t}`, { stdio: "pipe" });
    console.log("✓ PASS");
    passed++;
  } catch (err) {
    console.log("✗ FAIL");
    console.error(err.stdout ? err.stdout.toString() : err.message);
    process.exit(1);
  }
}

console.log(`\n🎉 TẤT CẢ ${passed}/${tests.length} TEST SUITES ĐÃ ĐẠT 100%!`);

console.log("\n=== KIỂM TRA SERVER LOCALHOST HTTP ENDPOINTS ===");
try {
  const resHome = await fetch("http://localhost:8091/");
  console.log(`- GET http://localhost:8091/ -> Status ${resHome.status} ${resHome.statusText}`);
  const htmlHome = await resHome.text();
  console.log(`  Length: ${htmlHome.length} bytes, has HTML: ${htmlHome.includes("<!DOCTYPE html>") || htmlHome.includes("<div id=\"root\">") || htmlHome.includes("<script")}`);

  const resAuth = await fetch("http://localhost:8091/auth");
  console.log(`- GET http://localhost:8091/auth -> Status ${resAuth.status} ${resAuth.statusText}`);
  const htmlAuth = await resAuth.text();
  console.log(`  Length: ${htmlAuth.length} bytes, has HTML: ${htmlAuth.includes("<!DOCTYPE html>") || htmlAuth.includes("<div id=\"root\">") || htmlAuth.includes("<script")}`);
} catch (e) {
  console.error("Lỗi kết nối localhost:", e.message);
}
