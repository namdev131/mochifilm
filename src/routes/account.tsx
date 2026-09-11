import { type FormEvent, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Crown, ShieldCheck, Shield, UserRound, Save, Search, Camera, LogOut, Heart, History, ChartNoAxesCombined, Film, Play } from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAppAuth, supabase } from "@/lib/auth-data-provider";
import {
  accountMembership,
  parseAccountFavorites,
  validateAccountProfile,
  type AccountFavorite,
  type AccountProfile,
} from "@/lib/account";
import { MobileBottomDock } from "@/components/common/MobileBottomDock";
import type { SourceId } from "@/lib/types";
import "@/styles/account.css";

export const Route = createFileRoute("/account")({ component: AccountPage });
const EMPTY_PROFILE: AccountProfile = {
  displayName: "",
  avatarUrl: "",
  bio: "",
  phone: "",
  country: "",
  birthday: "",
  gender: "",
};
const TABS = {
  overview: "Tổng quan",
  membership: "Gói thành viên",
  favorites: "Phim yêu thích",
  activity: "Lịch sử xem",
  stats: "Thống kê",
  badges: "Huy hiệu",
  settings: "Cài đặt tài khoản",
  security: "Bảo mật",
};
type Tab = keyof typeof TABS;
type Achievement = {
  key: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  unlockedAt: string | null;
};
const ROLE_ICONS = { admin: ShieldCheck, deputy_admin: Shield, vip: Crown, member: UserRound };

function AccountPage() {
  const { user, isLoading } = useAppAuth();
  const { isAuthenticated } = useConvexAuth();
  const history = useQuery(api.watchHistory.list, isAuthenticated ? {} : "skip");
  const cloudFavorites = useQuery(api.favorites.list, isAuthenticated ? {} : "skip");
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<AccountProfile>(EMPTY_PROFILE);
  const [profileReady, setProfileReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [favorites, setFavorites] = useState<AccountFavorite[]>([]);
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [achievementError, setAchievementError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(Date.now);
  const [password, setPassword] = useState("");
  const [promocode, setPromocode] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && !user)
      void navigate({ to: "/auth", search: { mode: "login", redirect: "/account" } });
    if (!user) return;
    let cancelled = false;
    setProfileReady(false);
    setProfile(EMPTY_PROFILE);
    const metadata = user.user_metadata;
    const text = (key: string) =>
      typeof metadata?.[key] === "string" ? (metadata[key] as string) : "";
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name,avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        setProfile({
          displayName:
            data?.display_name ||
            text("full_name") ||
            text("display_name") ||
            user.email?.split("@")[0] ||
            "Thành viên",
          avatarUrl: data?.avatar_url || text("avatar_url"),
          bio: text("bio"),
          phone: text("phone"),
          country: text("country"),
          birthday: text("birthday"),
          gender: text("gender"),
        });
        setProfileReady(true);
      } catch {
        if (!cancelled)
          setMessage(
            "Không tải được hồ sơ. Tải lại trang để thử lại; chưa thể lưu để tránh ghi đè dữ liệu.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && cloudFavorites) {
      setFavorites(cloudFavorites.map((favorite) => ({
        slug: favorite.slug,
        name: favorite.name,
        poster: favorite.poster || "",
        thumb: favorite.poster || "",
        source: favorite.source as SourceId,
      })));
      return;
    }
    try {
      setFavorites(parseAccountFavorites(localStorage.getItem("mochi_favorites") || localStorage.getItem("lv-favorites")));
    } catch {
      setFavorites([]);
    }
  }, [isAuthenticated, cloudFavorites]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setAchievements(null);
    setAchievementError("");
    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) throw new Error("Phiên đăng nhập đã hết hạn.");
        const response = await fetch("/api/watch-history", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ action: "achievements" }),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.achievements))
          throw new Error("Không tải được huy hiệu.");
        if (!controller.signal.aborted) setAchievements(result.achievements);
      } catch {
        if (!controller.signal.aborted)
          setAchievementError("Không tải được huy hiệu. Vui lòng tải lại trang.");
      }
    })();
    return () => controller.abort();
  }, [user?.id]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!user || !profileReady || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const value = validateAccountProfile(profile);
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: value.displayName,
          avatar_url: value.avatarUrl || null,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      const auth = await supabase.auth.updateUser({
        data: {
          full_name: value.displayName,
          avatar_url: value.avatarUrl || null,
          bio: value.bio,
          phone: value.phone,
          country: value.country,
          birthday: value.birthday,
          gender: value.gender,
        },
      });
      if (auth.error)
        throw new Error("Tên/ảnh đã lưu; thông tin bổ sung chưa lưu. Vui lòng thử lại.");
      const stored = await supabase
        .from("profiles")
        .select("display_name,avatar_url")
        .eq("id", user.id)
        .single();
      const verified = await supabase.auth.getUser();
      if (
        stored.error ||
        verified.error ||
        stored.data?.display_name !== value.displayName ||
        (stored.data?.avatar_url || "") !== value.avatarUrl ||
        ["bio", "phone", "country", "birthday", "gender"].some(
          (key) => verified.data.user?.user_metadata[key] !== value[key as keyof AccountProfile],
        )
      )
        throw new Error("Chưa xác minh được dữ liệu đã lưu. Vui lòng tải lại hồ sơ.");
      const cache = {
        id: user.id,
        email: user.email,
        name: value.displayName,
        avatarUrl: value.avatarUrl || undefined,
      };
      try {
        localStorage.setItem("mochi_user", JSON.stringify(cache));
      } catch {
        /* Auth remains the source of truth. */
      }
      window.dispatchEvent(new CustomEvent("mochi:user-changed", { detail: cache }));
      setProfile(value);
      setMessage("Đã lưu và xác minh hồ sơ.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được hồ sơ.");
    } finally {
      setBusy(false);
    }
  }

  async function logout(others = false) {
    if (others && !window.confirm("Đăng xuất tất cả phiên khác? Phiên hiện tại được giữ lại."))
      return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: others ? "others" : "local" });
      if (error) throw error;
      if (others)
        setMessage(
          "Đã thu hồi phiên khác. Access token đã cấp có thể còn hiệu lực tới khi hết hạn.",
        );
      else {
        localStorage.removeItem("mochi_user");
        window.dispatchEvent(new CustomEvent("mochi:user-changed", { detail: null }));
        void navigate({ to: "/auth", search: { mode: "login", redirect: "/account" } });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không đăng xuất được.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8 || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setMessage("Đã đổi mật khẩu.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không đổi được mật khẩu.");
    } finally {
      setBusy(false);
    }
  }

  async function redeemPromocode(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error("Phiên đăng nhập đã hết hạn.");
      const response = await fetch("/api/promocode", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ code: promocode }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không áp dụng được promocode.");
      await supabase.auth.refreshSession();
      setPromocode("");
      setMessage(`Đã kích hoạt VIP đến ${new Date(result.vip_expires_at).toLocaleString("vi-VN")}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không áp dụng được promocode.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading)
    return (
      <main className="account-page-root" aria-busy="true">
        Đang tải tài khoản...
      </main>
    );
  if (!user) return null;
  const membership = accountMembership(user, now);
  const RoleIcon = ROLE_ICONS[membership.kind];
  const badge = (
    <span className={`account-role-badge account-role-${membership.kind}`}>
      <RoleIcon size={17} aria-hidden="true" />
      {membership.label}
    </span>
  );
  const avatar = profile.avatarUrl || "/assets/mochi/mascot-mini.png";
  const field = (key: keyof AccountProfile, value: string) =>
    setProfile((prev) => ({ ...prev, [key]: value }));
  const unlocked = achievements?.filter((item) => item.unlockedAt).length;
  const historyPanel = (
    <div className="account-card account-library-panel">
      <div className="account-library-heading"><History aria-hidden="true" /><div><h3>Lịch sử xem</h3><p>Tiếp tục câu chuyện còn dang dở.</p></div><span className="account-library-count">{history?.length ?? "—"}</span></div>
      {history === undefined ? (
        <p className="account-empty-panel" role="status">Đang tải lịch sử...</p>
      ) : !history.length ? (
        <div className="account-empty-panel"><History size={32} aria-hidden="true" /><h4>Chưa có lịch sử xem</h4><p>Phim đã xem sẽ xuất hiện tại đây khi được đồng bộ.</p><Link to="/search" search={{ q: "", source: "all" }} className="account-card-btn">Khám phá phim</Link></div>
      ) : (
        history.map((item) => (
          <div className="account-history-row" key={item._id}>
            <div className="account-history-poster">{item.poster ? <img src={item.poster} alt="" loading="lazy" /> : <Film aria-hidden="true" />}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{item.name}</b>
              <small>
                {item.episodeName || "Đang xem"} ·{" "}
                {new Date(item.watchedAt).toLocaleString("vi-VN")}
              </small>
            </div>
            <Link
              className="account-card-btn"
              to="/watch/$slug"
              params={{ slug: item.slug }}
              search={{ source: item.source as SourceId, ep: item.epIndex, srv: item.srvIndex }}
            >
              <Play size={14} aria-hidden="true" /> Xem tiếp
            </Link>
          </div>
        ))
      )}
    </div>
  );
  const favoritesPanel = (
    <div className="account-card account-library-panel">
      <div className="account-library-heading"><Heart aria-hidden="true" /><div><h3>Phim yêu thích</h3><p>{isAuthenticated ? "Bộ sưu tập đồng bộ theo tài khoản." : "Bộ sưu tập lưu trên trình duyệt này."}</p></div><span className="account-library-count">{favorites.length}</span></div>
      {!favorites.length ? (
        <div className="account-empty-panel"><Heart size={32} aria-hidden="true" /><h4>Bộ sưu tập đang chờ bạn</h4><p>Nhấn yêu thích trên phim để lưu vào đây.</p><Link to="/search" search={{ q: "", source: "all" }} className="account-card-btn">Khám phá phim</Link></div>
      ) : (
        <div className="account-movies-grid">
          {favorites.map((item) => (
            <Link
              key={`${item.source}:${item.slug}`}
              to="/movie/$slug"
              params={{ slug: item.slug }}
              search={{ source: item.source }}
              className="account-movie-item"
            >
              {(item.poster || item.thumb) ? (
                <img src={item.poster || item.thumb} alt={item.name} loading="lazy" />
              ) : <div className="account-poster-placeholder"><Film aria-hidden="true" /></div>}
              <b>{item.name}</b>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="account-page-root">
      <header className="account-topbar">
        <Link to="/" className="account-brand">
          <img src="/assets/mochi/wordmark.webp" alt="Mochi Film" className="wordmark-img" />
        </Link>
        <nav className="account-nav">
          <Link to="/" className="account-nav-btn">
            ⌂ Trang chủ
          </Link>
          <Link
            to="/search"
            search={{ q: "phim bộ", source: "all" }}
            className="account-nav-btn"
          >
            ▣ Phim bộ
          </Link>
          <Link
            to="/search"
            search={{ q: "phim lẻ", source: "all" }}
            className="account-nav-btn"
          >
            ♙ Phim lẻ
          </Link>
          <div className="account-nav-item">
            <button type="button" className="account-nav-btn">
              ▦ Thể loại <span className="account-nav-arrow">▾</span>
            </button>
            <div className="account-nav-dropdown grid-2">
              <div>
                <div className="account-nav-drop-head">Phổ biến</div>
                <Link
                  to="/search"
                  search={{ q: "hành động", source: "all" }}
                  className="account-nav-drop-link"
                >
                  <span className="account-nav-drop-ico">⚔</span> Hành động
                </Link>
                <Link
                  to="/search"
                  search={{ q: "viễn tưởng", source: "all" }}
                  className="account-nav-drop-link"
                >
                  <span className="account-nav-drop-ico">🚀</span> Viễn tưởng
                </Link>
                <Link
                  to="/search"
                  search={{ q: "cổ trang", source: "all" }}
                  className="account-nav-drop-link"
                >
                  <span className="account-nav-drop-ico">🎎</span> Cổ trang
                </Link>
                <Link
                  to="/search"
                  search={{ q: "tình cảm", source: "all" }}
                  className="account-nav-drop-link"
                >
                  <span className="account-nav-drop-ico">💖</span> Tình cảm
                </Link>
                <Link
                  to="/search"
                  search={{ q: "kinh dị", source: "all" }}
                  className="account-nav-drop-link"
                >
                  <span className="account-nav-drop-ico">👻</span> Kinh dị
                </Link>
              </div>
              <div>
                <div className="account-nav-drop-head">Đặc sắc</div>
                <Link
                  to="/search"
                  search={{ q: "hài hước", source: "all" }}
                  className="account-nav-drop-link"
                >
                  <span className="account-nav-drop-ico">😄</span> Hài hước
                </Link>
                <Link
                  to="/search"
                  search={{ q: "tâm lý", source: "all" }}
                  className="account-nav-drop-link"
                >
                  <span className="account-nav-drop-ico">🧠</span> Tâm lý
                </Link>
                <Link
                  to="/search"
                  search={{ q: "hoạt hình", source: "all" }}
                  className="account-nav-drop-link"
                >
                  <span className="account-nav-drop-ico">🌸</span> Hoạt hình
                </Link>
                <Link
                  to="/search"
                  search={{ q: "võ thuật", source: "all" }}
                  className="account-nav-drop-link"
                >
                  <span className="account-nav-drop-ico">🥋</span> Võ thuật
                </Link>
                <Link
                  to="/search"
                  search={{ q: "học đường", source: "all" }}
                  className="account-nav-drop-link"
                >
                  <span className="account-nav-drop-ico">🏫</span> Học đường
                </Link>
              </div>
            </div>
          </div>
          <div className="account-nav-item">
            <button type="button" className="account-nav-btn">
              ◉ Quốc gia <span className="account-nav-arrow">▾</span>
            </button>
            <div className="account-nav-dropdown">
              <div className="account-nav-drop-head">Khu vực</div>
              <Link
                to="/search"
                search={{ q: "trung quốc", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">🇨🇳</span> Trung Quốc
              </Link>
              <Link
                to="/search"
                search={{ q: "hàn quốc", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">🇰🇷</span> Hàn Quốc
              </Link>
              <Link
                to="/search"
                search={{ q: "âu mỹ", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">🇺🇸</span> Âu Mỹ
              </Link>
              <Link
                to="/search"
                search={{ q: "nhật bản", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">🇯🇵</span> Nhật Bản
              </Link>
              <Link
                to="/search"
                search={{ q: "thái lan", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">🇹🇭</span> Thái Lan
              </Link>
              <Link
                to="/search"
                search={{ q: "việt nam", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">🇻🇳</span> Việt Nam
              </Link>
            </div>
          </div>
          <div className="account-nav-item">
            <button type="button" className="account-nav-btn">
              ✨ Khám phá <span className="account-nav-arrow">▾</span>
            </button>
            <div className="account-nav-dropdown">
              <div className="account-nav-drop-head">Tuyển chọn</div>
              <Link
                to="/search"
                search={{ q: "anime", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">♨</span> Anime & Manga
              </Link>
              <Link
                to="/search"
                search={{ q: "tv show", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">▭</span> TV Show & Truyền hình
              </Link>
              <Link
                to="/search"
                search={{ q: "top", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">☆</span> Top phim thịnh hành
              </Link>
              <Link
                to="/search"
                search={{ q: "chiếu rạp", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">🎬</span> Phim chiếu rạp hot
              </Link>
              <Link
                to="/search"
                search={{ q: "mới", source: "all" }}
                className="account-nav-drop-link"
              >
                <span className="account-nav-drop-ico">⚡</span> Phim mới cập nhật
              </Link>
            </div>
          </div>
        </nav>
        <form
          className="account-search-wrap"
          onSubmit={(event) => {
            event.preventDefault();
            if (search.trim())
              void navigate({ to: "/search", search: { q: search.trim(), source: "all" } });
          }}
        >
          <Search className="account-search-icon" />
          <input
            aria-label="Tìm phim"
            className="account-search"
            placeholder="Tìm phim..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>
        <button
          type="button"
          className="account-avatar-button"
          aria-label="Cài đặt tài khoản"
          onClick={() => setActiveTab("settings")}
        >
          <img src={avatar} alt="" className="account-top-avatar" />
        </button>
      </header>
      <section className="account-hero">
        <div className="account-profile">
          <div className="account-avatar-wrap">
            <img className="account-avatar" src={avatar} alt="Ảnh đại diện" />
            <button
              type="button"
              disabled={!profileReady}
              className="account-camera-btn"
              aria-label="Đổi ảnh đại diện"
              onClick={() => {
                setActiveTab("settings");
                fileInput.current?.click();
              }}
            >
              <Camera />
            </button>
          </div>
          <div className="account-profile-info">
            <div className="account-name-row">
              <h1 className="account-name">{profile.displayName || "Đang tải hồ sơ..."}</h1>
              {badge}
            </div>
            <div className="account-handle">{user.email}</div>
            <p className="account-bio">{profile.bio || "Chưa có giới thiệu."}</p>
            <div className="account-meta">
              {profile.country && <span>{profile.country}</span>}
              <span>
                Ngày tham gia:{" "}
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString("vi-VN")
                  : "Chưa có dữ liệu"}
              </span>
            </div>
            <div className="account-stats">
              <div>
                <b>{favorites.length}</b>
                <span>Phim yêu thích trên máy</span>
              </div>
              <div>
                <b>{history?.length ?? "—"}</b>
                <span>Phim trong lịch sử gần đây</span>
              </div>
              <div>
                <b>{unlocked ?? "—"}</b>
                <span>Huy hiệu đã đạt</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (
            !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) ||
            file.size > 3 * 1024 * 1024
          ) {
            setMessage("Chọn ảnh PNG, JPEG, WebP, GIF tối đa 3MB.");
            return;
          }
          const reader = new FileReader();
          reader.onerror = () => setMessage("Không đọc được ảnh.");
          reader.onload = () => {
            if (typeof reader.result === "string") {
              field("avatarUrl", reader.result);
              setMessage("Ảnh đã chọn. Bấm Lưu để hoàn tất.");
            }
          };
          reader.readAsDataURL(file);
        }}
      />
      <div className="account-page-layout">
        <aside className="account-side">
          <nav className="account-side-nav" aria-label="Tài khoản">
            {Object.entries(TABS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`account-side-link ${activeTab === key ? "active" : ""}`}
                aria-current={activeTab === key ? "page" : undefined}
                data-library={["favorites", "activity", "stats"].includes(key) || undefined}
                onClick={() => setActiveTab(key as Tab)}
              >
                {key === "favorites" && <Heart size={16} aria-hidden="true" />}
                {key === "activity" && <History size={16} aria-hidden="true" />}
                {key === "stats" && <ChartNoAxesCombined size={16} aria-hidden="true" />}
                {label}
              </button>
            ))}
            {membership.kind === "admin" || membership.kind === "deputy_admin" ? (
              <Link to="/admin" className="account-side-link">
                Trang quản trị
              </Link>
            ) : null}
            <button
              type="button"
              className="account-side-link"
              disabled={busy}
              onClick={() => void logout()}
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </nav>
          <div className="account-side-quote">
            “Một bộ phim hay luôn tìm được người xứng đáng để xem nó.”<span>— Mochi Film</span>
          </div>
        </aside>
        <main className="account-main">
          <nav className="account-tabs" aria-label="Mục tài khoản">
            {Object.entries(TABS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-current={activeTab === key ? "page" : undefined}
                className={`account-tab-btn ${activeTab === key ? "active" : ""}`}
                data-library={["favorites", "activity", "stats"].includes(key) || undefined}
                onClick={() => setActiveTab(key as Tab)}
              >
                {key === "favorites" && <Heart size={16} aria-hidden="true" />}
                {key === "activity" && <History size={16} aria-hidden="true" />}
                {key === "stats" && <ChartNoAxesCombined size={16} aria-hidden="true" />}
                {label}
              </button>
            ))}
          </nav>
          {message && (
            <p className="account-card" role="status">
              {message}
            </p>
          )}
          {(activeTab === "overview" || activeTab === "membership") && (
            <section className="account-card">
              <h3>Gói thành viên</h3>
              {badge}
              <p>{membership.detail}</p>
              {membership.kind === "member" && (
                <p>Chưa có gói VIP đang hoạt động. VIP hiện do Admin kích hoạt thủ công.</p>
              )}
              {membership.kind === "vip" && (
                <p>Trạng thái VIP được xác nhận từ tài khoản; tự hết hiệu lực khi hết hạn.</p>
              )}
              {membership.kind === "member" && (
                <form onSubmit={redeemPromocode} className="account-settings-form">
                  <div className="account-form-field">
                    <label htmlFor="account-promocode">Nhập promocode</label>
                    <input id="account-promocode" className="account-form-input" value={promocode} onChange={(event) => setPromocode(event.target.value.toUpperCase())} minLength={6} maxLength={32} autoComplete="off" required placeholder="MOCHI-XXXXXXXXXXXX" />
                  </div>
                  <button type="submit" className="account-save-btn" disabled={busy}>Kích hoạt VIP</button>
                </form>
              )}
            </section>
          )}
          {activeTab === "overview" && (
            <div className="account-two-col">
              {favoritesPanel}
              {historyPanel}
            </div>
          )}
          {activeTab === "favorites" && favoritesPanel}
          {activeTab === "activity" && historyPanel}
          {activeTab === "stats" && (
            <section className="account-card account-library-panel">
              <div className="account-library-heading"><ChartNoAxesCombined aria-hidden="true" /><div><h3>Góc nhìn điện ảnh</h3><p>Thống kê từ dữ liệu thực đã lưu của bạn.</p></div></div>
              <div className="account-library-metrics">
                <div><Heart aria-hidden="true" /><strong>{favorites.length}</strong><h4>Phim yêu thích</h4><p>Đã lưu trên trình duyệt này</p></div>
                <div><History aria-hidden="true" /><strong>{history?.length ?? "—"}</strong><h4>Lịch sử gần đây</h4><p>{history === undefined ? "Đang tải dữ liệu đồng bộ" : "Tối đa 60 phim được đồng bộ"}</p></div>
                <div><Crown aria-hidden="true" /><strong>{unlocked ?? "—"}</strong><h4>Huy hiệu đã đạt</h4><p>{achievementError || (achievements === null ? "Đang tải huy hiệu" : "Thành tích từ tài khoản của bạn")}</p></div>
              </div>
              <p className="account-library-note">Chưa có dữ liệu tổng thời gian xem. Vị trí phát không được tính thành thời gian đã xem.</p>
            </section>
          )}
          {activeTab === "badges" && (
            <section className="account-card">
              <div className="account-title-row">
                <h3>Huy hiệu</h3>
                {badge}
              </div>
              {achievementError ? (
                <p role="alert">{achievementError}</p>
              ) : achievements === null ? (
                <p>Đang tải huy hiệu...</p>
              ) : (
                <div className="account-badges-grid">
                  {achievements.map((item) => (
                    <div
                      key={item.key}
                      className={`account-badge-card ${item.unlockedAt ? "unlocked" : "locked"}`}
                    >
                      <div className="account-badge-title">{item.title}</div>
                      <p className="account-badge-desc">{item.description}</p>
                      <span>
                        {item.unlockedAt ? "Đã đạt" : `${item.progress} / ${item.target}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          {activeTab === "settings" && (
            <section className="account-card">
              <h3>Cài đặt tài khoản & Hồ sơ</h3>
              <form className="account-settings-form" onSubmit={saveProfile}>
                <fieldset disabled={busy || !profileReady} className="account-profile-fields">
                  {(
                    [
                      ["displayName", "Tên hiển thị", "text", 80],
                      ["avatarUrl", "URL ảnh đại diện HTTPS", "text", 4194304],
                      ["phone", "Số điện thoại", "tel", 30],
                      ["country", "Quốc gia", "text", 80],
                      ["birthday", "Ngày sinh", "date", 10],
                    ] as const
                  ).map(([key, label, type, maxLength]) => (
                    <div className="account-form-field" key={key}>
                      <label htmlFor={`account-${key}`}>{label}</label>
                      <input
                        id={`account-${key}`}
                        className="account-form-input"
                        type={type}
                        maxLength={maxLength}
                        required={key === "displayName"}
                        value={
                          key === "avatarUrl" && profile.avatarUrl.startsWith("data:")
                            ? ""
                            : profile[key]
                        }
                        placeholder={
                          key === "avatarUrl" && profile.avatarUrl.startsWith("data:")
                            ? "Ảnh đã tải lên từ thiết bị"
                            : undefined
                        }
                        onChange={(event) => field(key, event.target.value)}
                      />
                    </div>
                  ))}
                  <div className="account-form-field">
                    <label htmlFor="account-gender">Giới tính</label>
                    <select
                      id="account-gender"
                      className="account-form-input"
                      value={profile.gender}
                      onChange={(event) => field("gender", event.target.value)}
                    >
                      {["", "Nam", "Nữ", "Khác", "Không chia sẻ"].map((value) => (
                        <option key={value} value={value}>
                          {value || "Chưa cập nhật"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="account-form-field">
                    <label htmlFor="account-bio">Tiểu sử</label>
                    <textarea
                      id="account-bio"
                      className="account-form-input"
                      maxLength={200}
                      value={profile.bio}
                      onChange={(event) => field("bio", event.target.value)}
                    />
                  </div>
                  <button type="submit" className="account-save-btn">
                    <Save size={17} />
                    {busy ? "Đang lưu..." : "Lưu chỉnh sửa hồ sơ"}
                  </button>
                </fieldset>
              </form>
            </section>
          )}
          {activeTab === "security" && (
            <section className="account-card">
              <h3>Bảo mật</h3>
              <p>Email: {user.email}</p>
              <p>
                Đăng nhập gần nhất:{" "}
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString("vi-VN")
                  : "Chưa có dữ liệu"}
              </p>
              <form onSubmit={changePassword} className="account-settings-form">
                <div className="account-form-field">
                  <label htmlFor="account-password">Mật khẩu mới</label>
                  <input
                    id="account-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="account-form-input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <button className="account-save-btn" disabled={busy} type="submit">
                  Đổi mật khẩu
                </button>
              </form>
              <button
                className="account-card-btn"
                type="button"
                disabled={busy}
                onClick={() => void logout(true)}
              >
                Đăng xuất các phiên khác
              </button>
              <p>Không hiển thị danh sách thiết bị vì nhà cung cấp chưa cung cấp dữ liệu này.</p>
            </section>
          )}
        </main>
      </div>
      <footer className="account-footer">
        <Link to="/" className="account-brand">
          <img src="/assets/mochi/wordmark.webp" alt="Mochi Film" className="wordmark-img" />
        </Link>
        <Link to="/legal">Điều khoản & Chính sách bảo mật</Link>
      </footer>
      <MobileBottomDock />
    </div>
  );
}
