# Quy tắc bền vững: Tuyệt đối không sử dụng Mock Data (Zero Mock Data Policy)

## 1. Nguyên tắc cốt lõi
- **Chỉ sử dụng dữ liệu và API thật:** Mọi tính năng, trang, component và hook trong dự án Mochi Film bắt buộc phải kết nối và hiển thị dữ liệu thật từ các nguồn API hoặc hệ thống lưu trữ hiện có (`fetchDetail`, `fetchLatest`, `fetchLatestMerged`, `searchMovies`, Supabase realtime, `localStorage`).
- **Nghiêm cấm dữ liệu giả lập (Mock Data):**
  - Tuyệt đối không hard-code danh sách phim mẫu (như Inception, The Martian, Interstellar, v.v. với ảnh Unsplash giả).
  - Tuyệt đối không hard-code danh sách diễn viên mẫu (như Matthew McConaughey, Anne Hathaway, v.v.).
  - Tuyệt đối không hard-code danh sách bình luận mẫu (như MinhKhoa, HoangNam, LinhLinh, v.v.).
  - Tuyệt đối không bịa số điểm đánh giá (rating) hay fallback điểm giả (như `|| 8.8`, `|| 9.8`, `8.2 + Math.random()`). Chỉ hiển thị badge điểm khi có trường điểm số thật từ response API (`vote_average !== undefined && vote_average > 0`).
  - Tuyệt đối không hard-code số lượng thông báo giả (như `<b>3</b>`) khi chưa có thông báo thật.

## 2. Xử lý trạng thái thiếu dữ liệu (Empty States & Loading)
- Khi dữ liệu từ API chưa kịp tải về, hiển thị Skeleton Loading hoặc Spinner rõ ràng.
- Khi dữ liệu thực tế từ máy chủ rỗng (không có diễn viên, chưa có bình luận, danh sách đề xuất trống), phải hiển thị **Empty State** chân thật, lịch sự và sạch sẽ:
  - *Diễn viên:* "Thông tin diễn viên đang được cập nhật từ máy chủ nguồn."
  - *Bình luận:* "Chưa có bình luận nào cho phim này. Hãy là người đầu tiên để lại cảm nghĩ!"
  - *Đề xuất:* "Đang tải danh sách phim tương tự từ nguồn phát..."
- Khi người dùng gửi tương tác mới (bình luận, yêu thích, xem phim), lưu trữ vào hệ thống thật (`localStorage`, Supabase) và đọc lại từ dữ liệu đó.
