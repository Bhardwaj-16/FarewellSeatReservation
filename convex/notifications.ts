import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function verifyAdmin(ctx: any, token: string) {
  if (!token) throw new Error("Not authenticated");
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Session expired. Please log in again.");
  }
  if (!session.isAdmin) {
    throw new Error("Admin privileges required");
  }
  return session;
}

export const getNotifications = query({
  args: {
    username: v.optional(v.string()),
    tableNumber: v.optional(v.number()),
  },
  handler: async (ctx, { username, tableNumber }) => {
    const all = await ctx.db.query("notifications").order("desc").take(30);

    const userLower = username?.toLowerCase().trim();

    return all.filter((n) => {
      if (!n.target || n.target === "all") return true;
      if (userLower && n.target === `user:${userLower}`) return true;
      if (tableNumber && n.target === `table:${tableNumber}`) return true;
      return false;
    });
  },
});

export const sendNotification = mutation({
  args: {
    token: v.string(),
    message: v.string(),
    target: v.optional(v.string()), // "all" | "table:X" | "user:username"
  },
  handler: async (ctx, { token, message, target }) => {
    const admin = await verifyAdmin(ctx, token);
    const trimmed = message.trim();
    if (!trimmed) throw new Error("Notification message cannot be empty");

    const normalizedTarget = (target || "all").toLowerCase().trim();

    const notifId = await ctx.db.insert("notifications", {
      message: trimmed,
      sentBy: admin.username,
      target: normalizedTarget,
      createdAt: Date.now(),
    });

    return { success: true, notifId };
  },
});

export const deleteNotification = mutation({
  args: {
    token: v.string(),
    id: v.id("notifications"),
  },
  handler: async (ctx, { token, id }) => {
    await verifyAdmin(ctx, token);
    await ctx.db.delete(id);
    return { success: true };
  },
});

export const clearAllNotifications = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    await verifyAdmin(ctx, token);
    const all = await ctx.db.query("notifications").collect();
    for (const n of all) {
      await ctx.db.delete(n._id);
    }
    return { success: true, count: all.length };
  },
});
