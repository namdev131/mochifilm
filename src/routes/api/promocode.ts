import { createFileRoute } from "@tanstack/react-router";
import { Pool } from "pg";

let pool: Pool | undefined;
const db = () => (pool ??= new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 }));
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store" } });
const hashCode = async (code: string) => Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code))).toString("hex");

async function handler(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return json({ error: "Vui lòng đăng nhập" }, 401);
  const auth = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, authorization: `Bearer ${token}` } });
  const user = auth.ok ? await auth.json() as { id?: string; email?: string } : null;
  if (!user?.id) return json({ error: "Phiên đăng nhập không hợp lệ" }, 401);

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,32}$/.test(code)) return json({ error: "Promocode phải có 6-32 ký tự A-Z, 0-9 hoặc dấu gạch ngang" }, 400);

  const client = await db().connect();
  try {
    await client.query("begin");
    const promo = await client.query<{ id: string; vip_expires_at: string }>(
      "select id,vip_expires_at from public.vip_promocodes where code_hash=$1 and redeemed_by is null and vip_expires_at>now() for update",
      [await hashCode(code)],
    );
    if (!promo.rowCount) {
      await client.query("rollback");
      return json({ error: "Promocode không hợp lệ, đã dùng hoặc đã hết hạn" }, 400);
    }
    const row = promo.rows[0];
    const target = await client.query<{ role: string | null }>(
      "select raw_app_meta_data->>'role' role from auth.users where id=$1 for update",
      [user.id],
    );
    if (["admin", "deputy_admin"].includes(target.rows[0]?.role ?? "")) {
      await client.query("rollback");
      return json({ error: "Tài khoản quản trị không thể dùng promocode VIP" }, 403);
    }
    await client.query("update public.vip_promocodes set redeemed_by=$2,redeemed_at=now() where id=$1", [row.id, user.id]);
    await client.query(
      `update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}')
       ||jsonb_build_object('role','vip','vip_plan','promocode','vip_expires_at',$2::text) where id=$1`,
      [user.id, row.vip_expires_at],
    );
    await client.query(
      `insert into public.admin_audit_log(actor_id,action,target_type,target_id,details)
       values($1,'user.vip.promocode.redeem','promocode',$2,jsonb_build_object('vip_expires_at',$3::text))`,
      [user.id, row.id, row.vip_expires_at],
    );
    await client.query("commit");
    return json({ ok: true, vip_expires_at: row.vip_expires_at });
  } catch (error) {
    await client.query("rollback");
    console.error("[promocode]", error);
    return json({ error: "Không thể áp dụng promocode" }, 500);
  } finally {
    client.release();
  }
}

export const Route = createFileRoute("/api/promocode")({ server: { handlers: { POST: ({ request }) => handler(request) } } });
