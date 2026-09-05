import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert";

console.log("-> Đang kiểm tra tính năng nút đổi nguồn, chọn tập và toggle HLS/Embed trong player...");

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// 1. Kiểm tra file component PlayerInDrawer.tsx
console.log("1. Kiểm tra PlayerInDrawer.tsx...");
const drawerPath = join(root, "src/components/player/PlayerInDrawer.tsx");
assert(existsSync(drawerPath), "LỖI: Thiếu src/components/player/PlayerInDrawer.tsx");
const drawerCode = readFileSync(drawerPath, "utf8");
assert(drawerCode.includes("export const PlayerInDrawer"), "LỖI: PlayerInDrawer phải export component");
assert(drawerCode.includes("player-in-drawer-backdrop"), "LỖI: Thiếu backdrop drawer");
assert(drawerCode.includes("drawer-tab-btn"), "LỖI: Thiếu nút tab chọn tập / máy chủ");
assert(drawerCode.includes("drawer-episodes-grid"), "LỖI: Thiếu lưới tập phim");
assert(drawerCode.includes("drawer-servers-list"), "LỖI: Thiếu danh sách máy chủ");
console.log("   ✓ Component PlayerInDrawer hoàn chỉnh.");

// 2. Kiểm tra PlayerControlsChrome.tsx
console.log("2. Kiểm tra PlayerControlsChrome.tsx...");
const chromePath = join(root, "src/components/player/PlayerControlsChrome.tsx");
const chromeCode = readFileSync(chromePath, "utf8");
assert(chromeCode.includes('id="playerStreamModeBtn"'), "LỖI: Thiếu nút playerStreamModeBtn");
assert(chromeCode.includes('id="playerEpisodesBtn"'), "LỖI: Thiếu nút playerEpisodesBtn");
assert(chromeCode.includes('id="playerServerBtn"'), "LỖI: Thiếu nút playerServerBtn");
assert(chromeCode.includes("onToggleStreamMode"), "LỖI: Thiếu prop onToggleStreamMode");
assert(chromeCode.includes("onOpenEpisodes"), "LỖI: Thiếu prop onOpenEpisodes");
assert(chromeCode.includes("onOpenServers"), "LỖI: Thiếu prop onOpenServers");
console.log("   ✓ Nút điều khiển đầy đủ trong thanh công cụ dưới.");

// 3. Kiểm tra PlayerControls.tsx
console.log("3. Kiểm tra PlayerControls.tsx...");
const controlsPath = join(root, "src/components/player/PlayerControls.tsx");
const controlsCode = readFileSync(controlsPath, "utf8");
assert(controlsCode.includes("<PlayerInDrawer"), "LỖI: PlayerControls phải render PlayerInDrawer");
assert(controlsCode.includes("player-top-actions"), "LỖI: Thiếu cụm nút player-top-actions");
assert(controlsCode.includes("toggleStreamMode"), "LỖI: Thiếu hàm toggleStreamMode");
assert(controlsCode.includes("stream-mode-btn"), "LỖI: Thiếu nút stream-mode-btn trên topbar");
assert(controlsCode.includes("hasHls"), "LỖI: resolveStreamSource phải trả về hasHls");
assert(controlsCode.includes("hasEmbed"), "LỖI: resolveStreamSource phải trả về hasEmbed");
console.log("   ✓ Wiring PlayerControls hoàn chỉnh.");

// 4. Kiểm tra route watch.$slug.tsx
console.log("4. Kiểm tra watch.$slug.tsx...");
const routePath = join(root, "src/routes/watch.$slug.tsx");
const routeCode = readFileSync(routePath, "utf8");
assert(routeCode.includes("servers={movie.servers}"), "LỖI: watch.$slug.tsx chưa truyền servers vào PlayerControls");
assert(routeCode.includes("activeServerIndex={srvIndex}"), "LỖI: watch.$slug.tsx chưa truyền activeServerIndex vào PlayerControls");
assert(routeCode.includes("activeEpisodeIndex={epIndex}"), "LỖI: watch.$slug.tsx chưa truyền activeEpisodeIndex vào PlayerControls");
assert(routeCode.includes("onSelectEpisode="), "LỖI: watch.$slug.tsx chưa truyền onSelectEpisode vào PlayerControls");
console.log("   ✓ Wiring route watch.$slug.tsx hoàn chỉnh.");

// 5. Kiểm tra CSS
console.log("5. Kiểm tra player-controls.css...");
const cssPath = join(root, "src/styles/player-controls.css");
const css = readFileSync(cssPath, "utf8");
assert(css.includes(".player-top-actions"), "LỖI: Thiếu CSS .player-top-actions");
assert(css.includes(".stream-mode-badge"), "LỖI: Thiếu CSS .stream-mode-badge");
assert(css.includes(".player-in-drawer-backdrop"), "LỖI: Thiếu CSS .player-in-drawer-backdrop");
assert(css.includes(".player-in-drawer-content"), "LỖI: Thiếu CSS .player-in-drawer-content");
assert(css.includes(".drawer-episodes-grid"), "LỖI: Thiếu CSS .drawer-episodes-grid");
assert(css.includes(".drawer-servers-list"), "LỖI: Thiếu CSS .drawer-servers-list");
console.log("   ✓ CSS đầy đủ, đúng vị trí.");

// 6. Kiểm tra các từ khóa cấm
console.log("6. Kiểm tra không chứa các từ khóa cấm...");
const allCode = [drawerCode, chromeCode, controlsCode, routeCode, css].join("\n");
for (const banned of ["sourceList", "apiCode", "source-pill", "Nguồn phát", "API player đang dùng", "onSelectSource", "onOpenSourceList"]) {
  assert(!allCode.includes(banned), `LỖI: Phát hiện từ khóa cấm: ${banned}`);
}
console.log("   ✓ Hoàn toàn sạch từ khóa cấm.");

console.log("\n============================================================");
console.log("🎉 TẤT CẢ CÁC TÍNH NĂNG ĐỔI MÁY CHỦ, CHỌN TẬP VÀ TOGGLE HLS/EMBED ĐÃ ĐẠT CHUẨN!");
console.log("============================================================");
