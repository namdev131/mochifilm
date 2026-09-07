import { Link } from "@tanstack/react-router";
import {
  Activity,
  Film,
  Menu,
  MessageSquare,
  Moon,
  RefreshCw,
  Search,
  Server,
  Shield,
  Sliders,
  Sun,
  Users,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { AuditEntry } from "./admin-constants";

export type AdminTab = "overview" | "users" | "permissions" | "comments" | "parties" | "sources";
const NAV: { id: AdminTab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Tổng quan", icon: Activity },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "permissions", label: "Phân quyền", icon: Sliders },
  { id: "comments", label: "Bình luận", icon: MessageSquare },
  { id: "parties", label: "Watch Party", icon: Film },
  { id: "sources", label: "Nguồn phim", icon: Server },
];

export function AdminSidebar({
  activeTab,
  onSelectTab,
  mobileSidebarOpen,
  onCloseMobileSidebar,
  usersCount,
  partiesCount,
  pendingCommentsCount,
  isAdmin,
}: {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  mobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
  usersCount: number;
  partiesCount: number;
  pendingCommentsCount: number;
  isAdmin: boolean;
}) {
  const count = (id: AdminTab) =>
    id === "users"
      ? usersCount
      : id === "parties"
        ? partiesCount
        : id === "comments"
          ? pendingCommentsCount
          : 0;
  return (
    <>
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onCloseMobileSidebar}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}
      <aside
        aria-label="Điều hướng quản trị"
        className={`fixed inset-y-0 left-0 z-50 w-[232px] border-r border-white/10 bg-[#120c15] p-4 transition-transform ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10">
          <Link to="/" aria-label="Về Mochi Film">
            <img src="/assets/mochi/wordmark.webp" alt="Mochi Film" className="h-8" />
          </Link>
          <button
            type="button"
            onClick={onCloseMobileSidebar}
            className="min-w-11 min-h-11 lg:hidden"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="mx-auto w-5" />
          </button>
        </div>
        <nav className="mt-5 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => {
                onSelectTab(id);
                onCloseMobileSidebar();
              }}
              aria-current={activeTab === id ? "page" : undefined}
              className={`min-h-11 w-full rounded-xl px-3 flex items-center gap-3 text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#e27290] ${activeTab === id ? "bg-[#251522] text-[#e27290]" : "text-[#d8c5b2] hover:bg-white/5"}`}
            >
              <Icon className="w-4" />
              <span>{label}</span>
              {count(id) > 0 && (
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5">{count(id)}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 inset-x-4 rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <Shield className="w-4 text-[#e27290]" />
            {isAdmin ? "Main Admin" : "Phó Admin"}
          </div>
          <p className="mt-1 text-[10px] text-[#b8a8b2]">Quyền được xác thực phía máy chủ</p>
        </div>
      </aside>
    </>
  );
}

export function AdminTopbar({
  onOpenMobileSidebar,
  searchQuery,
  onSearchChange,
  isOfflineMode,
  onRefresh,
  isBusy,
  theme,
  onToggleTheme,
  user,
  isAdmin,
}: {
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isOfflineMode: boolean;
  onRefresh: () => void;
  isBusy: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  user: User;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-[#0c090f]/95 px-3 sm:px-6 flex items-center gap-2">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="min-w-11 min-h-11 lg:hidden"
        aria-label="Mở điều hướng"
      >
        <Menu className="mx-auto w-5" />
      </button>
      <label className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-3.5 w-4 text-[#b8a8b2]" />
        <span className="sr-only">Tìm kiếm</span>
        <input
          id="admin-global-search"
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm người dùng, phòng..."
          className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[.03] pl-10 pr-3 text-xs focus-visible:ring-2 focus-visible:ring-[#e27290]"
        />
      </label>
      {isOfflineMode && (
        <span className="hidden sm:block text-[10px] text-[#e27290]">Mất kết nối</span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isBusy}
        className="min-w-11 min-h-11 rounded-xl border border-white/10"
        aria-label="Làm mới"
      >
        <RefreshCw className={`mx-auto w-4 ${isBusy ? "animate-spin" : ""}`} />
      </button>
      <button
        type="button"
        onClick={onToggleTheme}
        className="min-w-11 min-h-11 rounded-xl border border-white/10"
        aria-label="Đổi giao diện"
      >
        {theme === "dark" ? <Sun className="mx-auto w-4" /> : <Moon className="mx-auto w-4" />}
      </button>
      <div className="hidden md:block text-right">
        <p className="max-w-40 truncate text-xs font-bold">{user?.email}</p>
        <p className="text-[10px] text-[#e27290]">{isAdmin ? "Main Admin" : "Phó Admin"}</p>
      </div>
    </header>
  );
}

export function AdminAside({
  user,
  auditLog,
  onOpenCreateUser,
  onSelectTab,
}: {
  user: User;
  auditLog: AuditEntry[];
  onOpenCreateUser: () => void;
  onSelectTab: (tab: AdminTab) => void;
}) {
  return (
    <aside
      aria-label="Thao tác và nhật ký"
      className="hidden xl:block fixed right-0 top-16 bottom-0 w-[264px] border-l border-white/10 bg-[#120c15] p-4 overflow-y-auto"
    >
      <h2 className="font-brand text-lg">Thao Tác Nhanh</h2>
      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={onOpenCreateUser}
          className="min-h-11 rounded-xl bg-[#d85678] text-xs font-bold"
        >
          Thêm người dùng
        </button>
        <button
          type="button"
          onClick={() => onSelectTab("comments")}
          className="min-h-11 rounded-xl bg-white/5 text-xs"
        >
          Kiểm duyệt bình luận
        </button>
        <button
          type="button"
          onClick={() => onSelectTab("parties")}
          className="min-h-11 rounded-xl bg-white/5 text-xs"
        >
          Quản lý Watch Party
        </button>
      </div>
      <h2 className="mt-7 font-brand text-lg">Nhật Ký</h2>
      <div className="mt-3 space-y-3">
        {auditLog.length ? (
          auditLog.map((item) => (
            <article key={item.id} className="border-l-2 border-[#e27290] pl-3">
              <p className="text-xs font-bold">{item.action}</p>
              <p className="text-[10px] text-[#b8a8b2]">
                {item.actor_email || user?.email} ·{" "}
                {new Date(item.created_at).toLocaleString("vi-VN")}
              </p>
            </article>
          ))
        ) : (
          <p className="text-xs text-[#b8a8b2]">Chưa có sự kiện.</p>
        )}
      </div>
    </aside>
  );
}

export function AdminMobileDock({
  activeTab,
  onSelectTab,
  pendingCommentsCount,
}: {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingCommentsCount: number;
}) {
  return (
    <nav
      aria-label="Điều hướng quản trị di động"
      className="fixed bottom-2 inset-x-2 z-40 h-16 rounded-2xl border border-white/10 bg-[#140d17]/95 p-1 flex lg:hidden"
    >
      {NAV.slice(0, 5).map(({ id, label, icon: Icon }) => (
        <button
          type="button"
          key={id}
          onClick={() => onSelectTab(id)}
          aria-current={activeTab === id ? "page" : undefined}
          className={`relative min-w-[48px] min-h-[48px] flex-1 rounded-xl grid place-items-center text-[9px] ${activeTab === id ? "bg-[#251522] text-[#e27290]" : "text-[#b8a8b2]"}`}
        >
          <span className="grid place-items-center">
            <Icon className="w-4" />
            {label}
          </span>
          {id === "comments" && pendingCommentsCount > 0 && (
            <span className="absolute right-2 top-1 w-2 h-2 rounded-full bg-[#e27290]" />
          )}
        </button>
      ))}
    </nav>
  );
}
