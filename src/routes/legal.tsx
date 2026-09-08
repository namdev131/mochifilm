import { createFileRoute, Link } from "@tanstack/react-router";
import "@/styles/legal.css";

export const Route = createFileRoute("/legal")({ component: LegalPage });

const Section = ({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) => (
  <article className="legal-card" id={id}>
    <h2>{title}</h2>
    {children}
  </article>
);

function LegalPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <header className="legal-top">
          <div>
            <Link to="/" className="legal-brand">
              Mochi <span>Film</span>
            </Link>
            <p>Điều khoản sử dụng & Chính sách quyền riêng tư</p>
          </div>
          <span className="legal-badge">Cập nhật lần cuối: 08/09/2026</span>
        </header>

        <p className="legal-notice">
          Tài liệu này mô tả cách Mochi Film vận hành hiện tại, không phải tư vấn pháp lý. Nội dung
          có thể được cập nhật khi dịch vụ hoặc pháp luật áp dụng thay đổi.
        </p>

        <div className="legal-layout">
          <nav className="legal-nav" aria-label="Mục lục pháp lý">
            <a href="#terms">Điều khoản sử dụng</a>
            <a href="#privacy">Quyền riêng tư</a>
            <a href="#cookies">Cookie & lưu trữ</a>
            <a href="#community">Quy tắc cộng đồng</a>
          </nav>

          <section className="legal-content">
            <Section id="terms" title="1. Điều khoản sử dụng">
              <p>
                Khi truy cập hoặc sử dụng Mochi Film, bạn đồng ý tuân theo các điều khoản này. Nếu
                không đồng ý, vui lòng ngừng sử dụng dịch vụ.
              </p>
              <h3>1.1. Tài khoản</h3>
              <ul>
                <li>Cung cấp thông tin chính xác; tự bảo vệ mật khẩu và phiên đăng nhập.</li>
                <li>Không chia sẻ tài khoản theo cách gây rủi ro bảo mật hoặc lạm dụng dịch vụ.</li>
                <li>
                  Mochi Film có thể cảnh báo, hạn chế hoặc khóa tài khoản có dấu hiệu gian lận,
                  spam, xâm nhập hoặc vi phạm nghiêm trọng.
                </li>
                <li>Người dùng phải đáp ứng độ tuổi tối thiểu theo pháp luật tại nơi cư trú.</li>
              </ul>
              <h3>1.2. Nội dung phim & nguồn bên thứ ba</h3>
              <p>
                Metadata, hình ảnh, trailer và nguồn phát có thể đến từ nhà cung cấp bên thứ ba,
                chịu điều khoản riêng của họ. Mochi Film không tuyên bố sở hữu toàn bộ nội dung được
                liên kết hoặc nhúng.
              </p>
              <div className="legal-callout">
                Việc nội dung xuất hiện không tạo quyền sao chép hoặc phân phối. Người vận hành phải
                bảo đảm quyền sử dụng, giấy phép hoặc căn cứ pháp lý phù hợp.
              </div>
              <h3>1.3. Hành vi bị cấm</h3>
              <ul>
                <li>Dò quét, khai thác lỗ hổng, vượt bảo mật hoặc phá hoại hệ thống.</li>
                <li>Tải xuống, sao chép, phát lại hoặc phân phối nội dung trái phép.</li>
                <li>
                  Dùng bot hoặc script gây tải bất thường; giả mạo, quấy rối, đe dọa, spam hoặc phát
                  tán nội dung bất hợp pháp.
                </li>
                <li>Xâm phạm quyền riêng tư, sở hữu trí tuệ hoặc quyền hợp pháp của người khác.</li>
              </ul>
              <h3>1.4. Watch Party</h3>
              <ul>
                <li>
                  Chủ phòng quản lý quyền tham gia, nội dung, trạng thái phát và có thể đóng phòng.
                </li>
                <li>
                  Người tham gia phải tránh spoil, spam, quảng cáo, quấy rối và hành vi phá trải
                  nghiệm chung.
                </li>
                <li>
                  Room ID, trạng thái phát, thời gian phát, thành viên và tin nhắn có thể được xử lý
                  để vận hành phòng.
                </li>
                <li>
                  Quản trị viên có thể cảnh báo, khóa hoặc đóng phòng khi cần bảo vệ cộng đồng.
                </li>
              </ul>
              <h3>1.5. Tính khả dụng & chấm dứt</h3>
              <p>
                Dịch vụ có thể thay đổi hoặc tạm ngừng để bảo trì, bảo mật, tuân thủ pháp luật hay
                do nhà cung cấp. Người dùng có thể yêu cầu đóng tài khoản; một số dữ liệu có thể
                được giữ nếu pháp luật hoặc chống lạm dụng yêu cầu.
              </p>
            </Section>

            <Section id="privacy" title="2. Chính sách quyền riêng tư">
              <h3>2.1. Dữ liệu được xử lý</h3>
              <ul>
                <li>
                  <strong>Tài khoản:</strong> tên hiển thị, email, avatar, user ID, vai trò và trạng
                  thái xác minh.
                </li>
                <li>
                  <strong>Sử dụng:</strong> phim đã xem, tiến độ, yêu thích, lịch sử, Watch Party và
                  tin nhắn.
                </li>
                <li>
                  <strong>Kỹ thuật:</strong> IP, trình duyệt, thiết bị, thời gian truy cập, log lỗi
                  và log bảo mật.
                </li>
              </ul>
              <h3>2.2. Mục đích</h3>
              <ul>
                <li>Xác thực, bảo vệ tài khoản, lưu cài đặt và dữ liệu cá nhân hóa.</li>
                <li>Đồng bộ Watch Party, cải thiện hiệu năng, phát hiện lỗi và chống spam.</li>
                <li>Hỗ trợ người dùng, xử lý khiếu nại và yêu cầu quyền riêng tư.</li>
              </ul>
              <h3>2.3. Nhà cung cấp</h3>
              <ul>
                <li>
                  <strong>Supabase:</strong> xác thực, hồ sơ, dữ liệu ứng dụng và Watch Party.
                </li>
                <li>
                  <strong>Convex:</strong> dữ liệu realtime và chức năng ứng dụng.
                </li>
                <li>
                  <strong>Vercel hoặc hạ tầng triển khai tương đương:</strong> hosting, CDN và log
                  kỹ thuật.
                </li>
                <li>
                  Nguồn dữ liệu phim, API và dịch vụ tạo QR chỉ nhận dữ liệu cần cho chức năng tương
                  ứng.
                </li>
              </ul>
              <h3>2.4. Chia sẻ, lưu trữ & quyền của bạn</h3>
              <p>
                Mochi Film không bán dữ liệu cá nhân. Dữ liệu chỉ được chia sẻ với nhà cung cấp cần
                thiết, theo yêu cầu pháp luật hoặc để bảo vệ dịch vụ. Tùy pháp luật áp dụng, bạn có
                thể yêu cầu truy cập, chỉnh sửa, xóa, hạn chế xử lý hoặc nhận bản sao dữ liệu.
              </p>
              <p>
                Không chủ ý thu thập dữ liệu của trẻ em dưới độ tuổi được phép tự sử dụng dịch vụ
                trực tuyến. Tài khoản không đủ tuổi có thể bị hạn chế hoặc xóa.
              </p>
            </Section>

            <Section id="cookies" title="3. Cookie & công nghệ tương tự">
              <p>
                Mochi Film dùng cookie, localStorage hoặc sessionStorage cần thiết để duy trì phiên
                đăng nhập, chống spam, ghi nhớ theme, cài đặt player và trạng thái giao diện.
                Analytics hoặc quảng cáo không thiết yếu, nếu được thêm, phải được công bố và xin
                lựa chọn khi pháp luật yêu cầu.
              </p>
            </Section>

            <Section id="community" title="4. Quy tắc cộng đồng">
              <ul>
                <li>Tôn trọng mọi người; phát ngôn văn minh, lịch sự.</li>
                <li>Không spoil khi chưa cảnh báo; giữ đúng chủ đề phim và phòng.</li>
                <li>Không spam, quảng cáo, gửi link đáng ngờ, xúc phạm, đe dọa hoặc quấy rối.</li>
                <li>Không chia sẻ dữ liệu cá nhân của người khác khi chưa được phép.</li>
                <li>Tuân thủ hướng dẫn hợp lý của chủ phòng và quản trị viên.</li>
              </ul>
              <p>
                Nội dung vi phạm có thể bị xóa; tài khoản hoặc phòng có thể bị cảnh báo, hạn chế,
                khóa hoặc đóng tùy mức độ.
              </p>
            </Section>
          </section>
        </div>

        <footer className="legal-footer">
          <span>Mochi Film · Little Mochi, Big Stories ♡</span>
          <Link to="/">Về trang chủ</Link>
        </footer>
      </div>
    </main>
  );
}
