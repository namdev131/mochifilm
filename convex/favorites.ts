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
    return await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .order("desc")
      .collect();
  },
});

export const toggle = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    poster: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const uid = await userId(ctx);
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_slug", (q) => q.eq("userId", uid).eq("slug", args.slug))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("favorites", { userId: uid, ...args, createdAt: Date.now() });
    return true;
  },
});

export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const uid = await userId(ctx);
    const row = await ctx.db
      .query("favorites")
      .withIndex("by_user_slug", (q) => q.eq("userId", uid).eq("slug", slug))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const uid = await userId(ctx);
    const rows = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", uid))
      .collect();
    await Promise.all(rows.map((row) => ctx.db.delete(row._id)));
  },
});
