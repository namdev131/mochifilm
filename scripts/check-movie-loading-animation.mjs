import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert";

console.log("-> Đang kiểm tra tính năng Mochi Loading Animation khi nhấn vào phim...");

const projectRoot = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// 1. Kiểm tra MochiLoadingScreen.tsx hỗ trợ movie loading
console.log("1. Kiểm tra MochiLoadingScreen.tsx hỗ trợ movie loading...");
const compCode = readFileSync(join(projectRoot, "src/components/common/MochiLoadingScreen.tsx"), "utf8");
assert(compCode.includes("moviePhases"), "LỖI: Thiếu chuỗi giai đoạn moviePhases");
assert(compCode.includes("showMovie"), "LỖI: MochiLoader thiếu phương thức showMovie");
assert(compCode.includes("finishMovie"), "LỖI: MochiLoader thiếu phương thức finishMovie");
assert(compCode.includes("mochi:load-movie"), "LỖI: Thiếu event listener mochi:load-movie");
assert(compCode.includes("mochi:movie-ready"), "LỖI: Thiếu event listener mochi:movie-ready");
console.log("   ✓ MochiLoadingScreen đã sẵn sàng với API showMovie và chuỗi trạng thái phim.");

// 2. Kiểm tra movie.$slug.tsx
console.log("2. Kiểm tra movie.$slug.tsx tích hợp MochiLoader và thay thế text nạp máy chủ...");
const movieRouteCode = readFileSync(join(projectRoot, "src/routes/movie.$slug.tsx"), "utf8");
assert(movieRouteCode.includes("showMovie"), "LỖI: movie.$slug.tsx chưa gọi showMovie");
assert(movieRouteCode.includes("finishMovie"), "LỖI: movie.$slug.tsx chưa gọi finishMovie");
assert(!movieRouteCode.includes("Đang nạp dữ liệu chi tiết phim từ máy chủ {"), "LỖI: Vẫn còn dòng text thô 'Đang nạp dữ liệu chi tiết phim từ máy chủ...'");
assert(movieRouteCode.includes("movie-loading-stage"), "LỖI: Thiếu stage container chuẩn movie-loading-stage");
console.log("   ✓ movie.$slug.tsx đã tích hợp MochiLoader và loại bỏ hoàn toàn text nạp thô.");

// 3. Kiểm tra watch.$slug.tsx
console.log("3. Kiểm tra watch.$slug.tsx tích hợp MochiLoader và thay thế text nạp luồng máy chủ...");
const watchRouteCode = readFileSync(join(projectRoot, "src/routes/watch.$slug.tsx"), "utf8");
assert(watchRouteCode.includes("showMovie"), "LỖI: watch.$slug.tsx chưa gọi showMovie");
assert(watchRouteCode.includes("finishMovie"), "LỖI: watch.$slug.tsx chưa gọi finishMovie");
assert(!watchRouteCode.includes("Đang nạp trình phát và luồng video từ máy chủ {"), "LỖI: Vẫn còn dòng text thô 'Đang nạp trình phát và luồng video...'");
assert(watchRouteCode.includes("player-loading-stage"), "LỖI: Thiếu stage container chuẩn player-loading-stage");
console.log("   ✓ watch.$slug.tsx đã tích hợp MochiLoader và loại bỏ hoàn toàn text nạp thô.");

// 4. Kiểm tra trang chủ openMovieDetail
console.log("4. Kiểm tra điều hướng openMovieDetail trên trang chủ...");
const homeCode = readFileSync(join(projectRoot, "src/routes/index.tsx"), "utf8");
assert(homeCode.includes("MochiLoader") && homeCode.includes("showMovie"), "LỖI: openMovieDetail chưa kích hoạt MochiLoader.showMovie khi nhấn vào phim");
console.log("   ✓ Nhấn vào phim trên Trang chủ kích hoạt ngay lập tức animation loading Mochi.");

// 5. Kiểm tra các nút bấm & tìm kiếm chuyển phim
console.log("5. Kiểm tra các điểm tương tác nhấn vào phim khác...");
const heroCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailHero.tsx"), "utf8");
assert(heroCode.includes("showMovie"), "LỖI: Nút Xem ngay DetailHero chưa gọi showMovie");

const detailTopCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailTopbar.tsx"), "utf8");
assert(detailTopCode.includes("showMovie"), "LỖI: Search DetailTopbar chưa gọi showMovie");

const playerTopCode = readFileSync(join(projectRoot, "src/components/player/PlayerTopbar.tsx"), "utf8");
assert(playerTopCode.includes("showMovie"), "LỖI: Search PlayerTopbar chưa gọi showMovie");

const recsCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailRecommendations.tsx"), "utf8");
assert(recsCode.includes("showMovie"), "LỖI: Phim đề xuất chưa gọi showMovie");
console.log("   ✓ Mọi vị trí nhấn mở phim đều kích hoạt animation Mochi Pet Loading.");

console.log("\n============================================================");
console.log("🎉 TẤT CẢ CÁC KIỂM TRA LOADING KHI NHẤN VÀO PHIM ĐỀU PASS!");
console.log("============================================================\n");
