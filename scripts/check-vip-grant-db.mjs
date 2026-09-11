import assert from "node:assert/strict";
import { Client } from "pg";

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query("begin");
  const user = await client.query(
    "select id from auth.users where lower(email)=$1 limit 1 for update",
    ["nometech13@gmail.com"],
  );
  assert(user.rowCount, "Test user missing");
  await client.query(
    `update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}')
     ||jsonb_build_object('role','vip','vip_plan',$2::text,'vip_expires_at',
       (greatest(now(),coalesce(nullif(raw_app_meta_data->>'vip_expires_at','')::timestamptz,now()))+make_interval(days => $3::int))::text)
     where id=$1`,
    [user.rows[0].id, "monthly", 30],
  );
  console.log("VIP grant DB transaction passed");
} finally {
  await client.query("rollback");
  await client.end();
}
