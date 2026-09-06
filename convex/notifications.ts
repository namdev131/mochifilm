import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function userId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const uid = await userId(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const uid = await userId(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== uid) throw new Error("Forbidden");
    await ctx.db.patch(id, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const uid = await userId(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    await Promise.all(
      rows.filter((row) => !row.read).map((row) => ctx.db.patch(row._id, { read: true })),
    );
  },
});
