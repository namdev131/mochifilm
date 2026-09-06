import { mutation, query } from "./_generated/server";

const ADMIN_EMAIL = "lacviet55@proton.me";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const syncCurrent = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const email = identity.email?.toLowerCase();
    const displayName = identity.name || email?.split("@")[0] || "Thành viên Mochi";
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    const user = {
      clerkId: identity.subject,
      email,
      displayName,
      avatarUrl: identity.pictureUrl,
      role: email === ADMIN_EMAIL ? ("admin" as const) : ("member" as const),
    };

    if (existing) {
      await ctx.db.patch(existing._id, user);
      return existing._id;
    }
    return await ctx.db.insert("users", user);
  },
});
