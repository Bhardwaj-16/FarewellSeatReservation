import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const register = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const lower = username.toLowerCase().trim();
    if (!lower || lower.length < 2) {
      throw new Error("Username must be at least 2 characters");
    }
    if (!password || password.length < 3) {
      throw new Error("Password must be at least 3 characters");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", lower))
      .first();
    if (existing) {
      throw new Error(`Username "${lower}" is already taken`);
    }

    const passwordHash = await hashPassword(password);
    const isAdmin = lower === "admin" && password === "4469";

    const userId = await ctx.db.insert("users", {
      username: lower,
      passwordHash,
      isAdmin,
      createdAt: Date.now(),
    });

    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      username: lower,
      isAdmin,
      token,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
    });

    return { token, username: lower, isAdmin };
  },
});

export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const lower = username.toLowerCase().trim();
    const isAdminLogin = lower === "admin" && password === "4469";
    const passwordHash = await hashPassword(password);

    let user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", lower))
      .first();

    // Auto-create or elevate superuser if using the correct admin pass
    if (isAdminLogin) {
      if (!user) {
        const userId = await ctx.db.insert("users", {
          username: lower,
          passwordHash,
          isAdmin: true,
          createdAt: Date.now(),
        });
        const token = generateToken();
        await ctx.db.insert("sessions", {
          userId,
          username: lower,
          isAdmin: true,
          token,
          expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
        });
        return { token, username: lower, isAdmin: true };
      } else {
        if (!user.isAdmin) {
          await ctx.db.patch(user._id, { isAdmin: true });
        }
      }
    }

    if (!user) {
      throw new Error("Account not found. Please create an account first.");
    }

    if (!isAdminLogin && user.passwordHash !== passwordHash) {
      throw new Error("Incorrect password. Please try again.");
    }

    const finalIsAdmin = user.isAdmin || isAdminLogin;
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      username: user.username,
      isAdmin: finalIsAdmin,
      token,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    });

    return { token, username: user.username, isAdmin: finalIsAdmin };
  },
});

export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!token) return null;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;
    return {
      userId: session.userId,
      username: session.username,
      isAdmin: session.isAdmin,
    };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});
