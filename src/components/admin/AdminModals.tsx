import React from "react";
import { Plus, X, AlertTriangle, Trash2 } from "lucide-react";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    email: string;
    password: string;
    displayName: string;
    role: "member" | "deputy_admin";
  };
  onChange: (f: {
    email: string;
    password: string;
    displayName: string;
    role: "member" | "deputy_admin";
  }) => void;
  onSubmit: (e: React.FormEvent) => void;
  isBusy: boolean;
}

export function CreateUserModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  isBusy,
}: CreateUserModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 motion-reduce:animate-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md p-6 rounded-2xl bg-[#140d17] border border-white/[0.08] shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#251522] text-[#e27290] border border-[#e27290]/20">
              <Plus className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 id="create-user-modal-title" className="text-base font-bold text-white font-brand">
              Thêm Người Dùng Mới
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-[#b8a8b2] hover:text-white transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e27290]"
            aria-label="Đóng hộp thoại thêm người dùng"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label htmlFor="input-display-name" className="text-[#d8c5b2] font-semibold">
              Tên hiển thị
            </label>
            <input
              id="input-display-name"
              type="text"
              placeholder="Ví dụ: Mochi Star"
              value={form.displayName}
              onChange={(e) => onChange({ ...form, displayName: e.target.value })}
              className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e27290]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-email" className="text-[#d8c5b2] font-semibold">
              Email *
            </label>
            <input
              id="input-email"
              type="email"
              required
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e27290]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-password" className="text-[#d8c5b2] font-semibold">
              Mật khẩu *
            </label>
            <input
              id="input-password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              placeholder="8–72 ký tự"
              value={form.password}
              onChange={(e) => onChange({ ...form, password: e.target.value })}
              className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e27290]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="select-role" className="text-[#d8c5b2] font-semibold">
              Vai trò ban đầu
            </label>
            <select
              id="select-role"
              value={form.role}
              onChange={(e) =>
                onChange({
                  ...form,
                  role: e.target.value as "member" | "deputy_admin",
                })
              }
              className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-[#1a121d] border border-white/[0.08] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e27290]"
            >
              <option value="member">Thành viên (Member)</option>
              <option value="deputy_admin">Phó Quản Trị (Deputy Admin)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-lg text-[#d8c5b2] hover:text-white bg-white/[0.03] transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isBusy}
              aria-disabled={isBusy}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#d85678] hover:bg-[#cb5979] text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e27290]"
            >
              {isBusy ? "Đang tạo..." : "Xác nhận tạo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface WarnPartyModalProps {
  data: {
    partyId: string;
    partyName: string;
    message: string;
  } | null;
  onClose: () => void;
  onChangeMessage: (msg: string) => void;
  onSend: () => void;
  isBusy: boolean;
}

export function WarnPartyModal({
  data,
  onClose,
  onChangeMessage,
  onSend,
  isBusy,
}: WarnPartyModalProps) {
  if (!data) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="warn-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 motion-reduce:animate-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md p-6 rounded-2xl bg-[#140d17] border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2a1f1b] text-[#ecd9c6] border border-[#ecd9c6]/20">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 id="warn-modal-title" className="text-base font-bold text-white font-brand">
              Gửi Cảnh Báo Phòng
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2.5 rounded text-[#b8a8b2] hover:text-white flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ecd9c6]"
            aria-label="Đóng hộp thoại cảnh báo"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-[#b8a8b2]">
          Cảnh báo sẽ hiển thị trực tiếp trên màn hình xem phim của tất cả người tham gia phòng{" "}
          <span className="text-white font-bold">{data.partyName}</span>.
        </p>

        <div>
          <label htmlFor="textarea-warn-message" className="sr-only">
            Nội dung thông báo cảnh báo
          </label>
          <textarea
            id="textarea-warn-message"
            rows={3}
            value={data.message}
            onChange={(e) => onChangeMessage(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ecd9c6] leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold text-[#d8c5b2] hover:text-white bg-white/[0.03] transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={isBusy}
            aria-disabled={isBusy}
            className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold text-[#0c090f] bg-[#ecd9c6] hover:bg-[#dfcfbe] transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Gửi cảnh báo ngay
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  data: { id: string; email: string } | null;
  onClose: () => void;
  onConfirm: () => void;
  isBusy: boolean;
}

export function DeleteConfirmModal({ data, onClose, onConfirm, isBusy }: DeleteConfirmModalProps) {
  if (!data) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 motion-reduce:animate-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm p-6 rounded-2xl bg-[#140d17] border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#251219] border border-[#e27290]/30 text-[#e27290]">
            <Trash2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="delete-confirm-title" className="text-base font-bold text-white font-brand">
              Xác Nhận Xóa
            </h2>
            <p className="text-xs text-[#b8a8b2]">Thao tác không thể hoàn tác</p>
          </div>
        </div>

        <p className="text-xs text-[#fff8fa] bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
          Bạn có chắc chắn muốn xóa tài khoản{" "}
          <span className="text-[#e27290] font-bold">{data.email}</span>?
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold text-[#d8c5b2] hover:text-white bg-white/[0.03] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            aria-disabled={isBusy}
            className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#d85678] hover:bg-[#cb5979] transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e27290]"
          >
            Xóa vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  );
}
