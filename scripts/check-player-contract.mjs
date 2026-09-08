import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert";

console.log("-> Đang kiểm tra hợp đồng Trang Video Player Mochi Film (Player Contract)...");

const projectRoot = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// 1. Kiểm tra tồn tại và định nghĩa route /watch/$slug
console.log("1. Kiểm tra route /watch/$slug...");
const routePath = join(projectRoot, "src/routes/watch.$slug.tsx");
assert(existsSync(routePath), "LỖI: Thiếu file route src/routes/watch.$slug.tsx");
const routeCode = readFileSync(routePath, "utf8");
assert(
  routeCode.includes('createFileRoute("/watch/$slug")'),
  "LỖI: Route phải đăng ký createFileRoute('/watch/$slug')",
);
assert(routeCode.includes("validateSearch"), "LỖI: Route phải có validateSearch");
assert(routeCode.includes("Route.useParams()"), "LỖI: Route phải đọc slug qua Route.useParams()");
assert(routeCode.includes("Route.useSearch()"), "LỖI: Route phải đọc query qua Route.useSearch()");
console.log("   ✓ Route /watch/$slug tồn tại và cấu hình chuẩn TanStack Router.");

// 2. Kiểm tra gọi API dữ liệu thật (Không mock data)
console.log("2. Kiểm tra nạp dữ liệu thật từ API (fetchDetail, fetchLatest)...");
assert(routeCode.includes("fetchDetail"), "LỖI: Phải gọi fetchDetail để lấy thông tin phim");
assert(routeCode.includes("fetchLatest"), "LỖI: Phải gọi fetchLatest để lấy phim gợi ý");
assert(routeCode.includes("useQuery"), "LỖI: Phải dùng TanStack Query");
console.log("   ✓ Sử dụng API dữ liệu thật 100%, không mock data.");

// 3. Kiểm tra các component giao diện player
console.log("3. Kiểm tra các component player module hóa...");
const playerComponents = [
  "src/components/player/PlayerSidebar.tsx",
  "src/components/player/PlayerTopbar.tsx",
  "src/components/player/PlayerRightbar.tsx",
  "src/components/player/PlayerControls.tsx",
  "src/components/player/PlayerControlsChrome.tsx",
  "src/components/player/PlayerProgress.tsx",
  "src/components/player/PlayerSettingsMenu.tsx",
  "src/components/player/PlayerPanels.tsx",
  "src/components/player/PlayerMobileNav.tsx",
];

for (const comp of playerComponents) {
  assert(existsSync(join(projectRoot, comp)), `LỖI: Thiếu component ${comp}`);
}
console.log("   ✓ Đầy đủ các component player trong src/components/player/.");

// 4. Kiểm tra đầy đủ các ID theo file tham chiếu doc_fcd3e4bd1b50_player.html
console.log("4. Kiểm tra toàn bộ ID và cấu trúc chuẩn tham chiếu HTML...");
const allPlayerCode = [
  routeCode,
  ...playerComponents.map((c) => readFileSync(join(projectRoot, c), "utf8")),
].join("\n");

const requiredIds = [
  "searchInput",
  "player",
  "video",
  "videoSource",
  "reportBtn",
  "centerPlay",
  "progressWrap",
  "progressPlayed",
  "progressKnob",
  "playBtn",
  "muteBtn",
  "volumeRange",
  "currentTime",
  "duration",
  "subtitleBtn",
  "speedSelect",
  "theaterBtn",
  "fullscreenBtn",
  "favoriteBtn",
  "lightsBtn",
  "partyBtn",
  "commentInput",
  "commentBtn",
  "commentList",
  "movieRow",
  "joinPartyBtn",
  "toast",
];

for (const id of requiredIds) {
  assert(
    allPlayerCode.includes(`id="${id}"`) || allPlayerCode.includes(`id='${id}'`),
    `LỖI: Thiếu id="${id}" theo file tham chiếu HTML`,
  );
}
console.log(`   ✓ Đầy đủ toàn bộ ${requiredIds.length} ID chuẩn tham chiếu HTML.`);

for (const removedSourceUi of [
  "sourceList",
  "apiCode",
  "source-pill",
  "Nguồn phát",
  "API player đang dùng",
]) {
  assert(
    !allPlayerCode.includes(removedSourceUi),
    `LỖI: Video player không được còn UI nguồn phát: ${removedSourceUi}`,
  );
}

// 5. Kiểm tra Zero Mock Data tuyệt đối
console.log(
  "5. Kiểm tra tuyệt đối không dùng mock data, pravatar, picsum, unsplash hay mock video w3schools/mov_bbb...",
);
assert(!allPlayerCode.includes("pravatar.cc"), "LỖI: Phát hiện pravatar.cc trong player");
assert(!allPlayerCode.includes("picsum.photos"), "LỖI: Phát hiện picsum.photos trong player");
assert(!allPlayerCode.includes("images.unsplash.com"), "LỖI: Phát hiện unsplash trong player");
assert(!allPlayerCode.includes("MinhKhoa"), "LỖI: Phát hiện bình luận mẫu MinhKhoa trong player");
assert(!allPlayerCode.includes("HoangNam"), "LỖI: Phát hiện bình luận mẫu HoangNam trong player");
assert(
  !allPlayerCode.includes("w3schools"),
  "LỖI: Tuyệt đối cấm fallback mock w3schools trong player",
);
assert(
  !allPlayerCode.includes("mov_bbb"),
  "LỖI: Tuyệt đối cấm fallback video mock mov_bbb trong player",
);
console.log(
  "   ✓ Tuyệt đối sạch mock data, không dùng ảnh giả lập, bình luận giả hay fallback video mock.",
);

// 6. Kiểm tra lưu tiến độ & yêu thích thật vào localStorage
console.log("6. Kiểm tra đồng bộ tiến độ và yêu thích thực tế...");
assert(routeCode.includes("lv-progress"), "LỖI: Player phải lưu tiến độ xem vào lv-progress");
assert(
  routeCode.includes("lv-favorites"),
  "LỖI: Player phải lưu trạng thái yêu thích vào lv-favorites",
);
assert(allPlayerCode.includes("mochi-comments"), "LỖI: Bình luận phải lưu thật theo movie slug");
console.log("   ✓ Đồng bộ tiến độ, yêu thích và bình luận thật qua localStorage.");

// 7. Kiểm tra Stylesheet riêng biệt src/styles/player.css
console.log("7. Kiểm tra Stylesheet player chuẩn thiết kế...");
const playerCssPath = join(projectRoot, "src/styles/player.css");
assert(existsSync(playerCssPath), "LỖI: Thiếu file src/styles/player.css");
const controlsCssPath = join(projectRoot, "src/styles/player-controls.css");
assert(existsSync(controlsCssPath), "LỖI: Thiếu file src/styles/player-controls.css");
const cssContent = `${readFileSync(playerCssPath, "utf8")}\n${readFileSync(controlsCssPath, "utf8")}`;
assert(cssContent.includes(".player-page-root"), "LỖI: Thiếu root class .player-page-root");
assert(cssContent.includes(".player-shell"), "LỖI: Thiếu class .player-shell");
assert(cssContent.includes(".progress-wrap"), "LỖI: Thiếu class .progress-wrap");
assert(cssContent.includes(".movie-bar"), "LỖI: Thiếu class .movie-bar");
assert(cssContent.includes(".rightbar"), "LỖI: Thiếu class .rightbar");
for (const token of [
  "skipBackBtn",
  "skipForwardBtn",
  "Settings",
  "Captions",
  "Maximize",
  "player-primary-control",
  "player-quality-badge",
]) {
  assert(
    allPlayerCode.includes(token) || cssContent.includes(token),
    `LỖI: Thiếu control Mochi theo ảnh: ${token}`,
  );
}
assert(cssContent.includes("@media (max-width: 520px)"), "LỖI: Thiếu responsive mobile cho player");
console.log(
  "   ✓ Stylesheet và bộ nút Mochi đầy đủ, tương thích responsive desktop/tablet/mobile.",
);

console.log("\n=================================================");
console.log("🎉 TẤT CẢ CÁC KIỂM TRA HỢP ĐỒNG VIDEO PLAYER ĐỀU PASS!");
console.log("=================================================");
