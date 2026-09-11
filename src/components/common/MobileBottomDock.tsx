import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Film, Users, Heart, UserRound } from "lucide-react";

export type MobileDockTab = "trang-chu" | "phim" | "party" | "yeu-thich" | "toi";

export interface MobileBottomDockProps {
  activeTab?: MobileDockTab;
  onTabSelect?: (tab: MobileDockTab) => void;
  onPartyClick?: () => void;
  onShowToast?: (msg: string) => void;
  className?: string;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  activeTab,
  onTabSelect,
  onPartyClick,
  onShowToast,
  className = "",
}) => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const searchParams = new URLSearchParams(routerState.location.searchStr);
  const currentNav = searchParams.get("nav") || "trang-chu";

  // Determine active tab if not explicitly provided
  const resolvedActiveTab: MobileDockTab =
    activeTab ||
    (currentPath === "/account"
      ? "toi"
      : currentNav === "yeu-thich"
        ? "yeu-thich"
        : currentNav === "watch-party" || searchParams.has("party")
          ? "party"
          : currentNav === "phim-le" || currentNav === "phim-bo" || currentNav === "the-loai"
            ? "phim"
            : "trang-chu");

  const handlePartyClick = (e: React.MouseEvent) => {
    if (onPartyClick) {
      e.preventDefault();
      onPartyClick();
    } else if (onTabSelect) {
      e.preventDefault();
      onTabSelect("party");
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Điều hướng chính di động"
      className={`fixed z-50 left-3 right-3 max-w-lg mx-auto h-[62px] px-2 py-1.5 rounded-2xl bg-[#171016]/92 backdrop-blur-2xl border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.65)] grid grid-cols-5 items-center justify-around lg:hidden transition-all duration-300 ${className}`}
      style={{
        bottom: "max(10px, env(safe-area-inset-bottom, 10px))",
      }}
    >
      {/* 1. Trang chủ */}
      {onTabSelect ? (
        <button
          type="button"
          onClick={() => onTabSelect("trang-chu")}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-200 cursor-pointer ${
            resolvedActiveTab === "trang-chu"
              ? "text-pink-400 font-bold bg-pink-500/15 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 font-medium"
          }`}
        >
          <Compass className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[11px] leading-none">Trang chủ</span>
        </button>
      ) : (
        <Link
          to="/"
          search={{ nav: "trang-chu" }}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-200 no-underline cursor-pointer ${
            resolvedActiveTab === "trang-chu"
              ? "text-pink-400 font-bold bg-pink-500/15 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 font-medium"
          }`}
        >
          <Compass className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[11px] leading-none">Trang chủ</span>
        </Link>
      )}

      {/* 2. Phim */}
      {onTabSelect ? (
        <button
          type="button"
          onClick={() => onTabSelect("phim")}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-200 cursor-pointer ${
            resolvedActiveTab === "phim"
              ? "text-pink-400 font-bold bg-pink-500/15 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 font-medium"
          }`}
        >
          <Film className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[11px] leading-none">Phim</span>
        </button>
      ) : (
        <Link
          to="/"
          search={{ nav: "phim-le" }}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-200 no-underline cursor-pointer ${
            resolvedActiveTab === "phim"
              ? "text-pink-400 font-bold bg-pink-500/15 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 font-medium"
          }`}
        >
          <Film className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[11px] leading-none">Phim</span>
        </Link>
      )}

      {/* 3. Watch Party */}
      {onPartyClick || onTabSelect ? (
        <button
          type="button"
          onClick={handlePartyClick}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-200 cursor-pointer ${
            resolvedActiveTab === "party"
              ? "text-pink-400 font-bold bg-pink-500/15 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 font-medium"
          }`}
        >
          <Users className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[11px] leading-none">Party</span>
        </button>
      ) : (
        <Link
          to="/"
          search={{ nav: "watch-party" }}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-200 no-underline cursor-pointer ${
            resolvedActiveTab === "party"
              ? "text-pink-400 font-bold bg-pink-500/15 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 font-medium"
          }`}
        >
          <Users className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[11px] leading-none">Party</span>
        </Link>
      )}

      {/* 4. Yêu thích */}
      {onTabSelect ? (
        <button
          type="button"
          onClick={() => onTabSelect("yeu-thich")}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-200 cursor-pointer ${
            resolvedActiveTab === "yeu-thich"
              ? "text-pink-400 font-bold bg-pink-500/15 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 font-medium"
          }`}
        >
          <Heart className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[11px] leading-none">Yêu thích</span>
        </button>
      ) : (
        <Link
          to="/"
          search={{ nav: "yeu-thich" }}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-200 no-underline cursor-pointer ${
            resolvedActiveTab === "yeu-thich"
              ? "text-pink-400 font-bold bg-pink-500/15 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 font-medium"
          }`}
        >
          <Heart className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[11px] leading-none">Yêu thích</span>
        </Link>
      )}

      {/* 5. Tôi (Tài khoản) */}
      <Link
        to="/account"
        className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-200 no-underline cursor-pointer ${
          resolvedActiveTab === "toi"
            ? "text-pink-400 font-bold bg-pink-500/15 shadow-sm"
            : "text-zinc-400 hover:text-zinc-200 font-medium"
        }`}
      >
        <UserRound className="w-5 h-5 transition-transform duration-200" />
        <span className="text-[11px] leading-none">Tôi</span>
      </Link>
    </nav>
  );
};
