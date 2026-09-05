import React from "react";
import { Link } from "@tanstack/react-router";

interface PlayerMobileNavProps {
  onShowToast: (msg: string) => void;
}

export const PlayerMobileNav: React.FC<PlayerMobileNavProps> = ({ onShowToast }) => {
  return (
    <nav className="mobile-nav">
      <Link to="/" search={{ nav: "trang-chu" }} className="active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10.5V20h13v-9.5" />
        </svg>
        Trang chủ
      </Link>
      <Link to="/" search={{ nav: "phim-le" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m10 9 5 3-5 3z" />
        </svg>
        Phim
      </Link>
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById("joinPartyBtn") || document.getElementById("partyBtn");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            onShowToast("Tính năng Watch Party đang hoàn thiện");
          }
        }}
        aria-label="Watch Party"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 8h16v11H4z" />
          <path d="M8 5v6M16 5v6" />
        </svg>
        Party
      </button>
      <Link to="/" search={{ nav: "yeu-thich" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        Yêu thích
      </Link>
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById("commentInput");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus();
          } else {
            onShowToast("Tài khoản Mochi VIP");
          }
        }}
        aria-label="Tài khoản cá nhân"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.2-6 8-6s6.5 2 8 6" />
        </svg>
        Tôi
      </button>
    </nav>
  );
};
