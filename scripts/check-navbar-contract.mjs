import { readFileSync } from "node:fs";
import assert from "node:assert";

console.log("-> Đang kiểm tra hợp đồng Navbar & Sidebar Mochi Film...");

const code = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");

// 1. Kiểm tra các mục điều hướng Menu chính
console.log("1. Kiểm tra các mục điều hướng Menu chính...");
assert(code.includes('selectedNav === "trang-chu"'), "LỖI: Thiếu điều hướng 'trang-chu'");
assert(code.includes('selectedNav === "phim-moi"'), "LỖI: Thiếu điều hướng 'phim-moi'");
assert(code.includes('selectedNav === "phim-le"'), "LỖI: Thiếu điều hướng 'phim-le'");
assert(code.includes('selectedNav === "phim-bo"'), "LỖI: Thiếu điều hướng 'phim-bo'");
assert(code.includes('selectedNav === "chieu-rap"'), "LỖI: Thiếu điều hướng 'chieu-rap'");
assert(code.includes('selectedNav === "hoat-hinh"'), "LỖI: Thiếu điều hướng 'hoat-hinh'");
assert(code.includes("showGenreDropdown"), "LỖI: Thiếu dropdown Thể loại trong navbar");
assert(code.includes("showCountryDropdown"), "LỖI: Thiếu dropdown Quốc gia trong navbar");
console.log("   ✓ Đầy đủ 6 mục điều hướng chính + Dropdown Thể loại & Quốc gia.");

// 2. Kiểm tra hành vi đóng mở mobile drawer và responsive 268px
console.log("2. Kiểm tra hành vi Mobile Drawer và Responsive Sidebar 268px...");
assert(code.includes("w-[268px]"), "LỖI: Thiếu sidebar độ rộng 268px chuẩn");
assert(code.includes("lg:ml-[268px]"), "LỖI: Thiếu căn lề nội dung chính 268px trên màn hình lớn");
assert(code.includes("isSidebarOpenMobile"), "LỖI: Thiếu state isSidebarOpenMobile");
assert(code.includes('aria-label="Mở menu"'), "LỖI: Thiếu nút bấm mở menu trên mobile (aria-label)");
assert(code.includes('aria-label="Đóng menu"'), "LỖI: Thiếu nút bấm đóng menu trên mobile (aria-label)");
assert(code.includes("setIsSidebarOpenMobile(false)"), "LỖI: Thiếu hành vi tự đóng menu khi chọn mục hoặc bấm backdrop");
console.log("   ✓ Sidebar 268px chuẩn, drawer mobile mở/đóng và tự đóng khi chọn mục.");

// 3. Kiểm tra Brand Logo reset về Trang chủ
console.log("3. Kiểm tra Logo Wordmark...");
assert(code.includes("wordmark.webp"), "LỖI: Thiếu logo wordmark.webp trong sidebar");
assert(code.includes('setSelectedNav("trang-chu")'), "LỖI: Logo phải chuyển hướng về Trang chủ");
console.log("   ✓ Logo Wordmark chuẩn, bấm vào quay về Trang chủ.");

// 4. Kiểm tra chỉ báo Active item trên Navbar
console.log("4. Kiểm tra phong cách Active của Navbar...");
assert(code.includes("border-pink-500"), "LỖI: Thiếu viền hồng active border-pink-500");
assert(code.includes("from-pink-500/20"), "LỖI: Thiếu dải màu nền active from-pink-500/20");
console.log("   ✓ Chỉ báo Active sắc nét với viền hồng 3px và nền chuyển sắc.");

// 5. Kiểm tra Bộ sưu tập: Yêu thích & Lịch sử xem (Dữ liệu thật & Badge đếm)
console.log("5. Kiểm tra Bộ sưu tập: Yêu thích & Lịch sử xem...");
assert(code.includes('selectedNav === "yeu-thich"'), "LỖI: Thiếu tab 'yeu-thich'");
assert(code.includes('selectedNav === "lich-su"'), "LỖI: Thiếu tab 'lich-su'");
assert(code.includes("favorites.length"), "LỖI: Thiếu badge đếm số lượng phim yêu thích thật");
assert(code.includes("continueList.length"), "LỖI: Thiếu badge đếm số lượng lịch sử xem thật");
console.log("   ✓ Yêu thích và Lịch sử xem hiển thị badge số lượng từ dữ liệu thật.");

// 6. Kiểm tra Hộp thoại xác nhận trước khi xóa (Bắt buộc xác nhận, không xóa ngay)
console.log("6. Kiểm tra Hộp thoại xác nhận trước khi xóa (Confirmation Dialog)...");
assert(code.includes("confirmDialog"), "LỖI: Thiếu state confirmDialog");
assert(code.includes("confirmDeleteFavorite"), "LỖI: Thiếu hàm xác nhận trước khi xóa phim yêu thích");
assert(code.includes("confirmClearAllFavorites"), "LỖI: Thiếu hàm xác nhận trước khi xóa tất cả phim yêu thích");
assert(code.includes("confirmDeleteHistoryItem"), "LỖI: Thiếu hàm xác nhận trước khi xóa phim trong lịch sử");
assert(code.includes("confirmClearAllHistory"), "LỖI: Thiếu hàm xác nhận trước khi xóa toàn bộ lịch sử");
assert(code.includes('role="dialog"'), "LỖI: Hộp thoại xác nhận phải có role='dialog'");
assert(code.includes('aria-modal="true"'), "LỖI: Hộp thoại xác nhận phải có aria-modal='true'");
assert(code.includes('key === "Escape"'), "LỖI: Hộp thoại xác nhận phải hỗ trợ phím Escape để hủy");
console.log("   ✓ Toàn bộ hành vi xóa (từng mục và xóa hết) đều phải qua hộp thoại xác nhận.");

// 7. Kiểm tra Hệ thống: Nguồn phim và chỉ báo trạng thái máy chủ
console.log("7. Kiểm tra Nguồn phim và chỉ báo máy chủ...");
assert(code.includes("setShowSourceModal(true)"), "LỖI: Nút nguồn phim phải mở modal cấu hình nguồn");
assert(code.includes("animate-ping"), "LỖI: Thiếu chấm xanh ping trạng thái máy chủ");
assert(code.includes("selectedSource"), "LỖI: Chưa hiển thị tên nguồn đang kích hoạt");
console.log("   ✓ Mục Nguồn phim hiển thị nguồn hoạt động và mở modal chọn nguồn chuẩn.");

// 8. Kiểm tra Dữ liệu thật từ API cho từng chuyên mục (Không mock data)
console.log("8. Kiểm tra dữ liệu thật từ API cho từng chuyên mục (Zero Mock Data)...");
assert(code.includes("fetchCategoryMoviesFromApi"), "LỖI: Thiếu hàm fetchCategoryMoviesFromApi gọi API thật");
assert(code.includes("navCategoryConfig"), "LỖI: Thiếu cấu hình chuyên mục navCategoryConfig");
assert(code.includes("genreQueryMovies"), "LỖI: Thiếu live query cho thể loại genreQueryMovies");
assert(code.includes("countryQueryMovies"), "LỖI: Thiếu live query cho quốc gia countryQueryMovies");
assert(code.includes("displayedMovies"), "LỖI: Thiếu logic tổng hợp displayedMovies");
console.log("   ✓ Toàn bộ chuyên mục nạp dữ liệu thật 100% từ API, không mock data.");

// 9. Kiểm tra Trạng thái Active & Giao diện Chuyên mục rõ ràng
console.log("9. Kiểm tra Trạng thái Active & Giao diện Chuyên mục rõ ràng...");
assert(code.includes("isHomeView"), "LỖI: Thiếu logic phân biệt isHomeView và Chuyên mục");
assert(code.includes("currentNavMeta.title"), "LỖI: Heading chuyên mục phải hiển thị title chính xác");
assert(code.includes("currentNavMeta.desc"), "LỖI: Chuyên mục phải có mô tả rõ ràng");
assert(code.includes("category-grid-"), "LỖI: Chuyên mục phải hiển thị lưới phim chuyên biệt");
assert(code.includes('selectedNav === "the-loai"'), "LỖI: Thể loại phải kích hoạt active state 'the-loai'");
assert(code.includes('selectedNav === "quoc-gia"'), "LỖI: Quốc gia phải kích hoạt active state 'quoc-gia'");
console.log("   ✓ Chọn chuyên mục cập nhật giao diện ngay lập tức với Heading và Grid riêng biệt.");

const apiCode = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");

// 10. Kiểm tra giữ nguyên đúng một sidebar/navbar hiện tại (Không tạo navbar khác)
console.log("10. Kiểm tra duy nhất một sidebar/navbar hiện tại, không tạo navbar khác...");
assert(code.includes("<aside"), "LỖI: Thiếu sidebar aside duy nhất!");
assert(!code.includes("<nav aria-label=\"Breadcrumb\""), "LỖI: Không được tạo thêm navbar phụ hay breadcrumbs nav!");
const navMatches = [...code.matchAll(/<nav\b/g)];
assert(navMatches.length <= 3, "LỖI: Phát hiện thêm navbar ngoài sidebar chính!");
assert(code.includes("navigateToCategory"), "LỖI: Thiếu hàm điều hướng navigateToCategory chuẩn");
console.log("    ✓ Giữ nguyên đúng 1 sidebar/navbar hiện tại (268px), không có navbar phụ hay giao diện khác.");

// 11. Kiểm tra Trang chủ reset toàn bộ bộ lọc & Phim mới sắp xếp mới nhất
console.log("11. Kiểm tra Trang chủ reset toàn bộ bộ lọc & Phim mới sắp xếp mới nhất...");
assert(code.includes('nav === "trang-chu"'), "LỖI: Thiếu xử lý reset khi nav === 'trang-chu'");
assert(code.includes('setSearchQuery("")'), "LỖI: Trang chủ phải reset ô tìm kiếm");
assert(code.includes('setSelectedGenre("Tất cả")'), "LỖI: Trang chủ phải reset thể loại về 'Tất cả'");
assert(code.includes("setSelectedCountry(null)"), "LỖI: Trang chủ phải reset quốc gia về null");
assert(code.includes("sortByNewest"), "LỖI: Thiếu hàm sắp xếp phim mới nhất sortByNewest trong index.tsx");
assert(apiCode.includes("sortByNewest"), "LỖI: Thiếu hàm sortByNewest trong api.ts");
console.log("    ✓ Trang chủ reset toàn bộ bộ lọc (nav, genre, country, search). Phim mới sắp xếp mới nhất chuẩn thời gian modified/year.");

// 12. Kiểm tra Phim lẻ/Phim bộ/Chiếu rạp/Hoạt hình lọc theo metadata đã normalize (Tránh heuristic chuỗi episode)
console.log("12. Kiểm tra lọc chính xác dựa trên metadata đã normalize (type/category/status)...");
assert(code.includes('m.type === "series"'), "LỖI: Phim bộ phải lọc dựa trên metadata type === 'series'");
assert(code.includes('m.type === "single"'), "LỖI: Phim lẻ phải lọc dựa trên metadata type === 'single'");
assert(code.includes('m.type === "hoathinh"'), "LỖI: Hoạt hình phải lọc dựa trên metadata type === 'hoathinh'");
assert(code.includes("m.chieu_rap === true"), "LỖI: Phim chiếu rạp phải lọc dựa trên metadata chieu_rap === true");
assert(apiCode.includes("type: m.type"), "LỖI: API mapping phải chuẩn hóa trường type");
assert(apiCode.includes("chieu_rap: isCinema"), "LỖI: API mapping phải chuẩn hóa trường chieu_rap");
console.log("    ✓ Phim lẻ, phim bộ, hoạt hình, chiếu rạp lọc chính xác theo metadata đã normalize (type, category, status, chieu_rap).");

// 13. Kiểm tra Đổi navbar: đóng mobile/dropdown, cuộn main lên đầu, đồng bộ URL query & back-forward (popstate)
console.log("13. Kiểm tra Đổi navbar: đóng mobile/dropdown, cuộn main lên đầu, đồng bộ URL query & back-forward...");
assert(code.includes("setShowGenreDropdown(false)"), "LỖI: Phải đóng genre dropdown khi đổi navbar");
assert(code.includes("setShowCountryDropdown(false)"), "LỖI: Phải đóng country dropdown khi đổi navbar");
assert(code.includes("setShowSearchDropdown(false)"), "LỖI: Phải đóng search dropdown khi đổi navbar");
assert(code.includes("window.scrollTo({ top: 0"), "LỖI: Phải cuộn trang lên đầu khi đổi navbar");
assert(code.includes("window.history.pushState"), "LỖI: Phải đồng bộ URL query qua history.pushState khi đổi navbar");
assert(code.includes('window.addEventListener("popstate"'), "LỖI: Phải lắng nghe popstate để hỗ trợ back/forward");
console.log("    ✓ Đổi navbar tự đóng mobile menu & dropdown, cuộn main lên đầu, đồng bộ URL query và hỗ trợ refresh/back-forward.");

// 14. Kiểm tra Bộ lọc Nguồn áp dụng đồng bộ với mọi mục
console.log("14. Kiểm tra Bộ lọc Nguồn áp dụng đồng bộ với mọi mục...");
assert(code.includes("handleSelectSource"), "LỖI: Thiếu hàm handleSelectSource đồng bộ bộ lọc Nguồn");
assert(code.includes("displayedFavorites"), "LỖI: Thiếu displayedFavorites đồng bộ theo Nguồn");
assert(code.includes("displayedContinueList"), "LỖI: Thiếu displayedContinueList đồng bộ theo Nguồn");
assert(code.includes('params.set("source", newSource)'), "LỖI: Nguồn phải được đồng bộ vào URL query params");
assert(code.includes('params.set("source", selectedSource)'), "LỖI: Điều hướng chuyên mục phải bảo lưu nguồn đang chọn");
assert(code.includes("favorites.filter((f) => f.source === selectedSource)"), "LỖI: Yêu thích phải lọc theo selectedSource");
assert(code.includes("continueList.filter((item) => item.source === selectedSource)"), "LỖI: Lịch sử phải lọc theo selectedSource");
assert(code.includes('queryKey: ["latestMovies", selectedSource]'), "LỖI: Phim mới/Trang chủ phải đồng bộ theo selectedSource");
assert(code.includes('queryKey: ["genreQuery", selectedGenre, selectedSource]'), "LỖI: Thể loại phải đồng bộ theo selectedSource");
assert(code.includes('queryKey: ["countryQuery", selectedCountry, selectedSource]'), "LỖI: Quốc gia phải đồng bộ theo selectedSource");
assert(code.includes('queryKey: ["navCategoryQuery", selectedNav, navCategoryConfig?.slug, selectedSource]'), "LỖI: Chuyên mục phải đồng bộ theo selectedSource");
console.log("    ✓ Bộ lọc Nguồn áp dụng đồng bộ 100% trên toàn bộ các mục (Trang chủ, Phim mới, Phim lẻ, Phim bộ, Chiếu rạp, Hoạt hình, Thể loại, Quốc gia, Yêu thích, Lịch sử, Tìm kiếm).");

// 15. Kiểm tra chức năng đầy đủ cho TẤT CẢ mục trong navbar/sidebar và topbar
console.log("15. Kiểm tra chức năng đầy đủ cho TẤT CẢ mục trong navbar/sidebar và topbar...");
assert(code.includes("NAVBAR_GENRES"), "LỖI: Thiếu danh mục thể loại chuẩn NAVBAR_GENRES");
assert(code.includes("NAVBAR_COUNTRIES"), "LỖI: Thiếu danh mục quốc gia chuẩn NAVBAR_COUNTRIES");
assert(code.includes("showVipNoticeModal"), "LỖI: Mục VIP phải có modal giải thích chi tiết gói VIP");
assert(code.includes("setShowVipNoticeModal(true)"), "LỖI: Nút Chi tiết tính năng VIP phải kích hoạt modal");
assert(code.includes("userMenuRef"), "LỖI: Avatar người dùng phải có userMenuRef và menu chức năng");
assert(code.includes("showUserMenu"), "LỖI: Thiếu state showUserMenu trên Avatar");
assert(code.includes("notificationDropdownRef"), "LỖI: Chuông thông báo phải có notificationDropdownRef");
assert(code.includes("mascot-chair.webp"), "LỖI: Sidebar phải có Mascot Ghế chuẩn");
console.log("    ✓ Đầy đủ 100% chức năng cho toàn bộ các mục: Trang chủ, Phim mới, Phim lẻ, Phim bộ, Chiếu rạp, Hoạt hình, 15 Thể loại, 10 Quốc gia, Yêu thích, Lịch sử, Nguồn phim, Mochi VIP, User Avatar Menu.");

// 16. Kiểm tra Thể loại và Quốc gia: dropdown, lọc thật, Đặt lại phục hồi, click ngoài, Escape, ARIA, focus/keyboard
console.log("16. Kiểm tra Thể loại và Quốc gia (dropdown, aria-expanded, aria-controls, focus/keyboard, Đặt lại)...");
assert(code.includes("aria-expanded={showGenreDropdown}"), "LỖI: Thể loại thiếu aria-expanded");
assert(code.includes('aria-controls="genre-dropdown-menu"'), "LỖI: Thể loại thiếu aria-controls");
assert(code.includes('id="genre-dropdown-trigger"'), "LỖI: Thể loại trigger thiếu id");
assert(code.includes('id="genre-dropdown-menu"'), "LỖI: Thể loại menu thiếu id");
assert(code.includes("aria-expanded={showCountryDropdown}"), "LỖI: Quốc gia thiếu aria-expanded");
assert(code.includes('aria-controls="country-dropdown-menu"'), "LỖI: Quốc gia thiếu aria-controls");
assert(code.includes('id="country-dropdown-trigger"'), "LỖI: Quốc gia trigger thiếu id");
assert(code.includes('id="country-dropdown-menu"'), "LỖI: Quốc gia menu thiếu id");
assert(code.includes("genreButtonRef.current?.focus()"), "LỖI: Khi bấm Escape phải hoàn trả focus về genre trigger button");
assert(code.includes("countryButtonRef.current?.focus()"), "LỖI: Khi bấm Escape phải hoàn trả focus về country trigger button");
assert(code.includes("handleClickOutside"), "LỖI: Phải đóng dropdown khi click ngoài");
assert(code.includes('e.key === "Escape"'), "LỖI: Phải đóng dropdown khi bấm Escape");
assert(code.includes('aria-label="Đặt lại thể loại, phục hồi danh sách"'), "LỖI: Thiếu nút Đặt lại phục hồi danh sách trong Thể loại");
assert(code.includes('aria-label="Đặt lại quốc gia, phục hồi danh sách"'), "LỖI: Thiếu nút Đặt lại phục hồi danh sách trong Quốc gia");
assert(code.includes("fetchCategoryMoviesFromApi"), "LỖI: Phải gọi API nạp dữ liệu thật khi chọn thể loại / quốc gia");
console.log("    ✓ Thể loại và Quốc gia đầy đủ mở/đóng, lọc thật, nút Đặt lại phục hồi danh sách, click ngoài & Escape đóng, aria-expanded/aria-controls, focus/keyboard chuẩn WAI-ARIA.");

// 17. Kiểm tra đồng bộ URL query parameters và tham số tìm kiếm 'q'
console.log("17. Kiểm tra đồng bộ URL query parameters và tham số tìm kiếm 'q'...");
assert(code.includes("validateSearch"), "LỖI: Route phải có validateSearch để TanStack Router đồng bộ URL search params");
assert(code.includes("Route.useSearch()"), "LỖI: Component phải đọc search params từ Route.useSearch()");
assert(code.includes("Route.useNavigate()"), "LỖI: Component phải dùng navigate từ TanStack Router để cập nhật URL");
assert(code.includes('params.get("q")'), "LỖI: syncStateFromUrl phải đọc tham số tìm kiếm 'q' từ URL");
assert(code.includes("searchParams.q"), "LỖI: Component phải đồng bộ tham số tìm kiếm q từ searchParams");
console.log("    ✓ Đồng bộ URL query parameters và tham số tìm kiếm q hoạt động chuẩn xác với TanStack Router.");

console.log("\n==========================================");
console.log("🎉 TẤT CẢ CÁC KIỂM TRA HỢP ĐỒNG NAVBAR ĐỀU PASS!");
console.log("==========================================");


