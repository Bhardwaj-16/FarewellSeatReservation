import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(), // lowercase
    passwordHash: v.string(),
    isAdmin: v.boolean(),
    createdAt: v.optional(v.number()),
  }).index("by_username", ["username"]),

  tables: defineTable({
    tableNumber: v.number(), // 1 to 19
    rajaId: v.optional(v.id("users")),
    rajaName: v.optional(v.string()), // lowercase
    members: v.array(
      v.object({
        userId: v.id("users"),
        username: v.string(), // lowercase
        joinedAt: v.optional(v.number()),
      })
    ),
  }).index("by_tableNumber", ["tableNumber"]),

  notifications: defineTable({
    message: v.string(),
    sentBy: v.string(), // "admin" or username
    target: v.optional(v.string()), // "all", "table:X", "user:xyz"
    createdAt: v.number(),
  }),

  sessions: defineTable({
    userId: v.id("users"),
    username: v.string(),
    isAdmin: v.boolean(),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
});
