import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, LogIn, Shield, X } from "lucide-react";
import { useAppAuth, supabase } from "@/lib/auth-data-provider";
import { SOURCES, pingSource } from "@/lib/api";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import "@/styles/admin.css";
import {
  ADMIN_EMAIL,
  PERMISSION_ROWS,
  type AdminComment,
  type AdminDatabaseStats,
  type AdminParty,
  type AdminUser,
  type AuditEntry,
  type Permission,
} from "@/components/admin/admin-constants";
import {
  AdminAside,
  AdminMobileDock,
  AdminSidebar,
  AdminTopbar,
  type AdminTab,
} from "@/components/admin/AdminLayoutView";
import { AdminTabPanels } from "@/components/admin/AdminTabPanels";
import {
  CreateUserModal,
  DeleteConfirmModal,
  WarnPartyModal,
} from "@/components/admin/AdminModals";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Quản trị Mochi Film" },
      { name: "description", content: "Trung tâm quản trị Mochi Film" },
    ],
  }),
  component: AdminPage,
});

export function AdminPage() {
  const { user, isLoading } = useAppAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof window === "undefined"
      ? "dark"
      : localStorage.getItem("mochi_admin_theme") === "light"
        ? "light"
        : "dark",
  );
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [parties, setParties] = useState<AdminParty[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [commentFilter, setCommentFilter] = useState<"all" | "pending" | "approved" | "hidden">(
    "all",
  );
  const [sourcePings, setSourcePings] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "member" as "member" | "deputy_admin",
  });
  const [warnDialog, setWarnDialog] = useState<{
    partyId: string;
    partyName: string;
    message: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; email: string } | null>(null);

  const isAdmin = Boolean(
    user && (user.email?.toLowerCase() === ADMIN_EMAIL || user.app_metadata?.role === "admin"),
  );
  const isDeputy = user?.app_metadata?.role === "deputy_admin";
  const isStaff = isAdmin || isDeputy;
  const databaseStats = useConvexQuery(api.admin.dashboard, isAdmin ? {} : "skip") as
    AdminDatabaseStats | null | undefined;
  const hasPermission = useCallback(
    (permission: Permission) => isAdmin || permissions.includes(permission),
    [isAdmin, permissions],
  );
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ message, type });
      window.setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  const requestApi = useCallback(async (body?: Record<string, unknown>) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const response = await fetch("/api/admin", {
      method: body ? "POST" : "GET",
      headers: {
        authorization: token ? `Bearer ${token}` : "",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Lỗi máy chủ (${response.status})`);
    return data;
  }, []);

  const loadDashboardData = useCallback(
    async (quiet = false) => {
      if (!quiet) setIsBusy(true);
      try {
        const data = await requestApi();
        setUsers(data.users || []);
        setParties(data.parties || []);
        setComments(data.comments || []);
        setAuditLog(data.auditLog || []);
        setPermissions(data.permissions || []);
        setIsOfflineMode(false);
      } catch (error) {
        setUsers([]);
        setParties([]);
        setComments([]);
        setAuditLog([]);
        setPermissions([]);
        setIsOfflineMode(true);
        if (!quiet)
          showToast(error instanceof Error ? error.message : "Không tải được dữ liệu", "error");
      } finally {
        if (!quiet) setIsBusy(false);
      }
    },
    [requestApi, showToast],
  );

  useEffect(() => {
    if (isStaff) void loadDashboardData();
  }, [isStaff, loadDashboardData]);
  useEffect(() => {
    if (activeTab === "sources" || activeTab === "overview")
      SOURCES.forEach(
        (source) =>
          void pingSource(source.id).then((ms) =>
            setSourcePings((old) => ({ ...old, [source.id]: ms })),
          ),
      );
  }, [activeTab]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        document.getElementById("admin-global-search")?.focus();
      }
      if (event.key === "Escape") {
        setShowCreateUserModal(false);
        setWarnDialog(null);
        setDeleteConfirm(null);
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  const mutate = useCallback(
    async (body: Record<string, unknown>, success: string) => {
      setIsBusy(true);
      try {
        await requestApi(body);
        showToast(success);
        await loadDashboardData(true);
        return true;
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Thao tác thất bại", "error");
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [loadDashboardData, requestApi, showToast],
  );

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q
      ? users.filter((item) =>
          `${item.email} ${item.display_name || ""} ${item.role}`.toLowerCase().includes(q),
        )
      : users;
  }, [users, searchQuery]);
  const filteredParties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q
      ? parties.filter((item) =>
          `${item.code} ${item.name} ${item.host_email || ""}`.toLowerCase().includes(q),
        )
      : parties;
  }, [parties, searchQuery]);
  const filteredComments = useMemo(
    () =>
      commentFilter === "all" ? comments : comments.filter((item) => item.status === commentFilter),
    [comments, commentFilter],
  );

  if (isLoading)
    return (
      <div
        className="min-h-screen bg-[#0c090f] text-[#ecd9c6] grid place-items-center"
        role="status"
      >
        Đang tải quản trị...
      </div>
    );
  if (!user)
    return (
      <Gate
        icon={<Shield />}
        title="Khu Vực Quản Trị"
        body="Đăng nhập bằng tài khoản quản trị Mochi Film."
        action={
          <button
            type="button"
            onClick={() => navigate({ to: "/auth", search: { redirect: "/admin" } })}
            className="min-h-11 rounded-xl bg-[#d85678] px-4 font-bold flex items-center justify-center gap-2"
          >
            <LogIn className="w-4" />
            Đăng nhập
          </button>
        }
      />
    );
  if (!isStaff)
    return (
      <Gate
        icon={<AlertTriangle />}
        title="Giới Hạn Quyền Truy Cập"
        body={`${user.email} chưa có quyền quản trị.`}
        action={
          <Link to="/" className="min-h-11 rounded-xl bg-white/5 px-4 grid place-items-center">
            Về trang chủ
          </Link>
        }
      />
    );

  return (
    <div
      data-admin-theme={theme}
      className="min-h-screen bg-[#0c090f] text-[#fff8fa] font-sans antialiased"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[400] focus:m-4 focus:bg-[#d85678] focus:p-3"
      >
        Đến nội dung chính
      </a>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 top-5 z-[300] rounded-xl border border-white/10 bg-[#140d17] px-4 py-3 text-xs font-bold flex gap-2"
        >
          {toast.type === "error" ? (
            <X className="w-4 text-[#e27290]" />
          ) : (
            <Check className="w-4 text-emerald-400" />
          )}
          {toast.message}
        </div>
      )}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileSidebarOpen={mobileSidebarOpen}
        onCloseMobileSidebar={() => setMobileSidebarOpen(false)}
        usersCount={users.length}
        partiesCount={parties.length}
        pendingCommentsCount={comments.filter((item) => item.status === "pending").length}
        isAdmin={isAdmin}
      />
      <div className="lg:pl-[232px] xl:pr-[264px] min-h-screen flex flex-col">
        <AdminTopbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isOfflineMode={isOfflineMode}
          onRefresh={() => loadDashboardData()}
          isBusy={isBusy}
          theme={theme}
          onToggleTheme={() => {
            const next = theme === "dark" ? "light" : "dark";
            setTheme(next);
            localStorage.setItem("mochi_admin_theme", next);
          }}
          user={user}
          isAdmin={isAdmin}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 pb-24 lg:pb-8 outline-none"
        >
          <AdminTabPanels
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            users={users}
            filteredUsers={filteredUsers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCreateUser={() => setShowCreateUserModal(true)}
            onToggleDeputy={(target) =>
              void mutate(
                { action: "setDeputy", id: target.id, enabled: target.role !== "deputy_admin" },
                "Đã cập nhật vai trò",
              )
            }
            onOpenDeleteConfirm={setDeleteConfirm}
            permMatrix={PERMISSION_ROWS}
            onTogglePermission={(id, permission, enabled) =>
              void mutate({ action: "setPermission", id, permission, enabled }, "Đã cập nhật quyền")
            }
            comments={comments}
            commentFilter={commentFilter}
            onSelectCommentFilter={setCommentFilter}
            filteredComments={filteredComments}
            onModerateComment={(id, status) =>
              void mutate({ action: "moderateComment", id, status }, "Đã kiểm duyệt bình luận")
            }
            onDeleteComment={(id) => {
              if (window.confirm("Xóa vĩnh viễn bình luận này?"))
                void mutate({ action: "deleteComment", id }, "Đã xóa bình luận");
            }}
            parties={parties}
            filteredParties={filteredParties}
            isAdmin={isAdmin}
            hasPermission={hasPermission}
            onOpenWarnDialog={setWarnDialog}
            onCloseParty={(party) =>
              void mutate({ action: "closeParty", id: party.id }, `Đã đóng phòng ${party.code}`)
            }
            onTogglePartyLock={(party) =>
              void mutate(
                { action: "lockParty", id: party.id, locked: !party.join_locked },
                `Đã ${party.join_locked ? "mở" : "khóa"} phòng ${party.code}`,
              )
            }
            sourcePings={sourcePings}
            databaseStats={databaseStats}
          />
        </main>
      </div>
      <AdminAside
        user={user}
        auditLog={auditLog}
        onOpenCreateUser={() => setShowCreateUserModal(true)}
        onSelectTab={setActiveTab}
      />
      <AdminMobileDock
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCommentsCount={comments.filter((item) => item.status === "pending").length}
      />
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        form={createForm}
        onChange={setCreateForm}
        onSubmit={(event) => {
          event.preventDefault();
          void mutate({ action: "createUser", ...createForm }, "Đã tạo người dùng").then((ok) => {
            if (!ok) return;
            setShowCreateUserModal(false);
            setCreateForm({ email: "", password: "", displayName: "", role: "member" });
          });
        }}
        isBusy={isBusy}
      />
      <WarnPartyModal
        data={warnDialog}
        onClose={() => setWarnDialog(null)}
        onChangeMessage={(message) => setWarnDialog((old) => (old ? { ...old, message } : null))}
        onSend={() => {
          if (warnDialog)
            void mutate(
              { action: "warnParty", id: warnDialog.partyId, message: warnDialog.message.trim() },
              "Đã gửi cảnh báo",
            ).then((ok) => ok && setWarnDialog(null));
        }}
        isBusy={isBusy}
      />
      <DeleteConfirmModal
        data={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm)
            void mutate({ action: "deleteUser", id: deleteConfirm.id }, "Đã xóa người dùng").then(
              (ok) => ok && setDeleteConfirm(null),
            );
        }}
        isBusy={isBusy}
      />
    </div>
  );
}

function Gate({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0c090f] text-white grid place-items-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#140d17] p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#251522] text-[#e27290] grid place-items-center">
          {icon}
        </div>
        <h1 className="font-brand text-2xl">{title}</h1>
        <p className="text-sm text-[#b8a8b2]">{body}</p>
        <div className="grid">{action}</div>
      </div>
    </div>
  );
}
