import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert";

console.log("-> Đang kiểm tra hợp đồng Trang Video Player Chuyên Dụng (Player Page Contract)...");

const projectRoot = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// 1. Kiểm tra route /watch/$slug
console.log("1. Kiểm tra tồn tại và cấu hình route /watch/$slug...");
const watchRoutePath = join(projectRoot, "src/routes/watch.$slug.tsx");
assert(existsSync(watchRoutePath), "LỖI: Thiếu file route src/routes/watch.$slug.tsx");
const watchRouteCode = readFileSync(watchRoutePath, "utf8");

assert(
  watchRouteCode.includes('createFileRoute("/watch/$slug")'),
  "LỖI: Route phải đăng ký createFileRoute('/watch/$slug')",
);
assert(
  watchRouteCode.includes("validateSearch"),
  "LỖI: Route phải có validateSearch kiểm tra source, ep, srv",
);
assert(
  watchRouteCode.includes("Route.useParams()"),
  "LỖI: Route phải đọc slug qua Route.useParams()",
);
assert(
  watchRouteCode.includes("Route.useSearch()"),
  "LỖI: Route phải đọc search params qua Route.useSearch()",
);

const routeTreePath = join(projectRoot, "src/routeTree.gen.ts");
assert(existsSync(routeTreePath), "LỖI: Thiếu src/routeTree.gen.ts");
const routeTreeCode = readFileSync(routeTreePath, "utf8");
assert(
  routeTreeCode.includes("/watch/$slug"),
  "LỖI: routeTree.gen.ts chưa đăng ký route /watch/$slug",
);
console.log("   ✓ Route /watch/$slug tồn tại, đăng ký chuẩn trong routeTree và TanStack Router.");

// 2. Kiểm tra real-data wiring
console.log("2. Kiểm tra Real-Data Wiring (useQuery, API thật, lưu trữ tiến độ/bình luận)...");
assert(watchRouteCode.includes("fetchDetail"), "LỖI: watch.$slug.tsx phải gọi fetchDetail");
assert(watchRouteCode.includes("fetchLatest"), "LỖI: watch.$slug.tsx phải gọi fetchLatest");
assert(watchRouteCode.includes("useQuery"), "LỖI: Phải dùng useQuery của TanStack Query");
assert(watchRouteCode.includes("lv-progress"), "LỖI: Phải lưu tiến độ xem thật vào lv-progress");
assert(
  watchRouteCode.includes("lv-favorites"),
  "LỖI: Phải đồng bộ danh sách yêu thích vào lv-favorites",
);
assert(
  !watchRouteCode.includes("position: 60") && !watchRouteCode.includes("duration: 2700"),
  "LỖI: Cấm ghi đè cứng tiến độ position:60, duration:2700!",
);
assert(
  watchRouteCode.includes("handleTimeProgress"),
  "LỖI: watch.$slug.tsx phải nhận callback handleTimeProgress",
);

const controlsPathCheck = join(projectRoot, "src/components/player/PlayerControls.tsx");
assert(existsSync(controlsPathCheck), "LỖI: Thiếu PlayerControls.tsx");
const controlsCodeCheck = readFileSync(controlsPathCheck, "utf8");
assert(
  controlsCodeCheck.includes("handleLoadedMetadata"),
  "LỖI: PlayerControls phải khôi phục vị trí lưu qua handleLoadedMetadata",
);
assert(
  controlsCodeCheck.includes("onTimeProgress"),
  "LỖI: PlayerControls phải gửi callback onTimeProgress về route",
);

const panelsPath = join(projectRoot, "src/components/player/PlayerPanels.tsx");
assert(existsSync(panelsPath), "LỖI: Thiếu PlayerPanels.tsx");
const panelsCode = readFileSync(panelsPath, "utf8");
assert(
  panelsCode.includes("mochi-comments-"),
  "LỖI: Phải lưu bình luận thật theo từng phim trong localStorage",
);
console.log(
  "   ✓ Real-data wiring hoàn chỉnh: API thật, TanStack Query, HTMLVideoElement telemetry, localStorage progress/favorites/comments.",
);

// 3. Kiểm tra các React hook & WAI-ARIA labels chính
console.log("3. Kiểm tra các Hook và WAI-ARIA labels chính...");
assert(watchRouteCode.includes("useState"), "LỖI: Thiếu useState trong watch.$slug.tsx");
assert(watchRouteCode.includes("useEffect"), "LỖI: Thiếu useEffect trong watch.$slug.tsx");
assert(watchRouteCode.includes("useNavigate"), "LỖI: Thiếu useNavigate trong watch.$slug.tsx");

const topbarPath = join(projectRoot, "src/components/player/PlayerTopbar.tsx");
assert(existsSync(topbarPath), "LỖI: Thiếu PlayerTopbar.tsx");
const topbarCode = readFileSync(topbarPath, "utf8");
assert(
  topbarCode.includes('aria-label="Tìm kiếm"'),
  "LỖI: Topbar thiếu aria-label cho ô/nút tìm kiếm",
);
assert(topbarCode.includes('aria-label="Thông báo"'), "LỖI: Topbar thiếu aria-label cho thông báo");
assert(
  !topbarCode.includes('aria-label="Đổi nguồn phim"'),
  "LỖI: Topbar không được có nút đổi nguồn",
);

const controlsPath = join(projectRoot, "src/components/player/PlayerControls.tsx");
assert(existsSync(controlsPath), "LỖI: Thiếu PlayerControls.tsx");
const controlsCode = readFileSync(controlsPath, "utf8");
const controlsChromeCode = readFileSync(
  join(projectRoot, "src/components/player/PlayerControlsChrome.tsx"),
  "utf8",
);
const controlsUiCode = `${controlsCode}\n${controlsChromeCode}`;
assert(
  controlsUiCode.includes('aria-label="Phát"') ||
    controlsUiCode.includes('aria-label={isPlaying ? "Tạm dừng" : "Phát"}'),
  "LỖI: PlayerControls thiếu aria-label phát/tạm dừng",
);
assert(
  controlsUiCode.includes('aria-label="Thanh âm lượng"'),
  "LỖI: PlayerControls thiếu aria-label cho thanh âm lượng",
);
assert(
  controlsUiCode.includes('aria-label="Tốc độ phát"'),
  "LỖI: PlayerControls thiếu aria-label cho tốc độ phát",
);
assert(
  controlsUiCode.includes('aria-label="Toàn màn hình"'),
  "LỖI: PlayerControls thiếu aria-label toàn màn hình",
);
assert(
  controlsUiCode.includes('aria-label="Chế độ rạp"'),
  "LỖI: PlayerControls thiếu aria-label chế độ rạp",
);
assert(
  controlsCode.includes('aria-label="Báo lỗi nguồn phát"'),
  "LỖI: PlayerControls thiếu aria-label báo lỗi",
);

assert(
  panelsCode.includes('aria-label="Nội dung bình luận"'),
  "LỖI: PlayerPanels thiếu aria-label cho ô bình luận",
);
assert(
  panelsCode.includes('aria-label="Đăng bình luận"'),
  "LỖI: PlayerPanels thiếu aria-label cho nút đăng bình luận",
);
console.log("   ✓ Đầy đủ các hook lifecycle và toàn bộ WAI-ARIA labels trợ năng chính.");

const rightbarCode = readFileSync(
  join(projectRoot, "src/components/player/PlayerRightbar.tsx"),
  "utf8",
);
const playerTopbarCode = readFileSync(
  join(projectRoot, "src/components/player/PlayerTopbar.tsx"),
  "utf8",
);
for (const [name, source] of [
  ["route", watchRouteCode],
  ["rightbar", rightbarCode],
  ["topbar", playerTopbarCode],
]) {
  for (const removedSourceUi of [
    "sourceList",
    "apiCode",
    "source-pill",
    "Nguồn phát",
    "API player đang dùng",
    "onSelectSource",
    "onOpenSourceList",
  ]) {
    assert(
      !source.includes(removedSourceUi),
      `LỖI: ${name} không được còn UI nguồn phát: ${removedSourceUi}`,
    );
  }
}

// 4. Cấm fallback demo/mock và số tiến độ dựng sẵn
console.log("4. Kiểm tra fallback demo/mock và tiến độ cứng...");
const checkedFiles = [
  "src/routes/watch.$slug.tsx",
  "src/components/player/PlayerSidebar.tsx",
  "src/components/player/PlayerTopbar.tsx",
  "src/components/player/PlayerControls.tsx",
  "src/components/player/PlayerRightbar.tsx",
  "src/components/player/PlayerPanels.tsx",
  "src/components/player/PlayerMobileNav.tsx",
];
const checkedSource = checkedFiles
  .map((relPath) => {
    const filePath = join(projectRoot, relPath);
    assert(existsSync(filePath), `LỖI: Thiếu file ${relPath}`);
    return `// ${relPath}\n${readFileSync(filePath, "utf8")}`;
  })
  .join("\n");

const forbiddenMockPatterns = [
  /Khi Trái Đất đối mặt với nguy cơ diệt vong/i,
  /Đây là demo giao diện phát phim/i,
  /MinhKhoa|HoangNam|Phim xem nét dã man|Tập này đoạn cao trào cuốn quá/i,
  /Interstellar/i,
  /pravatar\.cc|picsum\.photos|images\.unsplash\.com/i,
  /w3schools|mov_bbb|sample-videos|test-videos|commondatastorage\.googleapis\.com\/gtv-videos-bucket\/sample/i,
];
const hardProgressPatterns = [
  /\bposition\s*:\s*(?!0(?:\D|$))\d+(?:\.\d+)?\b/,
  /\bduration\s*:\s*(?!0(?:\D|$))\d+(?:\.\d+)?\b/,
  /\.currentTime\s*=\s*\d+(?:\.\d+)?\b/,
];
const assertCleanPlayerSource = (source) => {
  for (const pattern of [...forbiddenMockPatterns, ...hardProgressPatterns]) {
    assert(!pattern.test(source), `LỖI: Player chứa fallback mock hoặc tiến độ cứng: ${pattern}`);
  }
};
assertCleanPlayerSource(checkedSource);
assert.throws(
  () => assertCleanPlayerSource('const src = "https://www.w3schools.com/html/mov_bbb.mp4"'),
  /fallback mock hoặc tiến độ cứng/,
  "LỖI CONTRACT: Bộ kiểm tra phải bắt được fallback mock",
);
assert.throws(
  () => assertCleanPlayerSource("map[key] = { position: 60, duration: 2700 }"),
  /fallback mock hoặc tiến độ cứng/,
  "LỖI CONTRACT: Bộ kiểm tra phải bắt được số tiến độ cứng",
);
console.log(
  "   ✓ Không có fallback demo/mock hoặc số tiến độ dựng sẵn; contract tự chứng minh bắt được regression.",
);

// 5. Tiến độ phải đến từ HTMLVideoElement thật
console.log("5. Kiểm tra telemetry tiến độ thật từ HTMLVideoElement...");
for (const token of [
  "onTimeUpdate={handleTimeUpdate}",
  "video.currentTime",
  "video.duration",
  "onTimeProgress?.(cur, dur)",
  "handleLoadedMetadata",
  "initialPosition",
]) {
  assert(controlsCode.includes(token), `LỖI: Thiếu wiring tiến độ thật: ${token}`);
}
assert(
  watchRouteCode.includes("onTimeProgress={handleTimeProgress}"),
  "LỖI: Route chưa nhận telemetry thật từ player",
);
assert(
  watchRouteCode.includes("persistProgress(currSec, totalSec)"),
  "LỖI: Route chưa lưu currentTime/duration thật",
);
console.log("   ✓ currentTime/duration thật được khôi phục, truyền callback và lưu có throttle.");

// 6. HLS phải có wiring hls.js, native HLS và cleanup
console.log("6. Kiểm tra wiring HLS, native HLS và cleanup...");
for (const token of [
  'import Hls from "hls.js"',
  "resolveStreamSource",
  "isHlsUrl",
  "isDirectVideoUrl",
  "Hls.isSupported()",
  "new Hls(",
  "hls.loadSource(activePlayUrl)",
  "hls.attachMedia(video)",
  'video.canPlayType("application/vnd.apple.mpegurl")',
  "hlsRef.current.destroy()",
]) {
  assert(controlsCode.includes(token), `LỖI: Thiếu wiring HLS: ${token}`);
}
assert(
  !controlsCode.includes('!activeStreamUrl.includes(".m3u8") ? activeStreamUrl : null'),
  "LỖI: Cấm coi mọi URL không chứa .m3u8 là iframe",
);
assert(
  !/isEmbed\s*=\s*Boolean\(\s*activeStreamUrl\s*\)/.test(controlsCode),
  "LỖI: Cấm coi mọi URL HTTP là iframe",
);

const isHls = (url) => /\.m3u8($|\?|#)/i.test(url);
const isDirectVideo = (url) => /\.(mp4|webm|mkv|mov|m4v|ogv)($|\?|#)/i.test(url);
assert(isHls("https://cdn.example.com/stream.m3u8?token=123"), "LỖI: URL .m3u8 phải là HLS");
assert(
  isDirectVideo("https://cdn.example.com/video.mp4?token=123"),
  "LỖI: URL .mp4 phải là video trực tiếp",
);
assert(!isDirectVideo("https://cdn.example.com/stream.m3u8"), "LỖI: .m3u8 không được nhận là MP4");
console.log(
  "   ✓ HLS dùng hls.js/native HLS, video trực tiếp dùng <video>, iframe chỉ dành cho embed thật.",
);

console.log("\n==========================================================");
console.log("🎉 TẤT CẢ CÁC KIỂM TRA HỢP ĐỒNG TRANG PLAYER ĐỀU PASS!");
console.log("==========================================================");
