import React from "react";
import { X, Play, Star, Tv, Check, Plus } from "lucide-react";
import type { MovieCard, MovieDetail, EpisodeServerItem } from "@/lib/types";

interface MoviePreviewModalProps {
  movie: MovieCard | null;
  activeStreamUrl: string | null;
  activeEpisodeName: string | null;
  previewDetail: MovieDetail | null;
  isLoadingDetail: boolean;
  favorites: MovieCard[];
  onClose: () => void;
  onSelectEpisode: (ep: EpisodeServerItem, srvIdx: number, epIdx: number) => void;
  onToggleFavorite: (movie: MovieCard) => void;
}

export const MoviePreviewModal: React.FC<MoviePreviewModalProps> = ({
  movie,
  activeStreamUrl,
  activeEpisodeName,
  previewDetail,
  isLoadingDetail,
  favorites,
  onClose,
  onSelectEpisode,
  onToggleFavorite,
}) => {
  if (!movie) return null;

  const isFavorite = favorites.some((f) => f.slug === movie.slug);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden bg-[#111118] border border-white/10 shadow-2xl my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/70 text-zinc-300 hover:text-white backdrop-blur-md border border-white/10 transition cursor-pointer"
          aria-label="Đóng cửa sổ xem trước"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player or Poster Banner */}
        {activeStreamUrl ? (
          <div className="relative w-full aspect-video bg-black">
            <iframe
              src={activeStreamUrl}
              title={movie.name}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen"
            />
          </div>
        ) : (
          <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-zinc-950">
            <img
              src={movie.thumb || movie.poster}
              alt={movie.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/60 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-600 text-white text-[10px] font-bold uppercase tracking-wider">
                {movie.quality || "Full HD"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {movie.name}
              </h3>
              {movie.origin_name && (
                <p className="text-xs text-pink-300 italic">{movie.origin_name}</p>
              )}
            </div>
          </div>
        )}

        {/* Movie Info & Real Episodes */}
        <div className="p-6 sm:p-8 space-y-6">
          {activeEpisodeName && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs text-pink-300">
              <Play className="w-4 h-4 text-pink-400 fill-current" />
              <span>Đang phát: <b>{activeEpisodeName}</b> • Tiến độ đã lưu vào Xem Tiếp</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
            {movie.vote_average !== undefined && movie.vote_average > 0 && (
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                {movie.vote_average}
              </span>
            )}
            <span>• Năm: {movie.year || "2026"}</span>
            <span>• Nguồn: <b className="uppercase text-pink-400">{movie.source}</b></span>
            <span>• {movie.episode_current || "Hoàn tất"}</span>
          </div>

          {/* Synopsis */}
          <p className="text-sm text-zinc-300 leading-relaxed">
            {previewDetail?.content
              ? previewDetail.content.replace(/<[^>]*>?/gm, "")
              : "Đang tải dữ liệu tóm tắt và danh sách tập phim từ máy chủ nguồn..."}
          </p>

          {/* Real Episode Servers from API */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Tv className="w-4 h-4 text-pink-400" />
                <span>Danh sách tập phim (Dữ liệu thật từ nguồn)</span>
              </h4>
              {isLoadingDetail && (
                <span className="text-xs text-pink-400 animate-pulse">Đang nạp tập...</span>
              )}
            </div>

            {previewDetail && previewDetail.servers.length > 0 ? (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {previewDetail.servers.map((server, srvIdx) => (
                  <div key={server.server_name || srvIdx} className="space-y-2">
                    <span className="text-xs text-zinc-400 font-semibold">
                      {server.server_name} ({server.items.length} tập):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {server.items.map((ep, epIdx) => {
                        const isPlaying = activeEpisodeName === ep.name;
                        return (
                          <button
                            key={ep.slug || epIdx}
                            type="button"
                            onClick={() => onSelectEpisode(ep, srvIdx, epIdx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              isPlaying
                                ? "bg-pink-600 text-white pink-glow-sm shadow-md"
                                : "bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.06]"
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{ep.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : !isLoadingDetail ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                Máy chủ <b>{movie.source}</b> chưa cung cấp danh sách tập hoặc liên kết phát trực tiếp cho phim này. Vui lòng chuyển đổi nguồn phim khác để tìm bản phát phù hợp.
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => onToggleFavorite(movie)}
              className={`py-2.5 px-5 rounded-2xl border font-semibold text-xs flex items-center gap-2 transition cursor-pointer ${
                isFavorite
                  ? "bg-pink-600/20 border-pink-500 text-pink-300"
                  : "bg-white/10 hover:bg-white/20 border-white/10 text-white"
              }`}
            >
              {isFavorite ? (
                <>
                  <Check className="w-4 h-4 text-pink-400" />
                  <span>Đã lưu vào yêu thích</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Thêm vào yêu thích</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
