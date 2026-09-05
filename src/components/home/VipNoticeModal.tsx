import React from "react";
import { Crown, X, AlertCircle } from "lucide-react";

interface VipNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VipNoticeModal: React.FC<VipNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md p-6 rounded-3xl bg-[#13131b] border border-pink-500/30 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-white">Gói Dịch Vụ Mochi VIP</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <span className="font-bold block text-amber-300 mb-0.5">Tính năng chưa khả dụng</span>
            Hệ thống chưa kết nối cổng thanh toán và backend phân quyền người dùng. Hiện tại toàn bộ kho phim được xem miễn phí từ các nguồn mở.
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Các tính năng VIP dự kiến: luồng phát 4K HDR tốc độ cao, phòng xem chung (Watch Party), và không quảng cáo. Chúng tôi sẽ thông báo ngay khi tích hợp hoàn chỉnh.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition cursor-pointer"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
};
