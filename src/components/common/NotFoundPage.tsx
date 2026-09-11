import { type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Home, Play, Search } from "lucide-react";
import "@/styles/not-found.css";

export function NotFoundPage() {
  const navigate = useNavigate();
  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    if (q) void navigate({ to: "/search", search: { q, source: "all" } });
  };

  return (
    <div className="not-found-page">
      <header className="not-found-topbar">
        <Link to="/" className="not-found-brand" aria-label="Mochi Film - Trang chủ">
          <span className="not-found-brand-mark">
            <Play aria-hidden="true" />
          </span>
          <span>
            <strong>
              Mochi <b>Film</b>
            </strong>
            <small>Phim hay mỗi ngày</small>
          </span>
        </Link>
        <Link to="/" className="not-found-mini-home">
          <Home aria-hidden="true" /> Về Trang chủ
        </Link>
      </header>

      <main className="not-found-content">
        <section className="not-found-copy">
          <span className="not-found-eyebrow">Mochi bị lạc mất đường rồi</span>
          <div className="not-found-code" aria-label="Lỗi 404">
            404
          </div>
          <h1>Trang này không tồn tại, nhưng phim hay thì vẫn còn</h1>
          <p>Đường dẫn sếp vừa mở đã biến mất, đổi địa chỉ hoặc chưa từng tồn tại.</p>
          <div className="not-found-actions">
            <Link className="not-found-button primary" to="/">
              <Home aria-hidden="true" /> Về Trang chủ
            </Link>
            <button
              className="not-found-button secondary"
              type="button"
              onClick={() => (history.length > 1 ? history.back() : void navigate({ to: "/" }))}
            >
              <ArrowLeft aria-hidden="true" /> Quay lại
            </button>
          </div>
          <form className="not-found-search" role="search" onSubmit={search}>
            <label htmlFor="not-found-query">Tìm phim khác</label>
            <div>
              <Search aria-hidden="true" />
              <input
                id="not-found-query"
                name="q"
                type="search"
                placeholder="Tên phim, anime, diễn viên..."
                required
              />
              <button type="submit">Tìm phim</button>
            </div>
          </form>
        </section>

        <section className="not-found-visual" aria-label="Linh vật Mochi">
          <div className="not-found-orbit" />
          <img
            src="/assets/mochi/mascot-404.webp"
            alt="Linh vật Mochi đang tìm đường"
            width="1370"
            height="1148"
          />
          <span className="not-found-chip chip-one">Không sao, xem phim khác!</span>
          <span className="not-found-chip chip-two">Mochi vẫn ở đây</span>
        </section>
      </main>

      <footer className="not-found-footer">
        <span>© 2026 Mochi Film</span>
        <nav aria-label="Liên kết cuối trang">
          <Link to="/">Trang chủ</Link>
          <Link to="/legal">Điều khoản và chính sách</Link>
          <Link to="/settings">Cài đặt</Link>
        </nav>
      </footer>
    </div>
  );
}
