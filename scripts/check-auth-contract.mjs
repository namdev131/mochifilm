import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert";

console.log("-> Đang kiểm tra hợp đồng Trang Đăng Nhập / Đăng Ký (Auth Contract)...");

const projectRoot = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// 1. Kiểm tra tồn tại và định nghĩa route /auth
console.log("1. Kiểm tra route src/routes/auth.tsx...");
const authRoutePath = join(projectRoot, "src/routes/auth.tsx");
assert(existsSync(authRoutePath), "LỖI: Thiếu file route src/routes/auth.tsx");
const authCode = readFileSync(authRoutePath, "utf8");
assert(authCode.includes('createFileRoute("/auth")'), "LỖI: Route phải đăng ký createFileRoute('/auth')");
assert(authCode.includes("validateSearch"), "LỖI: Route phải kiểm tra search params mode và redirect");
console.log("   ✓ Route /auth được cấu hình chuẩn xác theo TanStack Router.");

// 2. Kiểm tra ĐỒNG BỘ LOGO TOÀN WEBSITE - NGHIÊM CẤM DÙNG LOGO SAI / BASE64 CỦA FILE THIẾT KẾ CŨ
console.log("2. Kiểm tra đồng bộ logo chuẩn website (/assets/mochi/wordmark.webp)...");
assert(
  authCode.includes('/assets/mochi/wordmark.webp'),
  "LỖI: Trang auth phải sử dụng logo chuẩn /assets/mochi/wordmark.webp"
);
assert(
  !authCode.includes("data:image/png;base64,iVBORw0KGgo"),
  "LỖI: Không được nhúng logo base64 cũ/sai từ file html mẫu"
);
const logoPath = join(projectRoot, "public/assets/mochi/wordmark.webp");
assert(existsSync(logoPath), "LỖI: File logo chuẩn public/assets/mochi/wordmark.webp không tồn tại");
console.log("   ✓ Logo được đồng bộ chuẩn xác với toàn bộ website (wordmark.webp).");

// 3. Kiểm tra mascot & assets
console.log("3. Kiểm tra mascot và hình ảnh...");
const mascotPath = join(projectRoot, "public/assets/mochi/mascot-auth.png");
assert(existsSync(mascotPath), "LỖI: File mascot public/assets/mochi/mascot-auth.png không tồn tại");
assert(authCode.includes("/assets/mochi/mascot-auth.png"), "LỖI: Route auth phải sử dụng mascot-auth.png");
console.log("   ✓ Mascot đăng nhập đã được tích hợp đúng.");

// 4. Kiểm tra CSS và Responsive (Desktop + Mobile)
console.log("4. Kiểm tra CSS và responsive (Desktop, Tablet, Mobile)...");
const cssPath = join(projectRoot, "src/styles/auth.css");
assert(existsSync(cssPath), "LỖI: Thiếu file src/styles/auth.css");
const cssCode = readFileSync(cssPath, "utf8");
assert(cssCode.includes("@media (max-width: 1080px)"), "LỖI: Thiếu responsive breakpoint 1080px");
assert(cssCode.includes("@media (max-width: 820px)"), "LỖI: Thiếu responsive breakpoint 820px (mobile layout)");
assert(cssCode.includes("@media (max-width: 560px)"), "LỖI: Thiếu responsive breakpoint 560px (small mobile layout)");
assert(cssCode.includes("authFloatHeart"), "LỖI: Thiếu animation floating hearts");
assert(cssCode.includes("authMascotFloat"), "LỖI: Thiếu animation mascot float");
console.log("   ✓ CSS và các responsive breakpoint cho mobile + desktop đầy đủ.");

// 5. Kiểm tra kết nối Supabase thật (Zero mock data)
console.log("5. Kiểm tra xác thực Supabase thật...");
assert(authCode.includes("supabase.auth.signInWithPassword"), "LỖI: Phải gọi supabase.auth.signInWithPassword");
assert(authCode.includes("supabase.auth.signUp"), "LỖI: Phải gọi supabase.auth.signUp");
assert(authCode.includes("mochi_user"), "LỖI: Phải lưu session user vào mochi_user");
assert(authCode.includes("mochi:user-changed"), "LỖI: Phải phát event mochi:user-changed khi đăng nhập");
console.log("   ✓ Tích hợp Supabase thật đầy đủ, không dùng mock data.");

// 6. Kiểm tra liên kết từ trang chủ và các topbar
console.log("6. Kiểm tra các liên kết dẫn đến /auth trên website...");
const homeCode = readFileSync(join(projectRoot, "src/routes/index.tsx"), "utf8");
assert(homeCode.includes('to: "/auth"'), "LỖI: Trang chủ phải có liên kết điều hướng to: '/auth'");
const detailTopbarCode = readFileSync(join(projectRoot, "src/components/movie-detail/DetailTopbar.tsx"), "utf8");
assert(detailTopbarCode.includes('to: "/auth"'), "LỖI: DetailTopbar phải có liên kết điều hướng to: '/auth'");
const playerTopbarCode = readFileSync(join(projectRoot, "src/components/player/PlayerTopbar.tsx"), "utf8");
assert(playerTopbarCode.includes('to: "/auth"'), "LỖI: PlayerTopbar phải có liên kết điều hướng to: '/auth'");
console.log("   ✓ Các điểm chạm trên trang chủ, chi tiết phim và trình chiếu đều dẫn đến /auth.");

// 7. Kiểm tra Route Tree
console.log("7. Kiểm tra routeTree.gen.ts...");
const routeTreeCode = readFileSync(join(projectRoot, "src/routeTree.gen.ts"), "utf8");
assert(routeTreeCode.includes("'/auth'"), "LỖI: routeTree.gen.ts chưa nhận diện route '/auth'");
console.log("   ✓ TanStack Router đã tạo cây route chuẩn.");

console.log("\n========================================================");
console.log("🎉 TẤT CẢ CÁC ĐIỀU KHOẢN HỢP ĐỒNG AUTH ĐÃ ĐẠT 100%!");
console.log("========================================================\n");
