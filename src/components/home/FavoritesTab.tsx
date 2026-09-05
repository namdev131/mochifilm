import React from "react";
import { Heart, Trash2, Play, Film } from "lucide-react";
import type { MovieCard, SourceFilter, SourceId } from "@/lib/types";

interface FavoritesTabProps {
  favorites: MovieCard[];
  displayedFavorites: MovieCard[];
  selectedSource: SourceFilter;
  onSelectSource: (source: SourceFilter) => void;
  onOpenMovieDetail: (movie: { slug: string; source?: SourceId }) => void;
  onConfirmDeleteFavorite: (movie: MovieCard) => void;
  onConfirmClearAllFavorites: () => void;
  onNavigateHome: () => void;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = ({
  favorites,
  displayedFavorites,
  selectedSource,
  onSelectSource,
  onOpenMovieDetail,
  onConfirmDeleteFavorite,
  onConfirmClearAllFavorites,
  onNavigateHome,
}) => {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.05] pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-pink-500 fill-current" />
            <span>Danh Sách Phim Yêu Thích</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Các bộ phim bạn đã lưu lại qua nút "Danh sách của tôi". Dữ liệu lưu thật trên máy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Bộ chọn nguồn máy chủ nhanh trong Yêu thích */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Nguồn:</span>
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.08]">
              {(["all", "kkphim", "nguonc"] as SourceFilter[]).map((srcId) => {
                const active = selectedSource === srcId;
                return (
                  <button
                    key={srcId}
                    type="button"
                    onClick={() => onSelectSource(srcId)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      active
                        ? "bg-pink-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {srcId === "all" ? "Tất cả" : srcId === "kkphim" ? "KKPhim" : "NguonC"}
                  </button>
                );
              })}
            </div>
          </div>

          <span className="text-xs px-3 py-1 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 font-bold">
            {displayedFavorites.length} / {favorites.length} Phim
          </span>
          {favorites.length > 0 && (
            <button
              type="button"
              onClick={onConfirmClearAllFavorites}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
              title="Xóa toàn bộ danh sách yêu thích"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>
      </div>

      {displayedFavorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayedFavorites.map((movie) => (
            <div
              key={movie.slug}
              className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.06] hover:border-pink-500/50 transition duration-300 shadow-md hover:shadow-xl"
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={`Xem thông tin phim ${movie.name}`}
                onClick={() => onOpenMovieDetail(movie)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenMovieDetail(movie);
                  }
                }}
                className="relative aspect-[2/3] w-full cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-2xl"
              >
                <img
                  src={movie.poster || movie.thumb}
                  alt={movie.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                  <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center pink-glow">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-zinc-300 uppercase">
                    {movie.source}
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-1">
                <h4 className="text-xs font-bold text-zinc-100 truncate">{movie.name}</h4>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>{movie.year || "2026"}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmDeleteFavorite(movie);
                    }}
                    className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                    title="Xóa khỏi yêu thích"
                    aria-label={`Xóa ${movie.name} khỏi yêu thích`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="py-20 text-center space-y-3 bg-[#12121a]/50 rounded-3xl border border-white/[0.04]">
          <Film className="w-12 h-12 mx-auto text-zinc-600 stroke-[1.5]" />
          <h3 className="text-base font-bold text-zinc-300">
            Chưa có phim yêu thích từ nguồn {selectedSource === "all" ? "máy chủ này" : selectedSource.toUpperCase()}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Bạn có {favorites.length} phim đã lưu từ các nguồn khác. Hãy chọn "Tất cả" để xem toàn bộ danh sách yêu thích.
          </p>
          <button
            type="button"
            onClick={() => onSelectSource("all")}
            className="mt-2 px-5 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition cursor-pointer"
          >
            Xem tất cả nguồn ({favorites.length})
          </button>
        </div>
      ) : (
        <div className="py-24 text-center space-y-3 bg-[#12121a]/50 rounded-3xl border border-white/[0.04]">
          <Heart className="w-12 h-12 mx-auto text-zinc-600 stroke-[1.5]" />
          <h3 className="text-base font-bold text-zinc-300">Danh sách yêu thích đang trống</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Bạn chưa lưu phim nào. Khi xem phim, bấm nút "+ Danh sách của tôi" để lưu lại vào đây.
          </p>
          <button
            type="button"
            onClick={onNavigateHome}
            className="mt-2 px-5 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition cursor-pointer"
          >
            Khám phá phim ngay
          </button>
        </div>
      )}
    </section>
  );
};
