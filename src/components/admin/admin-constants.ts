import { SOURCES, pingSource } from "@/lib/api";

export { SOURCES, pingSource };

export const ADMIN_EMAIL = "lacviet55@proton.me";

export type Permission =
  | "users.view"
  | "users.manage"
  | "comments.view"
  | "comments.moderate"
  | "watch_party.view"
  | "watch_party.warn"
  | "watch_party.lock"
  | "watch_party.close"
  | "sources.view";

export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  role: "admin" | "deputy_admin" | "vip" | "member";
  vip_expires_at: string | null;
  vip_plan: "monthly" | "quarterly" | "yearly" | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until?: string | null;
  permissions: Permission[];
}

export interface AdminParty {
  id: string;
  code: string;
  name: string;
  host_id?: string;
  host_email: string | null;
  closed: boolean;
  join_locked: boolean;
  created_at: string;
  updated_at?: string;
  member_count: number;
  message_count: number;
}

export interface AdminComment {
  id: string;
  user_name: string;
  user_email: string;
  movie_title: string;
  content: string;
  created_at: string;
  status: "pending" | "approved" | "hidden";
}

export interface AuditEntry {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AdminDatabaseStats {
  users: number;
  favorites: number;
  watchHistory: number;
  ratings: number;
  notifications: number;
  watchParties: number;
}

export interface AdminVipPrice {
  plan_id: "monthly" | "quarterly" | "yearly";
  original_price: number;
  price: number;
}

export interface PermRow {
  id: Permission;
  name: string;
  group: "users" | "comments" | "watch_party" | "sources";
}

export const PERMISSION_ROWS: PermRow[] = [
  { id: "users.view", name: "Xem người dùng", group: "users" },
  { id: "users.manage", name: "Tạo, bổ nhiệm và xóa người dùng", group: "users" },
  { id: "comments.view", name: "Xem bình luận", group: "comments" },
  { id: "comments.moderate", name: "Duyệt, ẩn và xóa bình luận", group: "comments" },
  { id: "watch_party.view", name: "Xem Watch Party", group: "watch_party" },
  { id: "watch_party.warn", name: "Cảnh báo Watch Party", group: "watch_party" },
  { id: "watch_party.lock", name: "Khóa người tham gia mới", group: "watch_party" },
  { id: "watch_party.close", name: "Đóng Watch Party", group: "watch_party" },
  { id: "sources.view", name: "Xem trạng thái nguồn phim", group: "sources" },
];
