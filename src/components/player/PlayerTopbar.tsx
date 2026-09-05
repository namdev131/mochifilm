import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { searchMoviesMerged } from "@/lib/api";
import type { MovieCard } from "@/lib/types";

interface PlayerTopbarProps {
  unreadCount?: number;
  onShowToast: (msg: string) => void;
}

export const PlayerTopbar: React.FC<PlayerTopbarProps> = ({
  unreadCount = 0,
  onShowToast,
}) => {
  const [searchVal, setSearchVal] = useState("");
  const [results, setResults] = useState<MovieCard[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounced Realtime Search across all movie providers
  useEffect(() => {
    const q = searchVal.trim();
    if (!q) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let isCurrent = true;
    setIsSearching(true);
    const timer = setTimeout(() => {
      searchMoviesMerged(q, "all")
        .then((res) => {
          if (isCurrent) {
            setResults(res.slice(0, 8));
          }
        })
        .catch(() => {
          if (isCurrent) {
            setResults([]);
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsSearching(false);
          }
        });
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchVal]);

  // Click outside and Escape key to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchVal.trim();
    if (!q) return;
    setShowDropdown(false);
    navigate({
      to: "/",
      search: { q },
    });
  };

  const handleSelectMovie = (movie: MovieCard) => {
    setShowDropdown(false);
    if (typeof window !== "undefined" && (window as any).MochiLoader?.showMovie) {
      (window as any).MochiLoader.showMovie(movie.name || movie.slug, movie.source || "kkphim");
    }
    navigate({
      to: "/watch/$slug",
      params: { slug: movie.slug },
      search: { source: movie.source || "kkphim" },
    });
  };

  const handleViewDetail = (e: React.MouseEvent, movie: MovieCard) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (typeof window !== "undefined" && (window as any).MochiLoader?.showMovie) {
      (window as any).MochiLoader.showMovie(movie.name || movie.slug, movie.source || "kkphim");
    }
    navigate({
      to: "/movie/$slug",
      params: { slug: movie.slug },
      search: { source: movie.source || "kkphim" },
    });
  };

  const handleClear = () => {
    setSearchVal("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <header className="topbar">
      <div className="search" ref={searchContainerRef}>
        <form onSubmit={handleSearch}>
          <input
            id="searchInput"
            placeholder="Tìm phim..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (searchVal.trim()) setShowDropdown(true);
            }}
            autoComplete="off"
          />
          {searchVal.trim() && (
            <button
              type="button"
              className="topbar-search-clear"
              onClick={handleClear}
              aria-label="Xóa tìm kiếm"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          <button type="submit" aria-label="Tìm kiếm">
            <svg width="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.3-3.3" />
            </svg>
          </button>
        </form>

        {/* Realtime Search Dropdown */}
        {showDropdown && searchVal.trim().length > 0 && (
          <div className="topbar-search-dropdown" role="region" aria-label="Gợi ý tìm kiếm">
            <div className="topbar-search-header">
              <span>Kết quả cho "{searchVal.trim()}"</span>
              {isSearching && (
                <span className="topbar-search-pulse">Đang tìm...</span>
              )}
            </div>

            <div className="topbar-search-list">
              {results.length > 0 ? (
                results.map((item) => (
                  <div
                    key={`${item.source}-${item.slug}`}
                    className="topbar-search-item"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectMovie(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectMovie(item);
                      }
                    }}
                  >
                    <img
                      src={item.thumb || item.poster || "/assets/mochi/mascot-mini.png"}
                      alt={item.name}
                      className="topbar-search-thumb"
                      loading="lazy"
                    />
                    <div className="topbar-search-meta">
                      <h4 className="topbar-search-title">{item.name}</h4>
                      <p className="topbar-search-origin">
                        {item.origin_name || item.name}
                      </p>
                      <div className="topbar-search-badges">
                        {item.year && (
                          <span className="topbar-search-badge">{item.year}</span>
                        )}
                        {item.quality && (
                          <span className="topbar-search-badge">{item.quality}</span>
                        )}
                        {item.episode_current && (
                          <span className="topbar-search-badge">{item.episode_current}</span>
                        )}
                        {item.source && (
                          <span className="topbar-search-badge source">{item.source}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        type="button"
                        className="topbar-search-info-btn"
                        onClick={(e) => handleViewDetail(e, item)}
                        title="Xem chi tiết"
                        aria-label={`Xem chi tiết phim ${item.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="topbar-search-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMovie(item);
                        }}
                        title="Xem ngay"
                        aria-label={`Xem ngay phim ${item.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="topbar-search-empty">
                  {isSearching
                    ? "Đang quét máy chủ phim..."
                    : "Không tìm thấy phim phù hợp"}
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div
                className="topbar-search-footer"
                role="button"
                tabIndex={0}
                onClick={handleSearch}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(e);
                }}
              >
                Xem tất cả kết quả cho "{searchVal.trim()}" ›
              </div>
            )}
          </div>
        )}
      </div>

      <div className="top-space" />
      <button
        type="button"
        className="icon-btn"
        aria-label="Thông báo"
        onClick={() => onShowToast(unreadCount > 0 ? `Bạn có ${unreadCount} thông báo mới` : "Chưa có thông báo mới")}
      >
        <svg width="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unreadCount > 0 && <b>{unreadCount}</b>}
      </button>
      <div
        className="user-mini cursor-pointer"
        aria-label="Đăng nhập / Tài khoản"
        onClick={() => navigate({ to: "/auth" })}
        role="button"
        tabIndex={0}
      >
        <img src="/assets/mochi/mascot-mini.png" alt="Tài khoản" />
      </div>
    </header>
  );
};
