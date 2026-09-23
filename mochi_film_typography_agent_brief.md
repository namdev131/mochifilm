# MOCHI FILM — TYPOGRAPHY & UI INTEGRATION BRIEF

## Mục tiêu

Chuẩn hóa toàn bộ hệ thống font chữ cho Mochi Film để giao diện:

- Cute, mềm mại, dễ thương nhưng không trẻ con.
- Premium, hiện đại, dễ đọc trên web xem phim.
- Hỗ trợ tiếng Việt tốt.
- Đồng bộ giữa Trang chủ, Đăng nhập/Đăng ký, Watch Party, Movie Detail, Video Player, Admin và các trang tương lai.
- Không thay đổi logo Mochi Film hiện tại. Logo tiếp tục dùng artwork/logo custom đang có.

---

# 1. FONT SYSTEM CHÍNH

## 1.1 Display / Heading

**Fredoka**

Dùng cho:

- Hero title
- Tiêu đề trang
- Tiêu đề section
- Heading lớn trong card
- CTA có tính cảm xúc / playful
- Watch Party title
- Tiêu đề modal lớn

Khuyến nghị:

- 500: heading phụ
- 600: heading section
- 700: hero / title chính

Không dùng Fredoka cho đoạn văn dài.

---

## 1.2 UI / Body

**Be Vietnam Pro**

Dùng cho:

- Navbar
- Sidebar
- Button
- Form
- Input
- Body text
- Metadata phim
- Subtitle
- Chat
- Tooltip
- Dropdown
- Settings
- Admin
- Table
- Toast
- Player controls

Khuyến nghị:

- 400: body
- 500: metadata / secondary
- 600: menu / label
- 700: button
- 800: emphasis nhỏ

---

## 1.3 Handwriting / Mascot Note

**Dancing Script**

Dùng rất hạn chế cho:

- Câu quote của Mochi
- Note viết tay
- Decorative copy
- Các câu như:
  - “Một bộ phim · Một tâm trạng · Một ngày vui hơn ♡”
  - “Cùng xem · Cùng cảm xúc”
  - “Phim hay hơn khi có bạn”
  - Chữ viết tay trên card mascot / Watch Party

Khuyến nghị:

- 600
- 700

Không dùng Dancing Script cho:

- Menu
- Form
- Chat
- Nội dung dài
- Metadata

---

# 2. GOOGLE FONTS IMPORT

Ưu tiên dùng:

```css
@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&family=Fredoka:wght@500;600;700&display=swap");
```

Nếu project dùng Next.js, ưu tiên `next/font/google` thay cho `@import`.

---

# 3. CSS TOKENS BẮT BUỘC

```css
:root {
  --font-display: "Fredoka", sans-serif;
  --font-ui: "Be Vietnam Pro", sans-serif;
  --font-hand: "Dancing Script", cursive;
}
```

Thiết lập mặc định:

```css
html,
body {
  font-family: var(--font-ui);
}

h1,
h2,
h3,
h4,
.hero-title,
.page-title,
.section-title,
.modal-title {
  font-family: var(--font-display);
}

.mochi-note,
.handwriting,
.mochi-quote {
  font-family: var(--font-hand);
}
```

---

# 4. TYPOGRAPHY SCALE

## Desktop

```css
--text-xs: 11px;
--text-sm: 13px;
--text-base: 15px;
--text-md: 17px;
--text-lg: 20px;
--text-xl: 24px;
--text-2xl: 32px;
--text-3xl: 42px;
--text-hero: clamp(44px, 5vw, 72px);
```

## Mobile

```css
--text-xs: 10px;
--text-sm: 12px;
--text-base: 14px;
--text-md: 16px;
--text-lg: 18px;
--text-xl: 22px;
--text-2xl: 28px;
--text-hero: clamp(36px, 11vw, 50px);
```

---

# 5. LINE HEIGHT / LETTER SPACING

## Display

- Hero: `line-height: 0.95–1.05`
- Heading: `line-height: 1.05–1.2`
- Letter spacing: `-0.02em` đến `-0.05em`

## UI

- Body: `line-height: 1.55–1.7`
- Button: `line-height: 1`
- Menu: `line-height: 1.2`

## Handwriting

- `line-height: 1.15–1.3`
- Không dùng quá nhỏ hơn 16px

---

# 6. FONT MAPPING THEO COMPONENT

| Component            | Font                     | Weight  |
| -------------------- | ------------------------ | ------- |
| Logo                 | Giữ logo custom          | —       |
| Hero title           | Fredoka                  | 700     |
| Page title           | Fredoka                  | 600–700 |
| Section title        | Fredoka                  | 600     |
| Card title           | Fredoka / Be Vietnam Pro | 600     |
| Navbar               | Be Vietnam Pro           | 600     |
| Sidebar              | Be Vietnam Pro           | 600     |
| Button               | Be Vietnam Pro           | 700     |
| Input                | Be Vietnam Pro           | 500     |
| Body                 | Be Vietnam Pro           | 400–500 |
| Movie metadata       | Be Vietnam Pro           | 500     |
| Badge                | Be Vietnam Pro           | 700–800 |
| Chat                 | Be Vietnam Pro           | 400–600 |
| Video player control | Be Vietnam Pro           | 600     |
| Admin UI             | Be Vietnam Pro           | 500–700 |
| Mochi note           | Dancing Script           | 600–700 |
| Decorative quote     | Dancing Script           | 600–700 |

---

# 7. THIẾT KẾ MOCHI FILM CẦN GIỮ NGUYÊN

Typography mới phải giữ đúng design language hiện tại:

- Dark chocolate / black background.
- Pink accent khoảng `#ff4f86` / `#ff5b8a`.
- Cream / soft yellow accent khoảng `#ffc75d`.
- Rounded cards.
- Glassmorphism nhẹ.
- Pink glow vừa phải.
- Cute mascot Mochi.
- Không biến giao diện thành Netflix generic.
- Không thay logo hiện tại.
- Không thay mascot nếu task chỉ là typography.
- Không đổi cấu trúc layout nếu không cần thiết.
- Desktop: sidebar trái.
- Mobile: bottom dockbar.
- UI text tiếng Việt.

---

# 8. FONT THEO TỪNG TRANG

## Trang chủ

- Hero: Fredoka 700.
- Section title: Fredoka 600.
- Movie card title: Be Vietnam Pro 600.
- Metadata: Be Vietnam Pro 500.
- Mascot quote: Dancing Script 600.
- Search / nav / profile: Be Vietnam Pro.

## Login / Register

- “Chào mừng trở lại”, “Tạo tài khoản mới”: Fredoka 600–700.
- Form / placeholder / validation: Be Vietnam Pro.
- CTA: Be Vietnam Pro 700.
- Decorative mascot copy: Dancing Script.

## Watch Party

- “Watch Party”: Fredoka 700.
- Tab / member / chat / controls: Be Vietnam Pro.
- “Cùng xem · Cùng cảm xúc…”: Dancing Script.
- Note “Một chút quy tắc nhá”: có thể dùng Fredoka 600 cho title, Be Vietnam Pro cho checklist.
- Decorative handwritten footer trên note: Dancing Script.

## Movie Detail

- Movie title: Fredoka 700 hoặc giữ typography cinematic nếu artwork yêu cầu.
- Metadata / buttons / tabs: Be Vietnam Pro.
- Quote / mascot annotation: Dancing Script.

## Video Player

- Controls: Be Vietnam Pro.
- Time / quality / speed / subtitle labels: Be Vietnam Pro 500–700.
- Không dùng Fredoka trong control bar.
- Mascot bubble có thể dùng Fredoka 500 hoặc Dancing Script nếu là decorative text ngắn.

## Admin

- Toàn bộ UI: Be Vietnam Pro.
- Heading: Fredoka 600.
- Không dùng Dancing Script trong bảng, stats, permissions.

---

# 9. RESPONSIVE RULES

- Font không được overflow.
- Heading phải dùng `clamp()`.
- Không ép title xuống quá nhiều dòng trên mobile.
- Button text tối thiểu 12px mobile.
- Body tối thiểu 14px mobile.
- Chat tối thiểu 13px mobile.
- Metadata tối thiểu 11px mobile.
- Chữ viết tay tối thiểu 16px mobile.

---

# 10. ACCESSIBILITY

- Không dùng font weight quá mảnh trên nền tối.
- Body ít nhất weight 400.
- UI quan trọng nên 500+.
- Button ít nhất 600–700.
- Contrast text đạt mức dễ đọc.
- Không dùng pink quá nhạt cho body text.
- Handwriting chỉ dùng decorative, không dùng cho nội dung bắt buộc phải đọc.
- Tôn trọng `prefers-reduced-motion`; typography không phụ thuộc animation để hiểu nội dung.

---

# 11. FALLBACK FONT

```css
--font-display: "Fredoka", "Arial Rounded MT Bold", system-ui, sans-serif;
--font-ui: "Be Vietnam Pro", Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
--font-hand: "Dancing Script", "Segoe Script", cursive;
```

---

# 12. PERFORMANCE

- Chỉ load weight thực sự dùng:
  - Fredoka: 500, 600, 700
  - Be Vietnam Pro: 400, 500, 600, 700, 800
  - Dancing Script: 600, 700
- Nếu dùng Next.js: dùng `next/font/google`.
- Nếu HTML thuần: ưu tiên `<link rel="preconnect">` + `<link href=...>`.
- Không tải font file custom nặng nếu không cần.
- Không base64 font vào HTML.

---

# 13. YÊU CẦU IMPLEMENTATION CHO AGENT

Agent cần:

1. Audit toàn project và tìm toàn bộ `font-family`.
2. Loại bỏ font cũ không cần thiết.
3. Tạo typography tokens dùng chung.
4. Áp dụng đúng mapping ở trên.
5. Không thay logo.
6. Không thay màu/mascot/layout trừ khi font mới gây overflow.
7. Fix responsive typography.
8. Test tiếng Việt có dấu.
9. Test:
   - desktop 1440px
   - desktop 1280px
   - tablet 768px
   - mobile 390px
   - mobile 360px
10. Không để FOUT/FOIT quá rõ.
11. Không dùng quá 3 font family.
12. Chữ viết tay phải cực hạn chế.
13. Giữ cảm giác cute + premium.
14. Sau khi hoàn thành, báo:

- file nào đã sửa
- token nào đã thêm
- font nào bị loại
- lỗi responsive nào đã fix

---

# 14. ACCEPTANCE CRITERIA

Hoàn thành khi:

- Toàn bộ site chỉ dùng:
  - Fredoka
  - Be Vietnam Pro
  - Dancing Script
  - logo custom
- Typography đồng bộ trên mọi trang.
- Không còn font cũ bị sót ngoài fallback hợp lệ.
- Tiếng Việt hiển thị đúng.
- Không overflow trên mobile.
- Navbar / form / chat / player dễ đọc.
- Heading nhìn cute nhưng vẫn premium.
- Dancing Script không bị lạm dụng.
- Logo Mochi Film không bị thay bằng text.
- Giao diện vẫn giữ đúng màu hồng neon + dark chocolate của Mochi Film.

---

# 15. PROMPT NGẮN DÁN THẲNG CHO AGENT

> Chuẩn hóa typography toàn bộ project Mochi Film. Sử dụng Fredoka cho display/heading, Be Vietnam Pro cho toàn bộ UI/body/form/chat/player/admin, Dancing Script chỉ cho mascot notes và decorative handwritten quotes. Giữ nguyên logo custom, mascot, màu sắc, layout và design language hiện tại. Tạo CSS typography tokens dùng chung, loại bỏ font cũ dư thừa, fix responsive typography cho desktop/tablet/mobile, đảm bảo tiếng Việt hiển thị tốt và không overflow. Không redesign layout. Sau khi sửa, báo rõ các file đã thay đổi và các font cũ đã loại bỏ.
