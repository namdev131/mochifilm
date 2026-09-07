import React from "react";
import { Server, X } from "lucide-react";
import type { SourceFilter } from "@/lib/types";
import { SOURCES } from "@/lib/api";

interface SourceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSource: SourceFilter;
  onSelectSource: (source: SourceFilter) => void;
  sourcePings: Record<string, number>;
}

export const SourceSelectorModal: React.FC<SourceSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedSource,
  onSelectSource,
  sourcePings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-[#12121a] border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Nguồn Phim Trực Tuyến</h3>
              <p className="text-xs text-zinc-400">
                Kiểm tra độ trễ (ping) và chuyển đổi máy chủ thực tế
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            aria-label="Đóng cửa sổ chọn nguồn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {/* Mục 1: Tất cả nguồn (Mặc định) */}
          <div
            onClick={() => {
              onSelectSource("all");
              onClose();
            }}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
              selectedSource === "all"
                ? "bg-pink-600/15 border-pink-500 text-white"
                : "bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <div>
                <p className="text-sm font-bold text-zinc-100">Tất cả nguồn (Gộp)</p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Tự động hợp nhất phim đa nguồn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-emerald-400">Auto-Merge</span>
              {selectedSource === "all" && (
                <span className="px-2 py-0.5 rounded-md bg-pink-500 text-white text-[10px] font-bold">
                  ĐANG CHỌN
                </span>
              )}
            </div>
          </div>

          {/* Các nguồn riêng lẻ */}
          {SOURCES.map((src) => {
            const isSelected = selectedSource === src.id;
            const ping = sourcePings[src.id];
            const isOnline = ping !== undefined && ping > 0;

            return (
              <div
                key={src.id}
                onClick={() => {
                  onSelectSource(src.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? "bg-pink-600/15 border-pink-500 text-white"
                    : "bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOnline ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-amber-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{src.label}</p>
                    <p className="text-[11px] text-zinc-400 font-mono">{src.base}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isOnline ? "text-emerald-400" : "text-zinc-400"
                    }`}
                  >
                    {ping !== undefined ? (ping > 0 ? `${ping}ms` : "Không phản hồi") : "Đo..."}
                  </span>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-md bg-pink-500 text-white text-[10px] font-bold">
                      ĐANG CHỌN
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center text-xs text-zinc-400">
          Độ trễ phản ánh thời gian kết nối thực tế đến API nhà phát hành.
        </div>
      </div>
    </div>
  );
};
