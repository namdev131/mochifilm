import {
  CheckCircle2,
  Film,
  Lock,
  MessageSquare,
  Server,
  Shield,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import {
  SOURCES,
  type AdminComment,
  type AdminDatabaseStats,
  type AdminParty,
  type AdminUser,
  type AdminVipPrice,
  type PermRow,
  type Permission,
} from "./admin-constants";
import type { AdminTab } from "./AdminLayoutView";
import { VIP_PLAN_BY_ID, VIP_PLANS, type VipPlanId } from "@/lib/vip-plans";

interface Props {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  users: AdminUser[];
  vipPrices: AdminVipPrice[];
  filteredUsers: AdminUser[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenCreateUser: () => void;
  onToggleDeputy: (user: AdminUser) => void;
  onSetVipPlan: (user: AdminUser, plan: VipPlanId | null) => void;
  onSetVipPrices: (prices: Array<{ plan_id: VipPlanId; price: number }>) => void;
  onCreateVipPromocode: (vipExpiresAt: string) => void;
  createdPromocode: string;
  onBroadcastNotification: (title: string, message: string) => void;
  onOpenDeleteConfirm: (user: { id: string; email: string }) => void;
  permMatrix: PermRow[];
  onTogglePermission: (userId: string, permission: Permission, enabled: boolean) => void;
  comments: AdminComment[];
  commentFilter: "all" | "pending" | "approved" | "hidden";
  onSelectCommentFilter: (filter: "all" | "pending" | "approved" | "hidden") => void;
  filteredComments: AdminComment[];
  onModerateComment: (id: string, status: "approved" | "hidden") => void;
  onDeleteComment: (id: string) => void;
  parties: AdminParty[];
  filteredParties: AdminParty[];
  isAdmin: boolean;
  hasPermission: (permission: Permission) => boolean;
  onOpenWarnDialog: (data: { partyId: string; partyName: string; message: string }) => void;
  onCloseParty: (party: AdminParty) => void;
  onDeleteParty: (party: AdminParty) => void;
  onTogglePartyLock: (party: AdminParty) => void;
  sourcePings: Record<string, number>;
  databaseStats?: AdminDatabaseStats;
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-[#140d17] p-4">{children}</div>
);
const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-[#140d17] p-12 text-center text-sm text-[#b8a8b2]">
    {children}
  </div>
);
const Header = ({ title, text }: { title: string; text: string }) => (
  <div>
    <h1 className="font-brand text-xl sm:text-2xl">{title}</h1>
    <p className="mt-1 text-xs text-[#b8a8b2]">{text}</p>
  </div>
);

export function AdminTabPanels(props: Props) {
  const deputyUsers = props.users.filter((user) => user.role === "deputy_admin");
  return (
    <>
      {props.activeTab === "overview" && (
        <section
          id="panel-overview"
          role="tabpanel"
          aria-labelledby="heading-tab-overview"
          className="space-y-5"
        >
          <Header
            title="Trung Tâm Điều Hành Mochi Film"
            text="Dữ liệu thật, quyền máy chủ, không chế độ xem giả."
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ["Người dùng", props.users.length],
              ["Phó Admin", deputyUsers.length],
              ["Phòng đang mở", props.parties.filter((party) => !party.closed).length],
              [
                "Bình luận chờ duyệt",
                props.comments.filter((comment) => comment.status === "pending").length,
              ],
            ].map(([label, value]) => (
              <Card key={label}>
                <p className="text-xs text-[#b8a8b2]">{label}</p>
                <p className="mt-2 text-3xl font-black">{value}</p>
              </Card>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between">
                <b>Supabase</b>
                <span className="text-[10px] text-emerald-400">Đã kết nối</span>
              </div>
              <p className="mt-3 text-xs text-[#b8a8b2]">
                {props.users.length} người dùng · {props.comments.length} bình luận ·{" "}
                {props.parties.length} phòng
              </p>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <b>Convex</b>
                <span className="text-[10px] text-emerald-400">
                  {props.databaseStats ? "Đã kết nối" : "Đang tải"}
                </span>
              </div>
              <p className="mt-3 text-xs text-[#b8a8b2]">
                {props.databaseStats
                  ? `${props.databaseStats.favorites} yêu thích · ${props.databaseStats.watchHistory} lượt xem · ${props.databaseStats.ratings} đánh giá · ${props.databaseStats.notifications} thông báo`
                  : "Đang đọc dữ liệu Convex..."}
              </p>
            </Card>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {(["users", "comments", "parties"] as AdminTab[]).map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => props.onSelectTab(tab)}
                className="min-h-20 rounded-2xl border border-white/10 bg-[#140d17] p-4 text-left font-bold focus-visible:ring-2 focus-visible:ring-[#e27290]"
              >
                Mở{" "}
                {tab === "users" ? "người dùng" : tab === "comments" ? "kiểm duyệt" : "Watch Party"}
              </button>
            ))}
          </div>
          {props.isAdmin && (
            <form
              className="rounded-2xl border border-white/10 bg-[#140d17] p-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                props.onBroadcastNotification(String(form.get("title")), String(form.get("message")));
              }}
            >
              <Header title="Gửi thông báo toàn server" text="Xuất hiện trong chuông của mọi tài khoản." />
              <input name="title" required maxLength={100} placeholder="Tiêu đề" className="min-h-11 rounded-xl border border-white/10 bg-white/[.03] px-3 text-xs" />
              <textarea name="message" required maxLength={500} placeholder="Nội dung" className="min-h-24 rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs" />
              <button type="submit" className="min-h-11 rounded-xl bg-[#d85678] px-4 text-xs font-bold">Gửi thông báo</button>
            </form>
          )}
        </section>
      )}

      {props.activeTab === "users" && (
        <section
          id="panel-users"
          role="tabpanel"
          aria-labelledby="heading-tab-users"
          className="space-y-4"
        >
          <div className="flex flex-wrap justify-between gap-3">
            <Header title="Người Dùng" text="Tạo tài khoản, bổ nhiệm Phó Admin, xóa tài khoản." />
            <button
              type="button"
              onClick={props.onOpenCreateUser}
              className="min-h-11 rounded-xl bg-[#d85678] px-4 text-xs font-bold"
            >
              Thêm người dùng
            </button>
          </div>
          {props.isAdmin && (
            <div className="grid gap-3 lg:grid-cols-2">
            <form
              key={props.vipPrices.map(({ plan_id, price }) => `${plan_id}:${price}`).join("|")}
              className="grid gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[.04] p-4 sm:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                props.onSetVipPrices(
                  VIP_PLANS.map((plan) => ({ plan_id: plan.id, price: Number(data.get(plan.id)) })),
                );
              }}
            >
              {VIP_PLANS.map((plan) => (
                <label key={plan.id} className="grid gap-1 text-xs text-[#b8a8b2]">
                  {plan.name}
                  <input
                    name={plan.id}
                    type="number"
                    min="1000"
                    max="10000000"
                    step="1000"
                    required
                    defaultValue={
                      props.vipPrices.find((price) => price.plan_id === plan.id)?.price ?? plan.price
                    }
                    className="min-h-10 rounded-lg border border-white/10 bg-[#140d17] px-3 text-white"
                  />
                </label>
              ))}
              <button type="submit" className="min-h-10 self-end rounded-lg bg-amber-500 px-3 text-xs font-bold text-black">
                Lưu giá VIP
              </button>
            </form>
            <form
              className="grid gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[.04] p-4"
              onSubmit={(event) => {
                event.preventDefault();
                props.onCreateVipPromocode(String(new FormData(event.currentTarget).get("vip_expires_at")));
              }}
            >
              <Header title="Tạo promocode VIP" text="Mã dùng một lần; VIP hết hạn đúng ngày đã chọn." />
              <label className="grid gap-1 text-xs text-[#b8a8b2]">
                Ngày VIP hết hạn
                <input name="vip_expires_at" type="datetime-local" required className="min-h-10 rounded-lg border border-white/10 bg-[#140d17] px-3 text-white" />
              </label>
              <button type="submit" className="min-h-10 rounded-lg bg-amber-500 px-3 text-xs font-bold text-black">Tạo promocode</button>
              {props.createdPromocode && <output className="rounded-lg bg-black/30 p-3 font-mono text-sm text-amber-200" aria-live="polite">{props.createdPromocode}</output>}
            </form>
            </div>
          )}
          <input
            type="search"
            value={props.searchQuery}
            onChange={(event) => props.onSearchChange(event.target.value)}
            aria-label="Tìm người dùng"
            placeholder="Email, tên, vai trò..."
            className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[.03] px-4 text-xs"
          />
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-white/[.03] text-[#b8a8b2]">
                <tr>
                  <th className="p-4">Người dùng</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th className="pr-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {props.filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-white/5">
                    <td className="p-4">
                      <b>{user.display_name || "Thành viên"}</b>
                      <br />
                      <span className="text-[#b8a8b2]">{user.email}</span>
                    </td>
                    <td>
                      {user.role === "admin"
                        ? "Main Admin"
                        : user.role === "deputy_admin"
                          ? "Phó Admin"
                          : user.role === "vip"
                            ? `VIP ${user.vip_plan ? VIP_PLAN_BY_ID[user.vip_plan].name : ""} đến ${new Date(user.vip_expires_at!).toLocaleDateString("vi-VN")}`
                          : "Thành viên"}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString("vi-VN")}</td>
                    <td className="pr-4 text-right">
                      {user.role === "admin" ? (
                        <b className="text-[#ecd9c6]">Bảo vệ tối cao</b>
                      ) : (
                        <span className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => props.onToggleDeputy(user)}
                            className="min-h-10 rounded-lg bg-white/5 px-3"
                          >
                            {user.role === "deputy_admin" ? "Hạ quyền" : "Bổ nhiệm Phó"}
                          </button>
                          {user.role !== "deputy_admin" && (user.role === "vip" ? (
                            <button type="button" onClick={() => props.onSetVipPlan(user, null)} className="min-h-10 rounded-lg bg-amber-500/10 px-3 text-amber-200">Thu hồi VIP</button>
                          ) : (
                            <select aria-label={`Chọn gói VIP cho ${user.email}`} defaultValue="" onChange={(event) => { if (event.target.value) props.onSetVipPlan(user, event.target.value as VipPlanId); event.currentTarget.value = ""; }} className="min-h-10 rounded-lg border border-amber-500/20 bg-[#1b1417] px-3 text-amber-200">
                              <option value="">Cấp VIP…</option>
                              {VIP_PLANS.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                            </select>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              props.onOpenDeleteConfirm({ id: user.id, email: user.email })
                            }
                            aria-label={`Xóa ${user.email}`}
                            className="min-w-10 min-h-10 rounded-lg text-[#e27290]"
                          >
                            <Trash2 className="mx-auto w-4" />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {props.activeTab === "permissions" && (
        <section
          id="panel-permissions"
          role="tabpanel"
          aria-labelledby="heading-tab-permissions"
          className="space-y-4"
        >
          <Header
            title="Phân Quyền Phó Admin"
            text="Main Admin luôn có toàn quyền. Chỉ quyền lưu trong cơ sở dữ liệu mới có hiệu lực."
          />
          {deputyUsers.length === 0 ? (
            <Empty>Chưa có Phó Admin.</Empty>
          ) : (
            deputyUsers.map((user) => (
              <Card key={user.id}>
                <h2 className="font-bold">{user.display_name || user.email}</h2>
                <p className="text-xs text-[#b8a8b2]">{user.email}</p>
                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  {props.permMatrix.map((permission) => {
                    const enabled = user.permissions.includes(permission.id);
                    return (
                      <label
                        key={permission.id}
                        className="min-h-11 rounded-xl bg-white/[.03] px-3 flex items-center gap-3 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() =>
                            props.onTogglePermission(user.id, permission.id, !enabled)
                          }
                          className="accent-[#d85678]"
                        />
                        <span>{permission.name}</span>
                      </label>
                    );
                  })}
                </div>
              </Card>
            ))
          )}
        </section>
      )}

      {props.activeTab === "comments" && (
        <section
          id="panel-comments"
          role="tabpanel"
          aria-labelledby="heading-tab-comments"
          className="space-y-4"
        >
          <Header title="Kiểm Duyệt Bình Luận" text="Duyệt, ẩn, xóa bình luận thật." />
          <div role="tablist" aria-label="Lọc bình luận" className="flex gap-2 overflow-x-auto">
            {(["all", "pending", "approved", "hidden"] as const).map((filter) => (
              <button
                type="button"
                role="tab"
                aria-selected={props.commentFilter === filter}
                key={filter}
                onClick={() => props.onSelectCommentFilter(filter)}
                className={`min-h-10 rounded-xl px-4 text-xs ${props.commentFilter === filter ? "bg-[#d85678] font-bold" : "bg-white/5"}`}
              >
                {filter === "all"
                  ? "Tất cả"
                  : filter === "pending"
                    ? "Chờ duyệt"
                    : filter === "approved"
                      ? "Đã duyệt"
                      : "Đã ẩn"}
              </button>
            ))}
          </div>
          {props.filteredComments.length === 0 ? (
            <Empty>Không có bình luận.</Empty>
          ) : (
            props.filteredComments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-2xl border border-white/10 bg-[#140d17] p-4 flex flex-col sm:flex-row gap-4 justify-between"
              >
                <div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <b>{comment.user_name}</b>
                    <span className="text-[#b8a8b2]">{comment.user_email}</span>
                    <span className="rounded bg-white/5 px-2">{comment.status}</span>
                  </div>
                  <p className="mt-2 text-sm">{comment.content}</p>
                  <p className="mt-2 text-[10px] text-[#b8a8b2]">
                    {comment.movie_title} · {new Date(comment.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => props.onModerateComment(comment.id, "approved")}
                    className="min-w-10 min-h-10 rounded-lg bg-emerald-500/15"
                    aria-label="Duyệt"
                  >
                    <CheckCircle2 className="mx-auto w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onModerateComment(comment.id, "hidden")}
                    className="min-h-10 rounded-lg bg-white/5 px-3"
                  >
                    Ẩn
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onDeleteComment(comment.id)}
                    className="min-w-10 min-h-10 rounded-lg text-[#e27290]"
                    aria-label="Xóa"
                  >
                    <Trash2 className="mx-auto w-4" />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {props.activeTab === "parties" && (
        <section
          id="panel-parties"
          role="tabpanel"
          aria-labelledby="heading-tab-parties"
          className="space-y-4"
        >
          <Header
            title="Watch Party"
            text={
              props.isAdmin
                ? "Main Admin có quyền đóng mọi phòng."
                : "Thao tác theo quyền được Main Admin cấp."
            }
          />
          {props.filteredParties.length === 0 ? (
            <Empty>Không có phòng.</Empty>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {props.filteredParties.map((party) => (
                <Card key={party.id}>
                  <div className="flex justify-between">
                    <b>{party.code}</b>
                    <span className="text-xs">
                      {party.closed ? "Đã đóng" : party.join_locked ? "Đã khóa" : "Đang mở"}
                    </span>
                  </div>
                  <h2 className="mt-2 font-bold">{party.name}</h2>
                  <p className="text-xs text-[#b8a8b2]">
                    {party.host_email || "Không rõ host"} · {party.member_count} người ·{" "}
                    {party.message_count} tin
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={party.closed || !props.hasPermission("watch_party.warn")}
                      onClick={() =>
                        props.onOpenWarnDialog({
                          partyId: party.id,
                          partyName: party.name,
                          message:
                            "Nhắc nhở từ Quản trị viên: Vui lòng tuân thủ quy tắc phòng xem chung Mochi Film.",
                        })
                      }
                      className="min-h-10 rounded-lg bg-white/5 px-3 disabled:opacity-40"
                    >
                      Cảnh báo
                    </button>
                    <button
                      type="button"
                      disabled={party.closed || !props.hasPermission("watch_party.lock")}
                      onClick={() => props.onTogglePartyLock(party)}
                      className="min-w-10 min-h-10 rounded-lg bg-white/5 disabled:opacity-40"
                      aria-label={party.join_locked ? "Mở khóa" : "Khóa phòng"}
                    >
                      {party.join_locked ? (
                        <Unlock className="mx-auto w-4" />
                      ) : (
                        <Lock className="mx-auto w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={party.closed || !props.hasPermission("watch_party.close")}
                      onClick={() => props.onCloseParty(party)}
                      className="min-h-10 rounded-lg bg-[#d85678] px-3 font-bold disabled:opacity-40"
                    >
                      Đóng phòng
                    </button>
                    {props.isAdmin && (
                      <button
                        type="button"
                        onClick={() => props.onDeleteParty(party)}
                        className="min-h-10 rounded-lg border border-red-400/40 px-3 font-bold text-red-300 hover:bg-red-500/15 focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <Trash2 className="mr-1 inline w-4" /> Xóa phòng
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {props.activeTab === "sources" && (
        <section
          id="panel-sources"
          role="tabpanel"
          aria-labelledby="heading-tab-sources"
          className="space-y-4"
        >
          <Header title="Nguồn Phim" text="Kiểm tra trực tiếp độ trễ các nguồn đã cấu hình." />
          <div className="grid md:grid-cols-3 gap-3">
            {SOURCES.map((source) => (
              <Card key={source.id}>
                <Server className="w-5 text-emerald-400" />
                <h2 className="mt-3 font-bold">{source.label}</h2>
                <p className="mt-1 text-2xl font-black">
                  {props.sourcePings[source.id]
                    ? `${props.sourcePings[source.id]} ms`
                    : "Đang kiểm tra"}
                </p>
              </Card>
            ))}
          </div>
          <Card>
            <div className="flex gap-3">
              <Shield className="w-5 text-[#e27290]" />
              <div>
                <b>Trạng thái bảo mật</b>
                <p className="text-xs text-[#b8a8b2]">
                  Admin API xác thực token, phân quyền phía máy chủ, ghi nhật ký thao tác.
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}
    </>
  );
}
