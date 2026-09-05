# Mochi Film Player — Kế hoạch triển khai theo phase

> **Cho Hermes:** Triển khai từng phase bằng TDD; không commit/push nếu chưa được xác nhận.

**Mục tiêu:** Hoàn thiện player desktop/mobile theo đặc tả, giữ các quyết định đã chốt và chỉ bật tính năng khi dữ liệu/capability thật hỗ trợ.

**Kiến trúc:** Tách `PlayerControls.tsx` thành hook điều khiển, component chrome desktop/mobile, progress Mochi, popup settings và overlay trạng thái. `PlayerControls.tsx` chỉ phối hợp video/HLS và ghép component. Không thêm dependency; dùng React, native media APIs, Hls.js hiện có.

**Ràng buộc ưu tiên:**
- Mobile chạm vùng video chỉ hiện/ẩn controls; không play/pause. Play/pause qua nút giữa.
- Không thêm UI “Đổi nguồn/Nguồn phát/Nguồn phim”. Fallback nội bộ có thể làm sau, không lộ picker.
- Không mock thumbnail, subtitle, audio track, quality, intro/outro hoặc episode metadata.
- Không tái thêm mini-player/PiP cũ gây chồng video; PiP chỉ xem xét khi xác nhận không xung đột Watch Party/player hiện tại.
- Giữ route `/watch/$slug`, data flow, API và persistence hiện có.

---

## Phase 1 — Nền controls responsive và tách file

**Phạm vi:** Hoàn thiện yêu cầu vừa chốt; giảm tải `PlayerControls.tsx`.

**Tạo:**
- `src/components/player/hooks/usePlayerControlsVisibility.ts`
- `src/components/player/PlayerControlsChrome.tsx`
- `src/components/player/PlayerProgress.tsx`
- `src/styles/player-controls.css`
- `scripts/check-player-controls-visibility.mjs`

**Sửa:**
- `src/components/player/PlayerControls.tsx`
- `src/styles/player.css` chỉ giữ layout player tổng quát/import style nếu cấu trúc hiện tại cho phép.

**Hành vi:**
1. Mobile tap vùng video hiện/ẩn controls, không đổi playback.
2. Mobile có nút khóa; khi khóa chỉ còn nút unlock.
3. Mobile giữa: `-10 | Play/Pause | +10`; progress gần đáy; nút phụ gọn.
4. Desktop mouseenter/mousemove hiện controls; 3 giây bất động thì ẩn khi đang phát; pause giữ controls.
5. Nút controls không kích hoạt handler nền.
6. Progress Mochi giữ seek bằng click/drag, keyboard, wave và reduced-motion.

**TDD/kiểm tra:**
- RED/GREEN: `node scripts/check-player-controls-visibility.mjs`
- `npx tsc --noEmit`
- `node scripts/check-player-page-contract.mjs`
- `node scripts/check-player-contract.mjs`
- CDP kiểm tra touch tap/lock/unlock và desktop mousemove.
- Screenshot 390×844, landscape mobile, 1440×1000.
- `npm run build`

**Gate:** Dừng báo cáo, liệt kê file; không commit.

---

## Phase 2 — Điều khiển desktop đầy đủ, persistence

**Tạo:**
- `src/components/player/hooks/useMediaPreferences.ts`
- `src/components/player/playerKeyboard.ts`
- `scripts/check-player-desktop-controls.mjs`

**Hành vi:**
1. Phím: `Space/K`, `J/L`, `←/→`, `M`, `F`, `T`, `↑/↓`, `[ ]`, `0–9`.
2. Animation overlay `-10/+10`.
3. Volume slider desktop; ghi nhớ volume/mute hợp lệ.
4. Playback rate `0.5–2x`; ghi nhớ lựa chọn.
5. Click thời gian đổi elapsed/remaining trên desktop.
6. Theater mode lưu trạng thái; giữ responsive hiện có.
7. Fullscreen giữ custom controls; landscape orientation chỉ gọi khi API hỗ trợ và bắt lỗi.

**Không làm:** PiP cho tới khi kiểm tra xung đột Watch Party/mini-player; không giả quality/subtitle.

**Kiểm tra:** Contract mới, keyboard CDP, reload persistence, fullscreen target, TypeScript, contracts hiện có, build, desktop/mobile screenshots.

---

## Phase 3 — Settings thực theo capability stream

**Tạo:**
- `src/components/player/PlayerSettings.tsx`
- `src/components/player/hooks/useHlsCapabilities.ts`
- `src/components/player/PlayerSettingsMobile.tsx` nếu bottom sheet khác đáng kể; nếu không dùng chung component + CSS.
- `scripts/check-player-stream-capabilities.mjs`

**Hành vi:**
1. HLS quality lấy từ `hls.levels`; Auto và level thật; đổi không reset `currentTime`.
2. Subtitle lấy từ native `textTracks`/HLS subtitle tracks; chỉ hiện lựa chọn thật.
3. Audio track chỉ hiện khi stream có nhiều track thật.
4. Desktop popup trên settings; mobile bottom sheet.
5. Lưu playback rate/subtitle preference; quality Auto mặc định.
6. Buffer bar đọc `video.buffered`, không dùng phần trăm giả.

**Gate:** Stream không có capability thì ẩn mục tương ứng. Không mock option.

---

## Phase 4 — Loading, buffering, retry, error Mochi

**Tạo:**
- `src/components/player/PlayerStatusOverlay.tsx`
- `src/components/player/hooks/useStreamHealth.ts`
- `scripts/check-player-stream-health.mjs`

**Hành vi:**
1. Mochi loading cho `waiting`, seeking, đổi quality; overlay nhẹ, không che lâu.
2. Network warning dựa trên sự kiện stall/level recovery thật; không đoán bandwidth nếu thiếu API.
3. Retry stream; fallback nội bộ qua nguồn đã resolve sẵn nếu có, không có UI picker.
4. Error UI Mochi; debug code không phơi mặc định.
5. Báo lỗi có loại lỗi, timestamp, browser; dùng backend thật nếu tồn tại, nếu chưa có thì lưu/submit chỉ sau khi API được thiết kế — không giả thành công.

---

## Phase 5 — Episode lifecycle

**Tạo:**
- `src/components/player/PlayerNextEpisode.tsx`
- `src/components/player/hooks/useEpisodeLifecycle.ts`
- `scripts/check-player-episode-lifecycle.mjs`

**Hành vi:**
1. Auto-next chỉ phim bộ, countdown 8 giây, `Xem ngay/Hủy`.
2. Next episode từ danh sách server hiện có; không đoán slug/tập.
3. Skip intro/recap/outro chỉ bật khi API có metadata thật.
4. Finish state Mochi + CTA nhỏ; reduced-motion.
5. Resume giữ persistence hiện có, bổ sung lựa chọn tiếp tục/xem lại nếu UX không phá luồng.

---

## Phase 6 — Mobile gestures và preview

**Tạo:**
- `src/components/player/hooks/usePlayerGestures.ts`
- `src/components/player/PlayerGestureOverlay.tsx`
- `src/components/player/PlayerSeekPreview.tsx`
- `scripts/check-player-mobile-gestures.mjs`

**Hành vi:**
1. Double tap trái/phải seek ±10; giữa không toggle playback do quyết định đã chốt.
2. Kéo ngang seek với preview thời gian.
3. Vuốt dọc trái mô phỏng brightness bằng CSS; reset/persist theo quyết định UX ở phase này.
4. Vuốt dọc phải chỉnh volume nội bộ khi trình duyệt cho phép; nếu không chỉ hướng dẫn volume thiết bị.
5. Long press/drag progress hiện preview; thumbnail chỉ khi nguồn có sprite/metadata thật, nếu không dùng time preview + frame hợp lệ theo CORS.
6. Landscape sắp xếp lại, controls touch-safe.

---

## Phase 7 — Watch Party, reaction, favorite integration

**Tạo/sửa theo hạ tầng Watch Party hiện có, không tạo player thứ hai.**

**Hành vi:**
1. Đồng bộ play/pause/seek/episode qua room thật; host điều phối; Admin chính có quyền đóng mọi phòng theo quy tắc dự án.
2. Desktop chat panel, mobile bottom sheet.
3. Reaction bay nhẹ + toggle; reduced-motion.
4. Favorite animation Mochi dựa trên action thật.
5. Watchlist chỉ dùng persistence/backend thật hiện có.

**Kiểm tra:** Hai client/phòng thật hoặc harness realtime; chống vòng lặp sync; đóng phòng; mobile/desktop.

---

## Phase 8 — Tính năng tùy chọn sau audit

Chỉ triển khai nếu không xung đột và capability thật có sẵn:
- Native PiP, sau khi chứng minh không tồn tại mini-player/PiP cũ và không chồng Watch Party.
- Screenshot frame chỉ khi canvas không bị CORS taint; không bật mặc định.
- Share timestamp qua Web Share/Clipboard.
- Movie recommendation sau phim lẻ, dùng dữ liệu thật.

---

## Quy trình mỗi phase

1. `git status --short`; giữ nguyên thay đổi ngoài scope.
2. Viết một contract thất bại đúng nguyên nhân thiếu tính năng.
3. Chạy RED.
4. Viết diff nhỏ nhất; tách file theo trách nhiệm, không tạo abstraction một-use vô nghĩa.
5. Chạy GREEN + player contracts + TypeScript.
6. Chạy build.
7. Chạy localhost, HTTP 200.
8. Kiểm tra DOM/tương tác CDP + screenshot desktop/mobile/landscape.
9. `git diff --check` và liệt kê file chính xác.
10. Dừng trước commit/push/deploy; xin xác nhận commit theo quy tắc người dùng.

## Rủi ro

- Embed iframe không cho custom controls/capability đầy đủ: chỉ áp dụng direct video/HLS.
- Quality/subtitle/audio khác nhau theo provider: capability detection, không option giả.
- Gesture xung đột scroll/seek: chỉ capture pointer sau khi vượt threshold và xác định hướng.
- Desktop/touch hybrid: dùng media capability `(hover)/(pointer)`, không dùng chiều rộng màn hình.
- Worktree đang có nhiều file deleted/untracked: chỉ sửa allowlist từng phase, không cleanup/reset.
