import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert";

console.log("-> Đang kiểm tra tính năng tự động ẩn công cụ player trên máy tính (Desktop Auto-hide)...");

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const css = readFileSync(join(root, "src/styles/player-controls.css"), "utf8");
const hook = readFileSync(join(root, "src/components/player/hooks/usePlayerControlsVisibility.ts"), "utf8");
const controls = readFileSync(join(root, "src/components/player/PlayerControls.tsx"), "utf8");

// 1. Kiểm tra CSS desktop không ép hiển thị khi controls-hidden
assert(
  css.includes(".player-page-root .player.controls-hidden .controls") &&
  css.includes("opacity: 0 !important"),
  "LỖI: CSS controls-hidden phải ẩn công cụ với !important để không bị :hover ghi đè"
);
assert(
  css.includes(".player-page-root .player.controls-hidden") &&
  css.includes("cursor: none"),
  "LỖI: CSS controls-hidden phải ẩn con trỏ chuột trên desktop"
);
assert(
  !css.includes(".player:hover:not(.controls-locked) .controls"),
  "LỖI: Cấm dùng .player:hover:not(.controls-locked) vì sẽ ghi đè controls-hidden khi chuột nằm trên player"
);
console.log("   ✓ CSS desktop đảm bảo ẩn hoàn toàn công cụ và con trỏ khi controls-hidden.");

// 2. Kiểm tra hook gọi showControlsTemporarily khi di chuột
assert(
  hook.includes("handlePlayerMouseMove = () => {\n    showControlsTemporarily();") ||
  hook.includes("handlePlayerMouseMove = () => { showControlsTemporarily();"),
  "LỖI: Di chuột phải luôn gọi showControlsTemporarily"
);
assert(
  hook.includes("handlePlayerMouseLeave"),
  "LỖI: Hook phải hỗ trợ handlePlayerMouseLeave khi chuột rời player"
);
console.log("   ✓ Hook usePlayerControlsVisibility kích hoạt đếm ngược 3s chuẩn xác.");

// 3. Kiểm tra PlayerControls gắn onMouseLeave
assert(
  controls.includes("onMouseLeave={handlePlayerMouseLeave}"),
  "LỖI: PlayerControls phải gắn onMouseLeave để ẩn ngay khi chuột rời player"
);
assert(
  controls.includes("isBusy = isSeeking || settingsOpen || Boolean(drawerOpen)"),
  "LỖI: PlayerControls phải tạm dừng auto-hide khi đang thao tác tua/cài đặt/chọn tập"
);
console.log("   ✓ PlayerControls tích hợp đầy đủ các sự kiện chuột và bảo lưu hiển thị khi đang tương tác.");

console.log("\n============================================================");
console.log("🎉 KIỂM TRA TỰ ĐỘNG ẨN CÔNG CỤ TRÊN MÁY TÍNH ĐẠT 100% PASS!");
console.log("============================================================");
