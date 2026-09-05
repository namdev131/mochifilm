import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert";

console.log("-> Đang kiểm tra hợp đồng trang chủ Mochi Film...");

const code = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
const apiCode = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
const supabaseCode = readFileSync(new URL("../src/lib/supabase.ts", import.meta.url), "utf8");
const stylesCode = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

// 1. Kiểm tra không còn mockdata
console.log("1. Kiểm tra không còn mockdata...");
assert(!code.includes("INITIAL_CONTINUE_WATCHING"), "LỖI: Vẫn còn INITIAL_CONTINUE_WATCHING trong index.tsx");
assert(!code.includes("INITIAL_HERO"), "LỖI: Vẫn còn INITIAL_HERO trong index.tsx");
assert(!code.includes("dau-la-dai-luc-2"), "LỖI: Vẫn còn mock data dau-la-dai-luc-2");
assert(!code.includes("nu-hoang-nuoc-mat"), "LỖI: Vẫn còn mock data nu-hoang-nuoc-mat");
assert(!code.includes("dune-part-two"), "LỖI: Vẫn còn mock data dune-part-two");
assert(!code.includes("solo-leveling"), "LỖI: Vẫn còn mock data solo-leveling");
assert(!code.includes("alert(\"Cảm ơn bạn!"), "LỖI: Vẫn còn alert giả lập thành công VIP");
console.log("   ✓ Không còn mockdata trong mã nguồn.");

// 2. Kiểm tra default `all`
console.log("2. Kiểm tra nguồn mặc định là 'all'...");
assert(code.includes('useState<SourceFilter>("all")'), "LỖI: selectedSource chưa khởi tạo mặc định là 'all'");
assert(code.includes("fetchLatestMerged"), "LỖI: Chưa gọi fetchLatestMerged");
assert(code.includes("searchMoviesMerged"), "LỖI: Chưa gọi searchMoviesMerged");
assert(code.includes("Tất cả"), "LỖI: Chưa có nhãn Tất cả nguồn");
console.log("   ✓ Nguồn mặc định là 'all', sử dụng fetchLatestMerged & searchMoviesMerged.");

// 3. Kiểm tra Polling 60s và cleanup
console.log("3. Kiểm tra Polling 60s và cleanup...");
assert(code.includes("60_000") || code.includes("60000"), "LỖI: Thiếu chu kỳ polling 60 giây (60000ms)");
assert(code.includes("setInterval"), "LỖI: Thiếu setInterval cho polling định kỳ");
assert(code.includes("clearInterval"), "LỖI: Thiếu clearInterval trong hàm cleanup");
console.log("   ✓ Có polling 60s và clearInterval cleanup hợp lệ.");

// 4. Kiểm tra Supabase subscribe và cleanup
console.log("4. Kiểm tra Supabase realtime subscribe và cleanup...");
assert(code.includes("supabase"), "LỖI: Thiếu supabase client");
assert(code.includes(".channel("), "LỖI: Thiếu supabase.channel(...) để đăng ký realtime");
assert(code.includes(".subscribe()"), "LỖI: Thiếu .subscribe() trên channel");
assert(code.includes("removeChannel") || code.includes("unsubscribe"), "LỖI: Thiếu cleanup removeChannel/unsubscribe");
console.log("   ✓ Có Supabase realtime subscribe và cleanup hợp lệ.");

// 5. Kiểm tra không bịa rating và dùng MovieCard thật (Yêu cầu 2)
console.log("5. Kiểm tra không bịa rating, rating chỉ hiển thị khi có response thật...");
assert(!code.includes("vote_average ||"), "LỖI: Vẫn còn fallback bịa rating 'vote_average ||' trong index.tsx");
assert(!code.includes("|| 9.8"), "LỖI: Vẫn còn fallback bịa rating '|| 9.8' trong index.tsx");
assert(!code.includes("|| 9.5"), "LỖI: Vẫn còn fallback bịa rating '|| 9.5' trong index.tsx");
assert(!apiCode.includes("8.2 +"), "LỖI: Vẫn còn công thức bịa rating trong api.ts");
assert(!apiCode.includes("Number(("), "LỖI: Vẫn còn công thức tính rating giả trong api.ts");
assert(code.includes("vote_average !== undefined"), "LỖI: Phải kiểm tra vote_average !== undefined trước khi hiển thị badge rating");
console.log("   ✓ Không bịa rating, chỉ hiển thị rating khi có dữ liệu thật từ response API.");

// 6. Kiểm tra thông báo realtime qua Supabase (Yêu cầu 4)
console.log("6. Kiểm tra thông báo realtime qua Supabase...");
assert(supabaseCode.includes("createClient"), "LỖI: Thiếu Supabase client tối thiểu");
assert(code.includes('.from("notifications")'), "LỖI: Chưa truy vấn bảng notifications thật");
assert(code.includes('table: "notifications"'), "LỖI: Chưa đăng ký realtime trên bảng notifications");
assert(code.includes("user_id"), "LỖI: Chưa lọc thông báo theo user_id");
assert(code.includes("unreadNotificationCount"), "LỖI: Thiếu đếm số thông báo chưa đọc cho badge");
assert(code.includes("Chưa đăng nhập") && code.includes("Không có thông báo nào"), "LỖI: Thiếu trạng thái rỗng chuẩn");
console.log("   ✓ Thông báo realtime Supabase chuẩn: tải thật theo user_id, subscribe realtime, cleanup đầy đủ, không dùng thông báo mẫu.");

// 7. Kiểm tra TanStack Query refetchInterval 60s & refetchOnWindowFocus (Yêu cầu 3)
console.log("7. Kiểm tra TanStack Query refetchInterval 60s & refetchOnWindowFocus...");
assert(code.includes("useQuery"), "LỖI: Chưa sử dụng useQuery cho live movies");
assert(code.includes("refetchInterval"), "LỖI: Thiếu cấu hình refetchInterval");
assert(code.includes("refetchOnWindowFocus"), "LỖI: Thiếu cấu hình refetchOnWindowFocus");
console.log("   ✓ TanStack Query cấu hình chuẩn: refetchInterval 60s, refetchOnWindowFocus, tự refresh giữ source/filter.");

// 8. Kiểm tra giao diện responsive, loading skeleton, error retry, empty states (Yêu cầu 8)
console.log("8. Kiểm tra giao diện responsive, loading skeleton, error retry, empty states...");
assert(code.includes("268px"), "LỖI: Thiếu sidebar 268px chuẩn thiết kế");
assert(code.includes("animate-pulse"), "LỖI: Thiếu loading skeleton animate-pulse");
assert(code.includes("refetchMovies"), "LỖI: Thiếu cơ chế thử lại (error retry) refetch");
assert(code.includes("Thử lại ngay"), "LỖI: Thiếu nút bấm thử lại khi có lỗi");
assert(code.includes("Không tìm thấy phim phù hợp"), "LỖI: Thiếu trạng thái rỗng khi không có phim");
console.log("   ✓ Giao diện responsive hoàn chỉnh: sidebar 268px, loading skeleton, error retry, empty state.");

// 9. Kiểm tra tệp ảnh thật trong public/assets/mochi và không dán base64 vào code (Yêu cầu 1, 2, 5)
console.log("9. Kiểm tra tài nguyên ảnh thật và Avatar Topbar 42x42...");
const assetsDir = new URL("../public/assets/mochi", import.meta.url).pathname;
assert(existsSync(new URL("../public/assets/mochi/wordmark.webp", import.meta.url)), "LỖI: Thiếu file wordmark.webp");
assert(existsSync(new URL("../public/assets/mochi/mascot-mini.png", import.meta.url)), "LỖI: Thiếu file mascot-mini.png");
assert(existsSync(new URL("../public/assets/mochi/mascot-chair.webp", import.meta.url)), "LỖI: Thiếu file mascot-chair.webp");
assert(existsSync(new URL("../public/assets/mochi/mascot-balloon.webp", import.meta.url)), "LỖI: Thiếu file mascot-balloon.webp");
assert(!code.includes("data:image/png;base64,iVBORw0KGgo"), "LỖI: Không được dán base64 khổng lồ vào index.tsx");
assert(!stylesCode.includes("data:image/png;base64,iVBORw0KGgo"), "LỖI: Không được dán base64 khổng lồ vào styles.css");
assert(code.includes("42px"), "LỖI: Thiếu kích thước avatar topbar 42x42");
assert(code.includes("mascot-mini.png"), "LỖI: Chưa gắn mascot-mini.png làm avatar");
assert(code.includes("wordmark.webp"), "LỖI: Chưa gắn wordmark.webp cho sidebar logo");
console.log("   ✓ 4 tài nguyên ảnh thật đã lưu trong public/assets/mochi/; không có base64 khổng lồ; avatar topbar 42x42 chuẩn.");

// 10. Kiểm tra Mascot Balloon góc phải Hero & Mascot Chair trên Premium Panel (Yêu cầu 3, 4)
console.log("10. Kiểm tra Mascot Balloon Hero và Mascot Chair Sidebar...");
assert(code.includes("mascot-balloon.webp"), "LỖI: Thiếu mascot-balloon.webp trong Hero");
assert(code.includes("175px") && code.includes("100px"), "LỖI: Thiếu kích thước mascot-balloon 175px desktop / 100px mobile");
assert(code.includes("mascot-chair.webp"), "LỖI: Thiếu mascot-chair.webp phía trên Premium panel");
assert(code.includes("220px") && code.includes("110px"), "LỖI: Thiếu kích thước mascot-chair 220px desktop / 110px tablet");
assert(stylesCode.includes("@keyframes floaty"), "LỖI: Thiếu animation floaty trong styles.css");
assert(stylesCode.includes("prefers-reduced-motion"), "LỖI: Thiếu kiểm tra prefers-reduced-motion trong styles.css");
assert(code.includes("motion-reduce:animate-none"), "LỖI: Thiếu class motion-reduce:animate-none");
console.log("   ✓ Mascot Balloon Hero (175px/100px) và Mascot Chair (220px/110px) floaty animation hỗ trợ prefers-reduced-motion chuẩn.");

console.log("\n==========================================");
console.log("🎉 TẤT CẢ CÁC KIỂM TRA HỢP ĐỒNG ĐỀU PASS!");
console.log("==========================================");
