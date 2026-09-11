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
      .query("watchHistory")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    return rows.sort((a, b) => b.watchedAt - a.watchedAt).slice(0, 60);
  },
});

export const get = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const uid = await userId(ctx);
    return await ctx.db
      .query("watchHistory")
      .withIndex("by_user_slug", (q) => q.eq("userId", uid).eq("slug", slug))
      .unique();
  },
});

export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const uid = await userId(ctx);
    const row = await ctx.db
      .query("watchHistory")
      .withIndex("by_user_slug", (q) => q.eq("userId", uid).eq("slug", slug))
      .unique();
    if (row) await ctx.db.delete(row._id);
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const uid = await userId(ctx);
    const rows = await ctx.db
      .query("watchHistory")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    await Promise.all(rows.map((row) => ctx.db.delete(row._id)));
  },
});

export const save = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    poster: v.optional(v.string()),
    source: v.string(),
    episodeSlug: v.optional(v.string()),
    episodeName: v.optional(v.string()),
    positionSeconds: v.number(),
    durationSeconds: v.number(),
    epIndex: v.number(),
    srvIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const uid = await userId(ctx);
    if (!args.slug.trim() || args.slug.length > 300 || !args.name.trim() || args.name.length > 300)
      throw new Error("Dữ liệu lịch sử không hợp lệ");
    const existing = await ctx.db
      .query("watchHistory")
      .withIndex("by_user_slug", (q) => q.eq("userId", uid).eq("slug", args.slug))
      .unique();
    const value = {
      ...args,
      userId: uid,
      positionSeconds: Math.max(0, args.positionSeconds),
      durationSeconds: Math.max(0, args.durationSeconds),
      finished: args.durationSeconds > 60 && args.positionSeconds >= args.durationSeconds - 60,
      watchedAt: Date.now(),
    };
    if (existing) await ctx.db.patch(existing._id, value);
    else await ctx.db.insert("watchHistory", value);
  },
});
