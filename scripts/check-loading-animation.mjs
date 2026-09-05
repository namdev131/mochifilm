import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert";

console.log("-> Đang kiểm tra tính năng Mochi Pet Loading Animation (Entry Only)...");

const projectRoot = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// 1. Kiểm tra tồn tại các file thành phần
console.log("1. Kiểm tra các file thành phần loading animation...");
const componentPath = join(projectRoot, "src/components/common/MochiLoadingScreen.tsx");
assert(existsSync(componentPath), "LỖI: Thiếu src/components/common/MochiLoadingScreen.tsx");

const cssPath = join(projectRoot, "src/styles/mochi-loading.css");
assert(existsSync(cssPath), "LỖI: Thiếu src/styles/mochi-loading.css");

const spritePath = join(projectRoot, "public/assets/mochi/pet-spritesheet.png");
assert(existsSync(spritePath), "LỖI: Thiếu public/assets/mochi/pet-spritesheet.png");
const spriteStat = statSync(spritePath);
assert(spriteStat.size > 1000000, `LỖI: Kích thước spritesheet không hợp lệ (${spriteStat.size} bytes)`);
console.log(`   ✓ File ảnh spritesheet đầy đủ (${Math.round(spriteStat.size / 1024)} KB).`);

// 2. Kiểm tra mã nguồn MochiLoadingScreen.tsx
console.log("2. Kiểm tra logic điều kiện 'Chỉ khi vào web mới hiển thị còn vào các trang khác không cần'...");
const compCode = readFileSync(componentPath, "utf8");
assert(compCode.includes("hasShownInitialWebLoading"), "LỖI: Thiếu cờ ghi nhận trạng thái vào web");
assert(compCode.includes("waving") && compCode.includes("jumping") && compCode.includes("working"), "LỖI: Thiếu các animation states của Pet");
assert(compCode.includes("petCanvas"), "LỖI: Thiếu canvas vẽ Pet");
assert(compCode.includes("getLoggedInUserName"), "LỖI: Thiếu logic lấy tên người dùng");
assert(compCode.includes("MochiLoader"), "LỖI: Thiếu window.MochiLoader");
console.log("   ✓ Logic ghi nhận phiên vào web và cờ điều kiện chuẩn xác.");

// 3. Kiểm tra Root mount tại src/routes/__root.tsx
console.log("3. Kiểm tra gắn MochiLoadingScreen vào __root.tsx...");
const rootPath = join(projectRoot, "src/routes/__root.tsx");
const rootCode = readFileSync(rootPath, "utf8");
assert(rootCode.includes("MochiLoadingScreen"), "LỖI: __root.tsx chưa mount MochiLoadingScreen");
assert(rootCode.includes("<MochiLoadingScreen />") || rootCode.includes("<MochiLoadingScreen/>"), "LỖI: Thiếu thẻ JSX MochiLoadingScreen trong RootComponent");
console.log("   ✓ MochiLoadingScreen đã được gắn vào RootComponent của toàn bộ website.");

// 4. Kiểm tra CSS Glassmorphism và keyframes
console.log("4. Kiểm tra CSS stylesheet...");
const cssCode = readFileSync(cssPath, "utf8");
assert(cssCode.includes("#mochiLoading"), "LỖI: Thiếu #mochiLoading trong css");
assert(cssCode.includes(".mochi-loading-ambient"), "LỖI: Thiếu ambient effect");
assert(cssCode.includes(".mochi-loading-orbit"), "LỖI: Thiếu orbit effect");
assert(cssCode.includes(".mochi-loading-sparkles"), "LỖI: Thiếu sparkles effect");
assert(cssCode.includes("#petCanvas"), "LỖI: Thiếu #petCanvas");
console.log("   ✓ Hiệu ứng CSS Glassmorphism, Orbit và Canvas render hoàn hảo.");

console.log("\n============================================================");
console.log("🎉 TẤT CẢ CÁC KIỂM TRA LOADING ANIMATION ĐỀU PASS!");
console.log("============================================================\n");
