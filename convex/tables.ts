import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

async function verifySession(ctx: any, token: string) {
  if (!token) throw new Error("Not authenticated. Please log in.");
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Session expired or invalid. Please log in again.");
  }
  return session;
}

export const getAllTables = query({
  args: {},
  handler: async (ctx) => {
    const tables = await ctx.db.query("tables").collect();
    return tables.sort((a, b) => a.tableNumber - b.tableNumber);
  },
});

export const getTable = query({
  args: { tableNumber: v.number() },
  handler: async (ctx, { tableNumber }) => {
    return await ctx.db
      .query("tables")
      .withIndex("by_tableNumber", (q) => q.eq("tableNumber", tableNumber))
      .first();
  },
});

// Idempotent table initialiser for tables 1 to 19
export const initTables = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("tables").collect();
    const existingNumbers = new Set(existing.map((t) => t.tableNumber));

    for (let i = 1; i <= 19; i++) {
      if (!existingNumbers.has(i)) {
        await ctx.db.insert("tables", {
          tableNumber: i,
          rajaId: undefined,
          rajaName: undefined,
          members: [],
        });
      }
    }
  },
});

export const joinTable = mutation({
  args: {
    token: v.string(),
    tableNumber: v.number(),
    memberName: v.optional(v.string()), // Raja or Admin adding a friend by name
  },
  handler: async (ctx, { token, tableNumber, memberName }) => {
    const session = await verifySession(ctx, token);

    // Normalize target name to lowercase
    const targetName = (memberName || session.username).toLowerCase().trim();

    if (!targetName) {
      throw new Error("Name cannot be empty");
    }

    // 1. Check duplicate across ALL tables
    const allTables = await ctx.db.query("tables").collect();
    for (const t of allTables) {
      const match = t.members?.find((m: any) => m.username === targetName);
      if (match) {
        if (t.tableNumber === tableNumber) {
          throw new Error(`"${targetName}" is already at Table ${tableNumber}`);
        }
        throw new Error(
          `"${targetName}" is already seated at Table ${t.tableNumber}`
        );
      }
    }

    // 2. Fetch the target table
    const table = await ctx.db
      .query("tables")
      .withIndex("by_tableNumber", (q) => q.eq("tableNumber", tableNumber))
      .first();

    if (!table) {
      throw new Error(`Table ${tableNumber} not found`);
    }

    const currentMembers = table.members ?? [];
    if (currentMembers.length >= 8) {
      throw new Error(`Table ${tableNumber} is full (8 seats max)`);
    }

    const isTableEmpty = currentMembers.length === 0;
    const isRaja =
      table.rajaId === session.userId || table.rajaName === session.username;
    const isAddingSelf = targetName === session.username;

    // 3. Permission checks:
    // If table is NOT empty:
    // Only the Table Raja or Superuser Admin can add members!
    if (!isTableEmpty && !isRaja && !session.isAdmin) {
      throw new Error(
        `Table ${tableNumber} is reserved by Table Raja (@${table.rajaName}). Only the Table Raja or Admin can add members.`
      );
    }

    // Determine the userId for the added member
    let memberUserId: Id<"users"> = session.userId;
    if (targetName !== session.username) {
      const userDoc = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", targetName))
        .first();
      if (userDoc) {
        memberUserId = userDoc._id;
      }
    }

    const newMembers = [
      ...currentMembers,
      {
        userId: memberUserId,
        username: targetName,
        joinedAt: Date.now(),
      },
    ];

    // If first to get into the table, becomes the Table Raja!
    if (isTableEmpty) {
      await ctx.db.patch(table._id, {
        members: newMembers,
        rajaId: memberUserId,
        rajaName: targetName,
      });
    } else {
      await ctx.db.patch(table._id, {
        members: newMembers,
      });
    }

    return { success: true, tableNumber, targetName };
  },
});

export const leaveTable = mutation({
  args: {
    token: v.string(),
    tableNumber: v.number(),
    memberName: v.optional(v.string()), // Target to remove
  },
  handler: async (ctx, { token, tableNumber, memberName }) => {
    const session = await verifySession(ctx, token);

    const table = await ctx.db
      .query("tables")
      .withIndex("by_tableNumber", (q) => q.eq("tableNumber", tableNumber))
      .first();

    if (!table) {
      throw new Error(`Table ${tableNumber} not found`);
    }

    const targetName = (memberName || session.username).toLowerCase().trim();

    const isMember = table.members?.some((m: any) => m.username === targetName);
    if (!isMember) {
      throw new Error(`"${targetName}" is not seated at Table ${tableNumber}`);
    }

    const isRaja =
      table.rajaId === session.userId || table.rajaName === session.username;
    const isRemovingSelf = targetName === session.username;

    // Permission check:
    // Superuser Admin can remove anyone from any table.
    // Table Raja can remove anyone from their own table.
    // A regular user can remove themselves (leave table).
    if (!session.isAdmin && !isRaja && !isRemovingSelf) {
      throw new Error(
        "Only the Table Raja or Admin can remove members from this table"
      );
    }

    const newMembers = (table.members ?? []).filter(
      (m: any) => m.username !== targetName
    );

    let nextRajaId = table.rajaId;
    let nextRajaName = table.rajaName;

    // If the person leaving is the Raja:
    if (targetName === table.rajaName) {
      if (newMembers.length > 0) {
        // Pass the crown to the next seated member
        nextRajaId = newMembers[0].userId;
        nextRajaName = newMembers[0].username;
      } else {
        // Table is now empty, reset raja
        nextRajaId = undefined;
        nextRajaName = undefined;
      }
    }

    await ctx.db.patch(table._id, {
      members: newMembers,
      rajaId: nextRajaId,
      rajaName: nextRajaName,
    });

    return { success: true, tableNumber, removedName: targetName };
  },
});

// Admin override to completely reset a table
export const resetTable = mutation({
  args: {
    token: v.string(),
    tableNumber: v.number(),
  },
  handler: async (ctx, { token, tableNumber }) => {
    const session = await verifySession(ctx, token);
    if (!session.isAdmin) {
      throw new Error("Admin privileges required to reset table");
    }

    const table = await ctx.db
      .query("tables")
      .withIndex("by_tableNumber", (q) => q.eq("tableNumber", tableNumber))
      .first();

    if (table) {
      await ctx.db.patch(table._id, {
        members: [],
        rajaId: undefined,
        rajaName: undefined,
      });
    }
  },
});
