import React from "react";
import { Link } from "@tanstack/react-router";
import type { MovieCard, SourceId } from "@/lib/types";

interface DetailRecommendationsProps {
  movies: MovieCard[];
  currentSource: SourceId;
  onShowToast?: (msg: string) => void;
}

export const DetailRecommendations: React.FC<DetailRecommendationsProps> = ({
  movies,
  currentSource,
  onShowToast,
}) => {
  // Only use real movies from API (max 6 items)
  const items = movies.slice(0, 6);

  return (
    <section className="recommend" id="suggestedPanel">
      <div className="section-head">
        <h2>⭐ Phim đề xuất từ nguồn {currentSource.toUpperCase()}</h2>
        {items.length > 0 && (
          <Link
            to="/"
            search={{ nav: "phim-moi" }}
            onClick={() => onShowToast?.("Khám phá danh sách phim mới nhất")}
          >
            Xem tất cả ›
          </Link>
        )}
      </div>

      {items.length > 0 ? (
        <div className="movie-row" id="movieRow">
          {items.map((m, idx) => (
            <Link
              key={`${m.source || currentSource}-${m.slug}-${idx}`}
              to="/movie/$slug"
              params={{ slug: m.slug }}
              search={{ source: m.source || currentSource }}
              className="movie"
              data-title={m.name}
              onClick={() => {
                if (typeof window !== "undefined" && (window as any).MochiLoader?.showMovie) {
                  (window as any).MochiLoader.showMovie(m.name || m.slug, m.source || currentSource);
                }
                onShowToast?.(`Mở chi tiết: ${m.name}`);
              }}
            >
              <div className="movie-poster">
                <img
                  src={m.thumb || m.poster}
                  alt={m.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'><rect width='300' height='450' fill='%23181016'/><text x='50%' y='50%' text-anchor='middle' fill='%23aa9ba5' font-size='14' font-family='sans-serif'>Hình ảnh đang tải</text></svg>";
                  }}
                />
                {m.quality && <span className="badge">{m.quality}</span>}
                {m.vote_average !== undefined && m.vote_average > 0 && (
                  <span className="score">★ {m.vote_average.toFixed(1)}</span>
                )}
              </div>
              <div className="movie-info">
                <h3>{m.name}</h3>
                <p>
                  {[m.year, m.episode_current || m.lang].filter(Boolean).join(" · ") || "Phim"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "36px 16px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 13,
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--line)",
          }}
        >
          Đang nạp danh sách phim đề xuất từ máy chủ nguồn...
        </div>
      )}
    </section>
  );
};
