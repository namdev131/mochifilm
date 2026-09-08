import { query } from "./_generated/server";

const ADMIN_EMAILS = new Set(["lacviet55@proton.me", "admin@mochifilm.vn"]);

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email || !ADMIN_EMAILS.has(identity.email.toLowerCase())) return null;

    const [users, favorites, watchHistory, ratings, notifications, watchParties] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("favorites").collect(),
        ctx.db.query("watchHistory").collect(),
        ctx.db.query("ratings").collect(),
        ctx.db.query("notifications").collect(),
        ctx.db.query("watchParties").collect(),
      ]);

    return {
      users: users.length,
      favorites: favorites.length,
      watchHistory: watchHistory.length,
      ratings: ratings.length,
      notifications: notifications.length,
      watchParties: watchParties.length,
    };
  },
});
