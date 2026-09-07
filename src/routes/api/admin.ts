import { createFileRoute } from "@tanstack/react-router";
import { Pool, type PoolClient } from "pg";

const ADMIN_EMAIL = "lacviet55@proton.me";
const PERMISSIONS = [
  "users.view",
  "users.manage",
  "comments.view",
  "comments.moderate",
  "watch_party.view",
  "watch_party.warn",
  "watch_party.lock",
  "watch_party.close",
  "sources.view",
] as const;
type Permission = (typeof PERMISSIONS)[number];
type Actor = { id: string; email: string; isMainAdmin: boolean; permissions: Set<string> };
let pool: Pool | undefined;

function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  return (pool ??= new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 2 }));
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

async function verifyActor(request: Request): Promise<Actor | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return null;
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as {
    id?: string;
    email?: string;
    app_metadata?: { role?: string };
  };
  if (!user.id || !user.email) return null;
  const email = user.email.toLowerCase();
  const isMainAdmin = email === ADMIN_EMAIL;
  const isDeputy = user.app_metadata?.role === "deputy_admin";
  const permissions = isDeputy
    ? new Set<string>(
        (
          await db().query<{ permission: string }>(
            "select permission from public.staff_permissions where user_id=$1",
            [user.id],
          )
        ).rows.map((row) => row.permission),
      )
    : new Set<string>();
  if (!isMainAdmin && !isDeputy) return null;
  return { id: user.id, email, isMainAdmin, permissions };
}

function can(actor: Actor, permission: Permission) {
  return actor.isMainAdmin || actor.permissions.has(permission);
}

async function listUsers() {
  const { rows } = await db().query(
    `select u.id, u.email, u.raw_user_meta_data->>'display_name' as display_name,
            case when lower(u.email)=$1 then 'admin'
                 when u.raw_app_meta_data->>'role'='deputy_admin' then 'deputy_admin'
                 else 'member' end as role,
            u.created_at, u.last_sign_in_at, u.banned_until,
            coalesce(array_remove(array_agg(sp.permission),null),'{}') as permissions
     from auth.users u left join public.staff_permissions sp on sp.user_id=u.id
     group by u.id order by u.created_at desc limit 500`,
    [ADMIN_EMAIL],
  );
  return rows;
}

async function listParties() {
  const exists = await db().query("select to_regclass('public.watch_parties') as name");
  if (!exists.rows[0]?.name) return [];
  return (
    await db()
      .query(`select p.id,p.code,p.name,p.host_id,u.email as host_email,p.closed,p.join_locked,
      p.created_at,p.updated_at,
      (select count(*)::int from public.watch_party_members m where m.party_id=p.id) member_count,
      (select count(*)::int from public.watch_party_messages x where x.party_id=p.id) message_count
      from public.watch_parties p left join auth.users u on u.id=p.host_id
      order by p.created_at desc limit 300`)
  ).rows;
}

async function listComments() {
  return (
    await db().query(`select c.id,coalesce(p.display_name,u.email,'Thành viên') user_name,
      coalesce(u.email,'') user_email,c.slug movie_title,c.content,c.created_at,
      coalesce(c.moderation_status,'pending') status
      from public.movie_comments c left join auth.users u on u.id=c.user_id
      left join public.profiles p on p.id=c.user_id order by c.created_at desc limit 300`)
  ).rows;
}

async function listAuditLog() {
  return (
    await db()
      .query(`select a.id::text,u.email actor_email,a.action,a.target_type,a.target_id,a.details,a.created_at
      from public.admin_audit_log a left join auth.users u on u.id=a.actor_id
      order by a.created_at desc limit 30`)
  ).rows;
}

async function audit(
  client: Pick<PoolClient, "query">,
  actor: Actor,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
) {
  await client.query(
    `insert into public.admin_audit_log(actor_id,action,target_type,target_id,details)
     values($1,$2,$3,$4,$5::jsonb)`,
    [actor.id, action, targetType, targetId, JSON.stringify(details)],
  );
}

async function transaction(run: (client: PoolClient) => Promise<Response>) {
  const client = await db().connect();
  try {
    await client.query("begin");
    const response = await run(client);
    if (response.ok) await client.query("commit");
    else await client.query("rollback");
    return response;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function mutateParty(
  actor: Actor,
  partyId: string,
  action: "warnParty" | "lockParty" | "closeParty",
  body: Record<string, unknown>,
) {
  return transaction(async (client) => {
    const party = await client.query<{ join_locked: boolean }>(
      "select join_locked from public.watch_parties where id=$1 and closed=false for update",
      [partyId],
    );
    if (!party.rowCount) return json({ error: "Phòng không tồn tại hoặc đã đóng" }, 404);
    if (action === "warnParty") {
      const message = String(body.message ?? "").trim();
      if (!message || message.length > 300)
        return json({ error: "Cảnh báo phải có từ 1 đến 300 ký tự" }, 400);
      const recent = await client.query(
        "select 1 from public.watch_party_warnings where party_id=$1 and created_at>now()-interval '10 seconds' limit 1",
        [partyId],
      );
      if (recent.rowCount)
        return json({ error: "Mỗi phòng chỉ nhận một cảnh báo trong 10 giây" }, 429);
      await client.query(
        "insert into public.watch_party_warnings(party_id,actor_id,message) values($1,$2,$3)",
        [partyId, actor.id, message],
      );
      await audit(client, actor, "watch_party.warn", "watch_party", partyId, { message });
    } else if (action === "lockParty") {
      const locked = body.locked === true;
      await client.query(
        "update public.watch_parties set join_locked=$2,updated_at=now() where id=$1",
        [partyId, locked],
      );
      await audit(client, actor, "watch_party.lock", "watch_party", partyId, { locked });
    } else {
      await client.query(
        "update public.watch_parties set closed=true,updated_at=now() where id=$1",
        [partyId],
      );
      await audit(client, actor, "watch_party.close", "watch_party", partyId);
    }
    return json({ ok: true });
  });
}

async function moderateComment(actor: Actor, id: string, status: "approved" | "hidden") {
  return transaction(async (client) => {
    const target = await client.query(
      `update public.movie_comments set moderation_status=$2,moderated_by=$3,moderated_at=now(),updated_at=now()
       where id=$1 returning id`,
      [id, status, actor.id],
    );
    if (!target.rowCount) return json({ error: "Không tìm thấy bình luận" }, 404);
    await audit(client, actor, `comment.${status}`, "comment", id);
    return json({ ok: true });
  });
}

async function handler(request: Request) {
  try {
    const actor = await verifyActor(request);
    if (!actor) return json({ error: "Forbidden" }, 403);
    if (request.method === "GET") {
      return json({
        users: can(actor, "users.view") ? await listUsers() : [],
        comments: can(actor, "comments.view") ? await listComments() : [],
        parties: can(actor, "watch_party.view") ? await listParties() : [],
        auditLog: actor.isMainAdmin ? await listAuditLog() : [],
        permissions: actor.isMainAdmin ? PERMISSIONS : [...actor.permissions],
        isMainAdmin: actor.isMainAdmin,
      });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    const partyActions = {
      warnParty: "watch_party.warn",
      lockParty: "watch_party.lock",
      closeParty: "watch_party.close",
    } as const;
    if (action in partyActions) {
      const typedAction = action as keyof typeof partyActions;
      if (!can(actor, partyActions[typedAction]))
        return json({ error: `Thiếu quyền ${partyActions[typedAction]}` }, 403);
      const id = String(body.id ?? "").trim();
      if (!id) return json({ error: "Thiếu phòng" }, 400);
      return mutateParty(actor, id, typedAction, body);
    }
    if (action === "moderateComment") {
      if (!can(actor, "comments.moderate"))
        return json({ error: "Thiếu quyền comments.moderate" }, 403);
      const id = String(body.id ?? "").trim();
      const status =
        body.status === "approved" ? "approved" : body.status === "hidden" ? "hidden" : null;
      if (!id || !status) return json({ error: "Dữ liệu kiểm duyệt không hợp lệ" }, 400);
      return moderateComment(actor, id, status);
    }
    if (action === "deleteComment") {
      if (!can(actor, "comments.moderate"))
        return json({ error: "Thiếu quyền comments.moderate" }, 403);
      const id = String(body.id ?? "").trim();
      if (!id) return json({ error: "Thiếu bình luận" }, 400);
      return transaction(async (client) => {
        const target = await client.query(
          "delete from public.movie_comments where id=$1 returning id",
          [id],
        );
        if (!target.rowCount) return json({ error: "Không tìm thấy bình luận" }, 404);
        await audit(client, actor, "comment.delete", "comment", id);
        return json({ ok: true });
      });
    }

    if (!actor.isMainAdmin) return json({ error: "Chỉ Admin chính được quản trị tài khoản" }, 403);
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    if ((action === "createUser" || action === "deleteUser") && (!serviceKey || !supabaseUrl))
      return json({ error: "Thiếu cấu hình Supabase Admin API" }, 503);

    if (action === "createUser") {
      const email = String(body.email ?? "")
        .trim()
        .toLowerCase();
      const password = String(body.password ?? "");
      const displayName = String(body.displayName ?? "").trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email) || password.length < 8 || password.length > 72)
        return json({ error: "Email không hợp lệ hoặc mật khẩu phải có 8-72 ký tự" }, 400);
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: serviceKey!,
          authorization: `Bearer ${serviceKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: displayName || email.split("@")[0] },
        }),
      });
      const result = (await response.json()) as { id?: string; msg?: string; message?: string };
      if (!response.ok)
        return json(
          { error: result.msg || result.message || "Không tạo được người dùng" },
          response.status,
        );
      if (body.role === "deputy_admin" && result.id) {
        await db().query(
          "update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}')||'{\"role\":\"deputy_admin\"}' where id=$1",
          [result.id],
        );
      }
      return json({ ok: true });
    }
    if (action === "deleteUser") {
      const id = String(body.id ?? "").trim();
      const target = await db().query("select lower(email) email from auth.users where id=$1", [
        id,
      ]);
      if (!id || id === actor.id || target.rows[0]?.email === ADMIN_EMAIL)
        return json({ error: "Không thể xóa Admin chính" }, 403);
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { apikey: serviceKey!, authorization: `Bearer ${serviceKey}` },
      });
      return response.ok
        ? json({ ok: true })
        : json({ error: "Không xóa được người dùng" }, response.status);
    }
    if (action === "setDeputy") {
      const id = String(body.id ?? "").trim();
      const enabled = body.enabled === true;
      const target = await db().query("select lower(email) email from auth.users where id=$1", [
        id,
      ]);
      if (!target.rowCount) return json({ error: "Không tìm thấy tài khoản" }, 404);
      if (target.rows[0].email === ADMIN_EMAIL)
        return json({ error: "Không thể thao tác với Admin chính" }, 403);
      return transaction(async (client) => {
        await client.query(
          enabled
            ? "update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}')||'{\"role\":\"deputy_admin\"}' where id=$1"
            : "update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}')-'role' where id=$1",
          [id],
        );
        if (!enabled)
          await client.query("delete from public.staff_permissions where user_id=$1", [id]);
        await audit(client, actor, enabled ? "user.promote" : "user.demote", "user", id);
        return json({ ok: true });
      });
    }
    if (action === "setPermission") {
      const id = String(body.id ?? "").trim();
      const permission = String(body.permission ?? "") as Permission;
      const enabled = body.enabled === true;
      if (!id || !PERMISSIONS.includes(permission))
        return json({ error: "Quyền không hợp lệ" }, 400);
      return transaction(async (client) => {
        const target = await client.query(
          "select raw_app_meta_data->>'role' role,lower(email) email from auth.users where id=$1 for update",
          [id],
        );
        if (!target.rowCount) return json({ error: "Không tìm thấy tài khoản" }, 404);
        if (target.rows[0].email === ADMIN_EMAIL)
          return json({ error: "Admin chính luôn có toàn quyền" }, 403);
        if (target.rows[0].role !== "deputy_admin")
          return json({ error: "Chỉ cấp quyền cho Phó Admin" }, 400);
        if (enabled)
          await client.query(
            "insert into public.staff_permissions(user_id,permission,granted_by) values($1,$2,$3) on conflict(user_id,permission) do update set granted_by=excluded.granted_by",
            [id, permission, actor.id],
          );
        else
          await client.query(
            "delete from public.staff_permissions where user_id=$1 and permission=$2",
            [id, permission],
          );
        await audit(client, actor, "permission.set", "user", id, { permission, enabled });
        return json({ ok: true });
      });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("[admin]", error);
    return json({ error: error instanceof Error ? error.message : "Server error" }, 500);
  }
}

export const Route = createFileRoute("/api/admin")({
  server: {
    handlers: { GET: ({ request }) => handler(request), POST: ({ request }) => handler(request) },
  },
});
