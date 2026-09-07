import React from "react";
import { Clock, Trash2, Play, Film } from "lucide-react";
import type { SourceFilter, SourceId } from "@/lib/types";

export interface ContinueWatchItem {
  slug: string;
  name: string;
  origin_name?: string;
  thumb: string;
  poster?: string;
  episode_name: string;
  progressPercent: number;
  durationLeft: string;
  source: SourceId;
  positionSeconds?: number;
  durationSeconds?: number;
  epIndex?: number;
  srvIndex?: number;
  updatedAt?: number;
}

interface HistoryTabProps {
  continueList: ContinueWatchItem[];
  displayedContinueList: ContinueWatchItem[];
  selectedSource: SourceFilter;
  onSelectSource: (source: SourceFilter) => void;
  onOpenMovieDetail: (movie: { slug: string; source?: SourceId }) => void;
  onConfirmDeleteHistoryItem: (item: ContinueWatchItem) => void;
  onConfirmClearAllHistory: () => void;
  onNavigateHome: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  continueList,
  displayedContinueList,
  selectedSource,
  onSelectSource,
  onOpenMovieDetail,
  onConfirmDeleteHistoryItem,
  onConfirmClearAllHistory,
  onNavigateHome,
}) => {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.05] pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-pink-400" />
            <span>Lịch Sử Xem Phim Thật</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Ghi nhận trực tiếp từ các tập phim bạn đang xem dở trên trình phát.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Bộ chọn nguồn máy chủ nhanh trong Lịch sử */}
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
            {displayedContinueList.length} / {continueList.length} Phim
          </span>

          {continueList.length > 0 && (
            <button
              type="button"
              onClick={onConfirmClearAllHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa lịch sử</span>
            </button>
          )}
        </div>
      </div>

      {displayedContinueList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedContinueList.map((item) => (
            <div
              key={item.slug}
              onClick={() => onOpenMovieDetail(item)}
              className="group relative rounded-2xl overflow-hidden bg-[#12121a] border border-white/[0.06] hover:border-pink-500/50 transition duration-300 cursor-pointer shadow-md"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                <img
                  src={item.thumb}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                  <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center pink-glow-sm">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-zinc-300 uppercase">
                    {item.source}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                    {item.episode_name}
                  </span>
                </div>
                {/* Real progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800/80">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-r-full"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-zinc-100 group-hover:text-pink-400 transition truncate flex-1">
                    {item.name}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmDeleteHistoryItem(item);
                    }}
                    className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0 cursor-pointer"
                    title="Xóa khỏi lịch sử"
                    aria-label={`Xóa ${item.name} khỏi lịch sử`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{item.durationLeft}</span>
                  <span className="text-[11px] font-semibold text-pink-400">
                    {item.progressPercent}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : continueList.length > 0 ? (
        <div className="py-20 text-center space-y-3 bg-[#12121a]/50 rounded-3xl border border-white/[0.04]">
          <Film className="w-12 h-12 mx-auto text-zinc-600 stroke-[1.5]" />
          <h3 className="text-base font-bold text-zinc-300">
            Chưa có lịch sử xem từ nguồn{" "}
            {selectedSource === "all" ? "máy chủ này" : selectedSource.toUpperCase()}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Bạn có {continueList.length} tập phim đang xem dở từ nguồn khác. Chọn "Tất cả" để tiếp
            tục xem.
          </p>
          <button
            type="button"
            onClick={() => onSelectSource("all")}
            className="mt-2 px-5 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition cursor-pointer"
          >
            Xem tất cả nguồn ({continueList.length})
          </button>
        </div>
      ) : (
        <div className="py-24 text-center space-y-3 bg-[#12121a]/50 rounded-3xl border border-white/[0.04]">
          <Clock className="w-12 h-12 mx-auto text-zinc-600 stroke-[1.5]" />
          <h3 className="text-base font-bold text-zinc-300">Chưa có lịch sử xem</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Hệ thống không tạo tiến độ ảo. Lịch sử xem phim và tiến độ từng tập sẽ được ghi lại tự
            động khi bạn bắt đầu xem một tập phim bất kỳ.
          </p>
          <button
            type="button"
            onClick={onNavigateHome}
            className="mt-2 px-5 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition cursor-pointer"
          >
            Xem phim ngay
          </button>
        </div>
      )}
    </section>
  );
};
