import React from "react";
import { Link } from "@tanstack/react-router";
import type { MovieDetail, SourceId } from "@/lib/types";

interface DetailHeroProps {
  movie: MovieDetail;
  isFavorite: boolean;
  currentSource?: SourceId;
  activeServerIndex?: number;
  activeEpisodeIndex?: number;
  onToggleFavorite: () => void;
  onWatchNow?: () => void;
  onWatchTrailer: () => void;
  onWatchParty: () => void;
}

export const DetailHero: React.FC<DetailHeroProps> = ({
  movie,
  isFavorite,
  currentSource,
  activeServerIndex = 0,
  activeEpisodeIndex = 0,
  onToggleFavorite,
  onWatchNow,
  onWatchTrailer,
  onWatchParty,
}) => {
  const backdropUrl = movie.thumb || movie.poster;
  const hasRealRating =
    (movie as any).vote_average !== undefined && Number((movie as any).vote_average) > 0;
  const ratingValue = hasRealRating ? Number((movie as any).vote_average).toFixed(1) : null;

  const cleanSummary = movie.content
    ? movie.content
        .replace(/<[^>]*>?/gm, "")
        .trim()
        .slice(0, 280) + "..."
    : "Đang cập nhật thông tin tóm tắt nội dung bộ phim từ máy chủ nguồn...";

  return (
    <section className="hero">
      <div
        className="hero-bg-layer"
        style={{
          backgroundImage: backdropUrl ? `url("${backdropUrl}")` : undefined,
        }}
      />

      <div className="hero-inner">
        <div className="poster">
          <img
            src={movie.poster || movie.thumb}
            alt={movie.name}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'><rect width='300' height='450' fill='%23181016'/><text x='50%' y='50%' text-anchor='middle' fill='%23aa9ba5' font-size='14' font-family='sans-serif'>Hình ảnh đang tải</text></svg>";
            }}
          />
          {movie.quality && <span className="quality">{movie.quality}</span>}
          {ratingValue && <span className="rating">★ {ratingValue}</span>}
        </div>

        <div className="hero-copy">
          <h1>{movie.name}</h1>
          {movie.origin_name && <div className="subtitle">{movie.origin_name}</div>}

          <div className="meta">
            {ratingValue && <span className="tag rate">★ {ratingValue}</span>}
            {movie.year && <span className="tag">{movie.year}</span>}
            {movie.time && <span className="tag">{movie.time}</span>}
            {movie.category?.slice(0, 4).map((cat) => (
              <span key={cat} className="tag">
                {cat}
              </span>
            ))}
            {movie.episode_current && <span className="tag">{movie.episode_current}</span>}
            {movie.quality && <span className="tag">{movie.quality}</span>}
            {movie.lang && <span className="tag">{movie.lang}</span>}
          </div>

          <p>{cleanSummary}</p>

          <div className="hero-actions">
            <Link
              to="/watch/$slug"
              params={{ slug: movie.slug }}
              search={{
                source: currentSource || movie.source || "kkphim",
                ep: activeEpisodeIndex ?? 0,
                srv: activeServerIndex ?? 0,
              }}
              className="btn primary"
              id="watchNow"
              onClick={() => {
                if (typeof window !== "undefined" && (window as any).MochiLoader?.showMovie) {
                  (window as any).MochiLoader.showMovie(
                    movie.name,
                    currentSource || movie.source || "kkphim",
                  );
                }
                onWatchNow?.();
              }}
            >
              ▶ Xem ngay
            </Link>
            <button type="button" className="btn" id="watchTrailer" onClick={onWatchTrailer}>
              ▶ Xem trailer
            </button>
            <button
              type="button"
              className={`btn ${isFavorite ? "active-fav" : ""}`}
              id="favoriteBtn"
              onClick={onToggleFavorite}
            >
              {isFavorite ? "♥ Đã yêu thích" : "♡ Yêu thích"}
            </button>
            <button type="button" className="btn" id="partyBtn" onClick={onWatchParty}>
              ♧ Watch Party
            </button>
          </div>
        </div>
      </div>

      <img
        src="/assets/mochi/mascot-balloon.webp"
        className="mascot-balloon"
        alt="Mochi Mascot Balloon"
        loading="lazy"
      />
    </section>
  );
};
