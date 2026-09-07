import React, { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Compass,
  Flame,
  Film,
  Tv,
  Clapperboard,
  Sparkles,
  Layers,
  Globe,
  Heart,
  Clock,
  Server,
  Crown,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { NAVBAR_GENRES, NAVBAR_COUNTRIES } from "@/lib/navConstants";

interface DetailSidebarProps {
  onShowToast?: (msg: string) => void;
  currentSource?: string;
}

export const DetailSidebar: React.FC<DetailSidebarProps> = ({
  onShowToast,
  currentSource = "all",
}) => {
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  const genreRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);

  // Sync favorites and history counts from localStorage
  useEffect(() => {
    const updateCounts = () => {
      try {
        const favRaw = localStorage.getItem("lv-favorites");
        if (favRaw) {
          const favList = JSON.parse(favRaw);
          setFavoriteCount(Array.isArray(favList) ? favList.length : 0);
        } else {
          setFavoriteCount(0);
        }
      } catch {
        setFavoriteCount(0);
      }

      try {
        const histRaw = localStorage.getItem("lv-progress");
        if (histRaw) {
          const histObj = JSON.parse(histRaw);
          setHistoryCount(typeof histObj === "object" && histObj ? Object.keys(histObj).length : 0);
        } else {
          setHistoryCount(0);
        }
      } catch {
        setHistoryCount(0);
      }
    };

    updateCounts();
    window.addEventListener("storage", updateCounts);
    return () => window.removeEventListener("storage", updateCounts);
  }, []);

  // Click outside and Escape key handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setShowGenreDropdown(false);
      }
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowGenreDropdown(false);
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const displaySource =
    currentSource === "all"
      ? "Tất cả"
      : currentSource === "kkphim"
        ? "KKPhim"
        : currentSource === "nguonc"
          ? "NguonC"
          : currentSource;

  return (
    <aside className="sidebar fixed top-0 bottom-0 left-0 z-50 w-[268px] min-w-[268px] max-w-[268px] flex flex-col justify-between bg-[#0e0e14]/95 backdrop-blur-2xl border-r border-white/[0.06] transition-transform duration-300 ease-in-out">
      {/* 1. Logo Wordmark */}
      <div className="wordmark flex items-center justify-between px-3 sm:px-5 py-3.5 border-b border-white/[0.04]">
        <Link
          to="/"
          search={{ nav: "trang-chu" }}
          className="flex items-center justify-center cursor-pointer group flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-xl"
          aria-label="Về trang chủ Mochi Film"
        >
          <div className="flex items-center justify-center h-[60px] lg:h-[82px] w-full">
            <img
              src="/assets/mochi/wordmark.webp"
              alt="Mochi Film"
              className="w-[72px] h-[58px] lg:w-[205px] lg:h-[78px] max-w-full object-contain drop-shadow-[0_8px_16px_rgba(255,79,131,0.16)] group-hover:drop-shadow-[0_10px_20px_rgba(255,79,131,0.24)] group-hover:scale-[1.015] transition-all duration-200"
            />
          </div>
        </Link>
      </div>

      {/* 2. Navigation Items (Scrollable middle) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-4 no-scrollbar">
        {/* MENU CHÍNH */}
        <div>
          <p className="px-3 mb-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Menu chính
          </p>
          <nav className="side-nav space-y-1">
            {/* 1. Trang chủ */}
            <Link
              to="/"
              search={{ nav: "trang-chu" }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
            >
              <Compass className="w-4 h-4 transition duration-200 text-zinc-400 group-hover:text-pink-400" />
              <span>Trang chủ</span>
            </Link>

            {/* 2. Phim mới */}
            <Link
              to="/"
              search={{ nav: "phim-moi" }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
            >
              <Flame className="w-4 h-4 transition duration-200 text-zinc-400 group-hover:text-pink-400" />
              <span>Phim mới</span>
            </Link>

            {/* 3. Phim lẻ */}
            <Link
              to="/"
              search={{ nav: "phim-le" }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
            >
              <Film className="w-4 h-4 transition duration-200 text-zinc-400 group-hover:text-pink-400" />
              <span>Phim lẻ</span>
            </Link>

            {/* 4. Phim bộ */}
            <Link
              to="/"
              search={{ nav: "phim-bo" }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
            >
              <Tv className="w-4 h-4 transition duration-200 text-zinc-400 group-hover:text-pink-400" />
              <span>Phim bộ</span>
            </Link>

            {/* 5. Chiếu rạp */}
            <Link
              to="/"
              search={{ nav: "chieu-rap" }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
            >
              <Clapperboard className="w-4 h-4 transition duration-200 text-zinc-400 group-hover:text-pink-400" />
              <span>Chiếu rạp</span>
            </Link>

            {/* 6. Hoạt hình */}
            <Link
              to="/"
              search={{ nav: "hoat-hinh" }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
            >
              <Sparkles className="w-4 h-4 transition duration-200 text-zinc-400 group-hover:text-pink-400" />
              <span>Hoạt hình</span>
            </Link>

            {/* 7. Thể Loại Dropdown */}
            <div ref={genreRef} className="relative">
              <button
                id="genre-dropdown-trigger"
                type="button"
                aria-haspopup="true"
                aria-expanded={showGenreDropdown}
                aria-controls="genre-dropdown-menu"
                onClick={() => {
                  setShowGenreDropdown(!showGenreDropdown);
                  setShowCountryDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  showGenreDropdown
                    ? "text-white bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border-l-[3px] border-pink-500 shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Layers
                    className={`w-4 h-4 transition duration-200 shrink-0 ${
                      showGenreDropdown
                        ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                        : "text-zinc-400 group-hover:text-pink-400"
                    }`}
                  />
                  <span className="truncate">Thể loại</span>
                </div>
                {showGenreDropdown ? (
                  <ChevronUp className="w-4 h-4 text-zinc-300 shrink-0 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
                )}
              </button>

              {showGenreDropdown && (
                <div
                  id="genre-dropdown-menu"
                  role="region"
                  aria-labelledby="genre-dropdown-trigger"
                  tabIndex={-1}
                  className="mt-2 p-3 rounded-2xl bg-[#12131b]/98 border border-white/[0.08] shadow-xl shadow-black/80 animate-in fade-in duration-150"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pb-2 mb-2 border-b border-white/[0.06] flex items-center justify-between">
                    <span>THỂ LOẠI PHIM</span>
                    <Link
                      to="/"
                      search={{ nav: "trang-chu" }}
                      aria-label="Đặt lại thể loại, phục hồi danh sách"
                      className="text-[10px] text-pink-400 hover:text-pink-300 font-semibold cursor-pointer flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 rounded px-1.5 py-0.5 bg-pink-500/10 hover:bg-pink-500/20 transition"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Đặt lại</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5" role="menu">
                    {NAVBAR_GENRES.map((g) => {
                      const Icon = g.icon;
                      return (
                        <Link
                          key={g.name}
                          to="/"
                          search={{ nav: "the-loai", genre: g.name }}
                          role="menuitem"
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition cursor-pointer group text-zinc-300 hover:text-white hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                        >
                          <Icon className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-300 group-hover:scale-110 transition-transform shrink-0" />
                          <span className="text-xs truncate">{g.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 8. Quốc Gia Dropdown */}
            <div ref={countryRef} className="relative">
              <button
                id="country-dropdown-trigger"
                type="button"
                aria-haspopup="true"
                aria-expanded={showCountryDropdown}
                aria-controls="country-dropdown-menu"
                onClick={() => {
                  setShowCountryDropdown(!showCountryDropdown);
                  setShowGenreDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  showCountryDropdown
                    ? "text-white bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent border-l-[3px] border-pink-500 shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Globe
                    className={`w-4 h-4 transition duration-200 shrink-0 ${
                      showCountryDropdown
                        ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                        : "text-zinc-400 group-hover:text-pink-400"
                    }`}
                  />
                  <span className="truncate">Quốc gia</span>
                </div>
                {showCountryDropdown ? (
                  <ChevronUp className="w-4 h-4 text-zinc-300 shrink-0 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
                )}
              </button>

              {showCountryDropdown && (
                <div
                  id="country-dropdown-menu"
                  role="region"
                  aria-labelledby="country-dropdown-trigger"
                  tabIndex={-1}
                  className="mt-2 p-3 rounded-2xl bg-[#12131b]/98 border border-white/[0.08] shadow-xl shadow-black/80 animate-in fade-in duration-150"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pb-2 mb-2 border-b border-white/[0.06] flex items-center justify-between">
                    <span>PHIM THEO QUỐC GIA</span>
                    <Link
                      to="/"
                      search={{ nav: "trang-chu" }}
                      aria-label="Đặt lại quốc gia, phục hồi danh sách"
                      className="text-[10px] text-pink-400 hover:text-pink-300 font-semibold cursor-pointer flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 rounded px-1.5 py-0.5 bg-pink-500/10 hover:bg-pink-500/20 transition"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Đặt lại</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5" role="menu">
                    {NAVBAR_COUNTRIES.map((c) => (
                      <Link
                        key={c.code}
                        to="/"
                        search={{ nav: "quoc-gia", country: c.name }}
                        role="menuitem"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition cursor-pointer group text-zinc-300 hover:text-white hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                      >
                        <span className="text-xs font-bold tracking-wider w-6 shrink-0 text-zinc-400 group-hover:text-zinc-200">
                          {c.code}
                        </span>
                        <span className="text-xs truncate text-zinc-200 group-hover:text-white">
                          {c.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* BỘ SƯU TẬP */}
        <div>
          <p className="px-3 mb-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Bộ sưu tập
          </p>
          <nav className="space-y-1">
            <Link
              to="/"
              search={{ nav: "yeu-thich" }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-200 group text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-zinc-400 group-hover:text-pink-400" />
                <span>Yêu thích</span>
              </div>
              {favoriteCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  {favoriteCount}
                </span>
              )}
            </Link>

            <Link
              to="/"
              search={{ nav: "lich-su" }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-200 group text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-zinc-400 group-hover:text-pink-400" />
                <span>Lịch sử xem</span>
              </div>
              {historyCount > 0 && (
                <span className="text-[11px] text-zinc-400">{historyCount} phim</span>
              )}
            </Link>
          </nav>
        </div>

        {/* HỆ THỐNG */}
        <div>
          <p className="px-3 mb-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Hệ thống
          </p>
          <nav className="space-y-1">
            <Link
              to="/"
              search={{ nav: "trang-chu" }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] transition duration-200 group"
              onClick={() => onShowToast?.(`Đang kết nối nguồn phim ${displaySource}`)}
            >
              <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-zinc-400 group-hover:text-pink-400" />
                <span>Nguồn phim</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-mono text-emerald-400 uppercase">
                  {displaySource}
                </span>
              </div>
            </Link>
          </nav>
        </div>
      </div>

      {/* 3. Footer: Mascot Ghế + Mochi VIP / Mochi Premium Panel */}
      <div className="shrink-0 px-3 pb-3 pt-0.5 border-t border-white/[0.04] bg-[#0c0c12]/95 backdrop-blur-md">
        <div className="side-mascot relative flex items-end justify-center -mb-2 z-10 pointer-events-none select-none">
          <img
            src="/assets/mochi/mascot-chair.webp"
            alt="Mochi ngồi ghế"
            className="w-[110px] lg:w-[220px] max-h-[85px] sm:max-h-[95px] lg:max-h-[105px] object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.44)] mascot-floaty motion-reduce:animate-none"
          />
        </div>

        <div className="premium relative p-3 rounded-2xl bg-gradient-to-b from-pink-950/40 via-zinc-900/70 to-zinc-950/90 border border-pink-500/25 overflow-hidden shadow-lg shadow-pink-950/20 text-left">
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-pink-400" />
                <span className="font-extrabold text-xs text-white tracking-wide">
                  👑 Mochi Premium
                </span>
              </div>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Chưa nối backend
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
              Xem phim không quảng cáo với chất lượng cao nhất.
            </p>

            <button
              type="button"
              onClick={() => onShowToast?.("Gói Mochi Premium đang miễn phí trải nghiệm!")}
              className="mt-1 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>Nâng cấp ngay →</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
