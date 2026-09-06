import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("member"), v.literal("deputy_admin"), v.literal("admin")),
  }).index("by_clerk_id", ["clerkId"]),

  favorites: defineTable({
    userId: v.string(),
    slug: v.string(),
    name: v.string(),
    poster: v.optional(v.string()),
    source: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_slug", ["userId", "slug"]),

  watchHistory: defineTable({
    userId: v.string(),
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
    finished: v.boolean(),
    watchedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_slug", ["userId", "slug"]),

  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    slug: v.optional(v.string()),
    source: v.optional(v.string()),
    poster: v.optional(v.string()),
    episodeCount: v.optional(v.number()),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  ratings: defineTable({
    userId: v.string(),
    displayName: v.string(),
    slug: v.string(),
    source: v.string(),
    name: v.string(),
    poster: v.optional(v.string()),
    score: v.number(),
    review: v.optional(v.string()),
    status: v.union(v.literal("visible"), v.literal("hidden")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_user_slug", ["userId", "slug"]),

  watchParties: defineTable({
    code: v.string(),
    hostId: v.string(),
    slug: v.string(),
    source: v.string(),
    name: v.string(),
    poster: v.optional(v.string()),
    epIndex: v.number(),
    srvIndex: v.number(),
    positionSeconds: v.number(),
    isPlaying: v.boolean(),
    closed: v.boolean(),
    joinLocked: v.boolean(),
    chatMode: v.union(v.literal("all"), v.literal("host")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),

  watchPartyMembers: defineTable({
    partyId: v.id("watchParties"),
    userId: v.string(),
    displayName: v.string(),
    joinedAt: v.number(),
  })
    .index("by_party", ["partyId"])
    .index("by_party_user", ["partyId", "userId"]),

  watchPartyMessages: defineTable({
    partyId: v.id("watchParties"),
    userId: v.string(),
    displayName: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_party", ["partyId"]),

  staffPermissions: defineTable({
    userId: v.string(),
    permission: v.union(
      v.literal("watch_party.view"),
      v.literal("watch_party.warn"),
      v.literal("watch_party.close"),
    ),
    grantedBy: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
