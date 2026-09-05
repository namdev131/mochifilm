import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert";

console.log("-> Đang kiểm tra hợp đồng Trang Chi Tiết Phim (Movie Detail Contract)...");

const projectRoot = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// 1. Kiểm tra route /movie/$slug
console.log("1. Kiểm tra tồn tại và định nghĩa route /movie/$slug...");
const routePath = join(projectRoot, "src/routes/movie.$slug.tsx");
assert(existsSync(routePath), "LỖI: Thiếu file route src/routes/movie.$slug.tsx");
const routeCode = readFileSync(routePath, "utf8");
assert(routeCode.includes('createFileRoute("/movie/$slug")'), "LỖI: Route phải đăng ký createFileRoute('/movie/$slug')");
assert(routeCode.includes("validateSearch"), "LỖI: Route phải có validateSearch để kiểm tra source param");
assert(routeCode.includes("Route.useParams()"), "LỖI: Route phải đọc slug qua Route.useParams()");
assert(routeCode.includes("Route.useSearch()"), "LỖI: Route phải đọc source qua Route.useSearch()");
console.log("   ✓ Route /movie/$slug tồn tại và cấu hình chuẩn TanStack Router.");

// 2. Kiểm tra dữ liệu API thật (Không mock data)
console.log("2. Kiểm tra gọi API dữ liệu thật (fetchDetail, fetchLatest)...");
assert(routeCode.includes("fetchDetail"), "LỖI: Phải gọi fetchDetail để lấy thông tin phim từ máy chủ nguồn");
assert(routeCode.includes("fetchLatest"), "LỖI: Phải gọi fetchLatest để lấy danh sách phim đề xuất từ nguồn");
assert(routeCode.includes("useQuery"), "LỖI: Phải dùng TanStack Query để quản lý caching và lifecycle");
console.log("   ✓ Gọi dữ liệu thật 100% từ API, không mock data.");

// 3. Kiểm tra điều hướng từ Trang chủ sang /movie/$slug
console.log("3. Kiểm tra điều hướng từ trang chủ sang /movie/$slug khi nhấn poster/card...");
const homeCode = readFileSync(join(projectRoot, "src/routes/index.tsx"), "utf8");
assert(homeCode.includes('to: "/movie/$slug"'), "LỖI: Trang chủ phải có điều hướng to: '/movie/$slug'");
assert(homeCode.includes("openMovieDetail"), "LỖI: Trang chủ phải có hàm openMovieDetail chuẩn hóa điều hướng");
assert(!homeCode.includes('spkỳ phim'), "LỖI: Vẫn còn vết prompt lỗi trong index.tsx");
console.log("   ✓ Thao tác nhấn poster/card trên trang chủ điều hướng trực tiếp sang route chi tiết.");

// 4. Kiểm tra các component giao diện chi tiết đã được tách riêng
console.log("4. Kiểm tra các component chi tiết được tách module riêng biệt...");
const componentFiles = [
  "src/components/movie-detail/DetailSidebar.tsx",
  "src/components/movie-detail/DetailTopbar.tsx",
  "src/components/movie-detail/DetailHero.tsx",
  "src/components/movie-detail/DetailTabs.tsx",
  "src/components/movie-detail/DetailContent.tsx",
  "src/components/movie-detail/DetailCast.tsx",
  "src/components/movie-detail/DetailComments.tsx",
  "src/components/movie-detail/DetailRecommendations.tsx",
  "src/components/movie-detail/DetailMobileNav.tsx",
];

for (const comp of componentFiles) {
  assert(existsSync(join(projectRoot, comp)), `LỖI: Thiếu component ${comp}`);
}
console.log("   ✓ Đầy đủ các component chi tiết đang sử dụng.");

// 5. Kiểm tra bám sát bố cục & thiết kế details.html
console.log("5. Kiểm tra thiết kế bám sát file tham chiếu details.html...");
const heroCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailHero.tsx"), "utf8");
assert(heroCode.includes('id="watchNow"'), "LỖI: Hero thiếu nút Xem ngay #watchNow");
assert(heroCode.includes('to="/watch/$slug"') || heroCode.includes("onWatchNow"), "LỖI: Hero nút Xem ngay phải điều hướng tới /watch/$slug");
assert(routeCode.includes('to: "/watch/$slug"') && routeCode.includes("navigate"), "LỖI: movie.$slug.tsx phải có hàm điều hướng navigate tới /watch/$slug với source/ep/srv");
assert(heroCode.includes('id="watchTrailer"'), "LỖI: Hero thiếu nút Xem trailer #watchTrailer");
assert(heroCode.includes('id="favoriteBtn"'), "LỖI: Hero thiếu nút Yêu thích #favoriteBtn");
assert(heroCode.includes('id="partyBtn"'), "LỖI: Hero thiếu nút Watch Party #partyBtn");
assert(heroCode.includes("mascot-balloon.webp"), "LỖI: Hero thiếu Mascot bóng bay");

const sidebarCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailSidebar.tsx"), "utf8");
assert(sidebarCode.includes("wordmark.webp"), "LỖI: Sidebar thiếu logo wordmark");
assert(sidebarCode.includes("mascot-chair.webp"), "LỖI: Sidebar thiếu mascot ghế");
assert(sidebarCode.includes("Mochi Premium"), "LỖI: Sidebar thiếu thẻ Mochi Premium");

assert(!routeCode.includes("DetailSourcePanel"), "LỖI: Trang chi tiết không được render bảng Nguồn phát bên phải");
assert(!routeCode.includes("handleOpenSourcePanel"), "LỖI: Không được giữ handler mở bảng Nguồn phát đã bỏ");
const topbarCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailTopbar.tsx"), "utf8");
assert(!topbarCode.includes("source-pill"), "LỖI: Không được giữ nút mở bảng Nguồn phát trên header/mobile");
assert(!topbarCode.includes("Đổi nguồn phim"), "LỖI: Không được giữ điều khiển Nguồn phát đã bỏ");
assert(!topbarCode.includes("onOpenSourcePanel"), "LỖI: Không được giữ callback panel Nguồn phát đã bỏ");

const mobileNavCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailMobileNav.tsx"), "utf8");
assert(mobileNavCode.includes("mobile-nav"), "LỖI: Thiếu thanh điều hướng mobile-nav dưới đáy");

const cssCode = readFileSync(join(projectRoot, "src/styles/details.css"), "utf8");
assert(cssCode.includes(".details-root"), "LỖI: Thiếu class bao bọc .details-root trong styles/details.css");
assert(cssCode.includes("--sidebar"), "LỖI: Thiếu biến layout --sidebar");
assert(!cssCode.includes("--source"), "LỖI: Không được giữ khoảng trống layout cho bảng Nguồn phát đã bỏ");
assert(cssCode.includes(".details-root .mascot-balloon"), "LỖI: Thiếu rule tỉ lệ cho mascot bóng bay");
assert(cssCode.includes("object-fit: contain"), "LỖI: Mascot phải giữ đúng tỉ lệ ảnh bằng object-fit: contain");
assert(cssCode.includes("@media (max-width: 860px)"), "LỖI: Thiếu responsive breakpoint mobile <= 860px");
console.log("   ✓ Bố cục toàn chiều rộng, mascot đúng tỉ lệ, tab và mobile nav khớp thiết kế.");

// 6. Kiểm tra phát tập và lưu tiến độ thật (Không mock)
console.log("6. Kiểm tra chọn tập phim, phát trực tiếp và đồng bộ tiến độ...");
const contentCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailContent.tsx"), "utf8");
assert(contentCode.includes("player-wrap"), "LỖI: Thiếu khung player phát video");
assert(contentCode.includes("episodesPanel") || contentCode.includes("ep-btn"), "LỖI: Thiếu danh sách tập phim");
assert(routeCode.includes("lv-progress"), "LỖI: Chưa đồng bộ lịch sử xem thật vào lv-progress");
assert(routeCode.includes("lv-favorites"), "LỖI: Chưa đồng bộ yêu thích thật vào lv-favorites");
console.log("   ✓ Chọn tập, phát luồng trực tiếp và lưu tiến độ thật vào localStorage.");

// 7. Kiểm tra không để lại file scratch tạm trong repo
console.log("7. Kiểm tra sự sạch sẽ của repo, không để lại file scratch...");
assert(!existsSync(join(projectRoot, "reference_details.html")), "LỖI: Vẫn còn file tạm reference_details.html trong repo");
assert(!existsSync(join(projectRoot, "scratch_details_clean.html")), "LỖI: Vẫn còn file tạm scratch_details_clean.html trong repo");
assert(!existsSync(join(projectRoot, "scripts/clean_ref.mjs")), "LỖI: Vẫn còn file tạm clean_ref.mjs trong repo");
console.log("   ✓ Workspace sạch sẽ, không có file tạm.");

// 8. Kiểm tra triệt để Zero Mock Data trong các component chi tiết
console.log("8. Kiểm tra triệt để không có mock data hay fallback giả trong component chi tiết...");
const castCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailCast.tsx"), "utf8");
assert(!castCode.includes("Matthew McConaughey"), "LỖI: Vẫn còn mock actor Matthew McConaughey trong DetailCast.tsx");
assert(!castCode.includes("Anne Hathaway"), "LỖI: Vẫn còn mock actor Anne Hathaway trong DetailCast.tsx");
assert(!castCode.includes("defaultCast"), "LỖI: Vẫn còn defaultCast trong DetailCast.tsx");
assert(!castCode.includes("pravatar.cc"), "LỖI: Vẫn còn pravatar giả lập trong DetailCast.tsx");

const commentsCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailComments.tsx"), "utf8");
assert(!commentsCode.includes("MinhKhoa"), "LỖI: Vẫn còn mock comment MinhKhoa trong DetailComments.tsx");
assert(!commentsCode.includes("HoangNam"), "LỖI: Vẫn còn mock comment HoangNam trong DetailComments.tsx");
assert(!commentsCode.includes("pravatar.cc"), "LỖI: Vẫn còn pravatar giả lập trong DetailComments.tsx");

const recsCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailRecommendations.tsx"), "utf8");
assert(!recsCode.includes("defaultRecs"), "LỖI: Vẫn còn defaultRecs trong DetailRecommendations.tsx");
assert(!recsCode.includes("Inception"), "LỖI: Vẫn còn mock Inception trong DetailRecommendations.tsx");
assert(!recsCode.includes("unsplash.com"), "LỖI: Vẫn còn ảnh mock Unsplash trong DetailRecommendations.tsx");
assert(!recsCode.includes(': "8.5"'), "LỖI: Vẫn còn bịa rating fallback '8.5' trong DetailRecommendations.tsx");

assert(!heroCode.includes('rating = "8.8"'), "LỖI: Vẫn còn bịa rating '8.8' trong DetailHero.tsx");
console.log("   ✓ Không có bất kỳ mock data, diễn viên giả, bình luận giả hay rating bịa nào.");

// 9. Kiểm tra rule bền vững trong hướng dẫn dự án
console.log("9. Kiểm tra rule bền vững Zero Mock Data trong hướng dẫn dự án (.agents/rules)...");
const rulePath = join(projectRoot, ".agents/rules/no-mock-data.md");
assert(existsSync(rulePath), "LỖI: Thiếu file quy tắc .agents/rules/no-mock-data.md");
const ruleContent = readFileSync(rulePath, "utf8");
assert(ruleContent.includes("Zero Mock Data Policy") || ruleContent.includes("không sử dụng mock data"), "LỖI: Nội dung rule chưa nêu rõ chính sách không mock data");
console.log("   ✓ Rule bền vững đã được lưu vào .agents/rules/no-mock-data.md.");

console.log("\n=================================================");
console.log("🎉 TẤT CẢ CÁC KIỂM TRA HỢP ĐỒNG CHI TIẾT PHIM ĐỀU PASS!");
console.log("=================================================");
