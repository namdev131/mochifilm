type MembershipUser = {
  email?: string;
  app_metadata?: Record<string, unknown>;
};

/** Display only. Privileged actions must still authorize on the server. */
export function accountMembership(user: MembershipUser, now = Date.now()) {
  const role = user.app_metadata?.role;
  if (
    ["lacviet55@proton.me", "admin@mochifilm.vn"].includes(user.email?.toLowerCase() ?? "") ||
    role === "admin"
  )
    return { kind: "admin", label: "Admin", detail: "Quản trị viên" } as const;
  if (role === "deputy_admin")
    return { kind: "deputy_admin", label: "Phó Admin", detail: "Quyền theo phân công" } as const;
  // ponytail: VIP requires server-managed role + expiry; wire payment webhook when billing exists.
  const expiry = user.app_metadata?.vip_expires_at;
  if (role === "vip" && typeof expiry === "string" && Date.parse(expiry) > now) {
    const plan = user.app_metadata?.vip_plan;
    const planLabel = plan === "monthly" ? "1 tháng" : plan === "quarterly" ? "3 tháng" : plan === "yearly" ? "12 tháng" : "VIP";
    return {
      kind: "vip",
      label: `VIP ${planLabel}`,
      detail: `Hết hạn: ${new Date(expiry).toLocaleString("vi-VN")}`,
    } as const;
  }
  return { kind: "member", label: "Thành viên", detail: "Tài khoản thường" } as const;
}

export type AccountProfile = {
  displayName: string;
  avatarUrl: string;
  bio: string;
  phone: string;
  country: string;
  birthday: string;
  gender: string;
};

export function validateAccountProfile(profile: AccountProfile): AccountProfile {
  const result = Object.fromEntries(
    Object.entries(profile).map(([key, value]) => [key, value.trim()]),
  ) as AccountProfile;
  if (!result.displayName || result.displayName.length > 80)
    throw new Error("Tên phải có 1–80 ký tự.");
  if (result.bio.length > 200 || result.phone.length > 30 || result.country.length > 80)
    throw new Error("Tiểu sử, số điện thoại hoặc quốc gia quá dài.");
  if (
    result.birthday &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(result.birthday) ||
      !Number.isFinite(Date.parse(result.birthday)) ||
      new Date(result.birthday).toISOString().slice(0, 10) !== result.birthday ||
      Date.parse(result.birthday) > Date.now())
  )
    throw new Error("Ngày sinh không hợp lệ.");
  if (!["", "Nam", "Nữ", "Khác", "Không chia sẻ"].includes(result.gender))
    throw new Error("Giới tính không hợp lệ.");
  if (result.avatarUrl) {
    const dataImage = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(
      result.avatarUrl,
    );
    let https = false;
    try {
      const url = new URL(result.avatarUrl);
      https = url.protocol === "https:" && !url.username && !url.password;
    } catch {
      /* validated below */
    }
    if ((!dataImage && !https) || result.avatarUrl.length > 4 * 1024 * 1024)
      throw new Error("Ảnh phải là URL HTTPS hoặc ảnh PNG, JPEG, WebP, GIF tối đa 3MB.");
  }
  return result;
}

export type AccountFavorite = {
  slug: string;
  name: string;
  poster?: string;
  thumb?: string;
  source:
    | "kkphim"
    | "ophim"
    | "nguonc"
    | "vsmov"
    | "rapchieuphim"
    | "aiphim"
    | "thuongkhung3d"
    | "animapper";
};
export function parseAccountFavorites(raw: string | null): AccountFavorite[] {
  try {
    const rows: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(rows)) return [];
    return rows.filter(
      (row): row is AccountFavorite =>
        row &&
        typeof row.slug === "string" &&
        row.slug.trim() &&
        typeof row.name === "string" &&
        [
          "kkphim",
          "ophim",
          "nguonc",
          "vsmov",
          "rapchieuphim",
          "aiphim",
          "thuongkhung3d",
          "animapper",
        ].includes(row.source),
    );
  } catch {
    return [];
  }
}
