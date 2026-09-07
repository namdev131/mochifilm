import React, { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/auth-data-provider";
import "@/styles/auth.css";

interface AuthSearchParams {
  mode?: "login" | "register";
  redirect?: string;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearchParams => ({
    mode: search.mode === "register" ? "register" : "login",
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
  }),
  component: AuthPage,
});

export function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">(search.mode || "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  // Sync mode with search param if it changes
  useEffect(() => {
    if (search.mode && search.mode !== mode) {
      setMode(search.mode);
      setErrors({});
    }
  }, [search.mode]);

  const showToastMsg = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => {
      setToast({ show: false, msg: "" });
    }, 3500);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (mode === "register" && !name.trim()) {
      errs.name = "Nhập họ và tên của bạn nhé.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = "Email chưa đúng định dạng.";
    }

    if (!password || password.length < 6) {
      errs.password = "Mật khẩu cần ít nhất 6 ký tự.";
    }

    if (mode === "register") {
      if (confirmPassword !== password) {
        errs.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
      }
      if (!agreedTerms) {
        errs.terms = "Vui lòng đồng ý với Điều khoản & Chính sách.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;

        showToastMsg("Đăng nhập thành công! ♡");
        setTimeout(() => {
          navigate({ to: search.redirect || "/" });
        }, 800);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}${search.redirect || "/"}`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          showToastMsg("Đã gửi email xác minh. Mở liên kết trong email để hoàn tất đăng ký.");
          return;
        }

        showToastMsg(`Đăng ký thành công! Chào mừng ${name.trim()} gia nhập Mochi Film ♡`);
        setTimeout(() => {
          navigate({ to: search.redirect || "/" });
        }, 1000);
      }
    } catch (error) {
      showToastMsg(
        error instanceof Error ? error.message : "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}${search.redirect || "/"}` },
      });
      if (error) throw error;
    } catch (error) {
      showToastMsg(error instanceof Error ? error.message : `Đăng nhập với ${provider} thất bại.`);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors((prev) => ({
        ...prev,
        email: "Vui lòng nhập email hợp lệ để khôi phục mật khẩu.",
      }));
      showToastMsg("Vui lòng điền email vào ô bên dưới trước.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      showToastMsg(`Đã gửi mã khôi phục mật khẩu đến ${email.trim()}!`);
    } catch {
      showToastMsg("Không thể gửi yêu cầu đặt lại mật khẩu lúc này.");
    }
  };

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setErrors({});
  };

  return (
    <div className="auth-page-root">
      <div className="auth-ambient" />
      <span className="auth-heart h1">♥</span>
      <span className="auth-heart h2">♥</span>
      <span className="auth-heart h3">♥</span>
      <span className="auth-heart h4">♥</span>

      {/* 1. Header Topbar */}
      <header className="auth-topbar">
        <Link to="/" className="auth-brand-link" aria-label="Về trang chủ Mochi Film">
          <img src="/assets/mochi/wordmark.webp" alt="Mochi Film" className="auth-brand-logo" />
        </Link>

        <nav className="auth-nav">
          <Link to="/" search={{ nav: "trang-chu" }}>
            Trang chủ
          </Link>
          <Link to="/" search={{ nav: "phim-moi" }}>
            Phim mới
          </Link>
          <Link to="/" search={{ nav: "phim-le" }}>
            Phim lẻ
          </Link>
          <Link to="/" search={{ nav: "phim-bo" }}>
            Phim bộ
          </Link>
          <Link to="/" search={{ nav: "chieu-rap" }}>
            Chiếu rạp
          </Link>
        </nav>

        <div className="auth-header-actions">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`auth-header-btn ${mode === "login" ? "active" : ""}`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`auth-header-btn ${mode === "register" ? "active" : ""}`}
          >
            Đăng ký
          </button>
        </div>
      </header>

      {/* 2. Main Two-Column Content */}
      <main className="auth-main">
        {/* Left Column: Mascot & Hero Copy */}
        <section className="auth-hero">
          <div className="auth-hero-glow" />
          <div className="auth-mascot-wrap">
            <img
              src="/assets/mochi/mascot-auth.png"
              alt="Mochi Film Mascot"
              className="auth-mascot"
              onError={(e) => {
                // Fallback nếu ảnh PNG dung lượng cao chưa tải kịp
                (e.currentTarget as HTMLImageElement).src = "/assets/mochi/mascot-chair.webp";
              }}
            />
          </div>
          <div className="auth-hero-copy">
            <strong>Phim hay mỗi ngày</strong>
            <span>Kho phim bom tấn, phim bộ, anime chất lượng cao cùng Mochi Film.</span>
          </div>
        </section>

        {/* Right Column: Auth Card */}
        <section className="auth-card">
          {/* Logo chính thức Mochi Film đồng bộ 100% */}
          <Link to="/" className="flex items-center justify-center mb-1">
            <img src="/assets/mochi/wordmark.webp" alt="Mochi Film" className="auth-card-logo" />
          </Link>

          <p className="auth-card-kicker">Phim hay · Cảm xúc thật · Luôn có Mochi bên bạn</p>

          <h1 className="auth-title">
            {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
          </h1>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Đăng nhập để tiếp tục xem phim cùng Mochi Film"
              : "Tham gia Mochi Film để lưu phim yêu thích, bình luận và đồng bộ lịch sử xem phim"}
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Họ và tên (chỉ hiển thị khi Đăng ký) */}
            {mode === "register" && (
              <div className={`auth-field ${errors.name ? "invalid" : ""}`}>
                <svg
                  className="auth-field-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                </svg>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Họ và tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <div className="auth-field-error">{errors.name}</div>}
              </div>
            )}

            {/* Email */}
            <div className={`auth-field ${errors.email ? "invalid" : ""}`}>
              <svg
                className="auth-field-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" />
              </svg>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <div className="auth-field-error">{errors.email}</div>}
            </div>

            {/* Mật khẩu */}
            <div className={`auth-field ${errors.password ? "invalid" : ""}`}>
              <svg
                className="auth-field-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-toggle-pass"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </button>
              {errors.password && <div className="auth-field-error">{errors.password}</div>}
            </div>

            {/* Xác nhận mật khẩu (chỉ hiển thị khi Đăng ký) */}
            {mode === "register" && (
              <div className={`auth-field ${errors.confirmPassword ? "invalid" : ""}`}>
                <svg
                  className="auth-field-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-toggle-pass"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </button>
                {errors.confirmPassword && (
                  <div className="auth-field-error">{errors.confirmPassword}</div>
                )}
              </div>
            )}

            {/* Ghi nhớ & Quên mật khẩu (chỉ khi Đăng nhập) */}
            {mode === "login" && (
              <div className="auth-form-row">
                <label className="auth-check">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="auth-check-box">{rememberMe ? "✓" : ""}</span>
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <button type="button" className="auth-text-link" onClick={handleForgotPassword}>
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Điều khoản & Chính sách (chỉ khi Đăng ký) */}
            {mode === "register" && (
              <div className="auth-terms-row">
                <label className="auth-check">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                  />
                  <span className="auth-check-box">{agreedTerms ? "✓" : ""}</span>
                  <span>
                    Tôi đồng ý với{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        showToastMsg("Điều khoản và chính sách bảo mật Mochi Film");
                      }}
                    >
                      Điều khoản &amp; Chính sách
                    </a>
                  </span>
                </label>
              </div>
            )}
            {mode === "register" && errors.terms && (
              <div className="auth-field-error -mt-1 mb-1">{errors.terms}</div>
            )}

            {/* Nút Submit */}
            <button id="submitBtn" type="submit" disabled={isLoading} className="auth-submit">
              <span>{mode === "login" ? "Đăng nhập →" : "Đăng ký tài khoản →"}</span>
              {isLoading && <span className="inline-block animate-spin ml-2">↻</span>}
            </button>

            {/* Divider */}
            <div className="auth-divider">hoặc</div>

            {/* Social Buttons */}
            <div className="auth-social-grid">
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => handleOAuth("google")}
              >
                <span className="auth-social-logo google">G</span> Google
              </button>
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => handleOAuth("facebook")}
              >
                <span className="auth-social-logo fb">f</span> Facebook
              </button>
            </div>

            {/* Chuyển đổi giữa Đăng nhập và Đăng ký */}
            {mode === "login" ? (
              <p className="auth-switch-copy">
                Chưa có tài khoản?
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="auth-switch-btn"
                >
                  Đăng ký →
                </button>
              </p>
            ) : (
              <p className="auth-switch-copy">
                Đã có tài khoản?
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="auth-switch-btn"
                >
                  Đăng nhập →
                </button>
              </p>
            )}
          </form>
        </section>
      </main>

      {/* 3. Footer */}
      <footer className="auth-footer">
        <div className="auth-footer-brand">
          <span>♡</span> Mochi Film
        </div>
        <div>© Mochi Film · Những bộ phim làm cuộc sống ngọt ngào hơn.</div>
        <div className="auth-footer-links">
          <Link to="/">Trang chủ</Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              showToastMsg("Chính sách điều khoản Mochi Film");
            }}
          >
            Điều khoản
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              showToastMsg("Quyền riêng tư Mochi Film");
            }}
          >
            Quyền riêng tư
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              showToastMsg("Liên hệ hỗ trợ: support@mochifilm.vn");
            }}
          >
            Hỗ trợ
          </a>
        </div>
      </footer>

      {/* Toast Notification */}
      <div className={`auth-toast ${toast.show ? "show" : ""}`} role="status">
        {toast.msg}
      </div>
    </div>
  );
}
