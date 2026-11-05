"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import NotificationBanner from "./components/NotificationBanner";

export default function HomePage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const tables = useQuery(api.tables.getAllTables);
  const notifications = useQuery(api.notifications.getNotifications, {
    username: user?.username,
  });
  const initTables = useMutation(api.tables.initTables);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "open" | "full" | "my">("all");
  const [showNotifModal, setShowNotifModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && tables !== undefined && tables.length < 19) {
      initTables();
    }
  }, [user, tables, initTables]);

  const myTable = useMemo(() => {
    if (!user || !tables) return null;
    return tables.find((t: any) =>
      t.members?.some((m: any) => m.username === user.username)
    );
  }, [tables, user]);

  const stats = useMemo(() => {
    if (!tables) return { totalSeats: 152, occupied: 0, available: 152, openTables: 19 };
    const totalSeats = 19 * 8;
    const occupied = tables.reduce((acc, t) => acc + (t.members?.length ?? 0), 0);
    const available = totalSeats - occupied;
    const openTables = tables.filter((t) => (t.members?.length ?? 0) < 8).length;
    return { totalSeats, occupied, available, openTables };
  }, [tables]);

  const filteredTables = useMemo(() => {
    if (!tables) return [];
    let list = [...tables];

    if (filterMode === "open") {
      list = list.filter((t) => (t.members?.length ?? 0) < 8);
    } else if (filterMode === "full") {
      list = list.filter((t) => (t.members?.length ?? 0) >= 8);
    } else if (filterMode === "my") {
      list = list.filter((t) =>
        t.members?.some((m: any) => m.username === user?.username)
      );
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((t) => {
        const matchesTableNum = `table ${t.tableNumber}`.includes(q) || `${t.tableNumber}` === q;
        const matchesRaja = t.rajaName?.toLowerCase().includes(q);
        const matchesMember = t.members?.some((m: any) =>
          m.username.toLowerCase().includes(q)
        );
        return matchesTableNum || matchesRaja || matchesMember;
      });
    }

    return list.sort((a, b) => a.tableNumber - b.tableNumber);
  }, [tables, filterMode, searchQuery, user?.username]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading seating planner...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <NotificationBanner />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
              <span className="text-white font-black text-sm">F</span>
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base leading-tight text-white flex items-center gap-1.5">
                Farewell 2026
                <span className="hidden sm:inline text-[11px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full">
                  19 Tables
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Seating Reservation</p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Announcements Bell */}
            <button
              onClick={() => setShowNotifModal(true)}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Announcements"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notifications && notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Admin Badge/Link */}
            {user.isAdmin && (
              <button
                onClick={() => router.push("/admin")}
                className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M20 12h2M2 12h2M12 20v2M12 2v2"/>
                </svg>
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* User Info */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-orange-400 font-bold">@{user.username}</span>
              {user.isAdmin && (
                <span className="text-[10px] bg-purple-500/30 text-purple-300 font-bold px-1.5 py-0.5 rounded">
                  ADMIN
                </span>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-5 space-y-6">
        {/* User Current Seat Banner */}
        {myTable ? (
          <div className="bg-gradient-to-r from-orange-950/60 via-slate-900 to-slate-900 border border-orange-500/40 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                <span className="text-orange-400 font-black text-lg">{myTable.tableNumber}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                    Your Reserved Spot
                  </span>
                  {myTable.rajaName === user.username && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      You are the Table Raja
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                  Table {myTable.tableNumber}
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    ({myTable.members?.length ?? 0}/8 seated)
                  </span>
                </h2>
              </div>
            </div>

            <button
              onClick={() => router.push(`/table/${myTable.tableNumber}`)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-1.5"
            >
              <span>Manage Table {myTable.tableNumber}</span>
              <span>→</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  You haven&apos;t reserved a seat yet!
                </p>
                <p className="text-xs text-slate-400">
                  Select an open table below to become its{" "}
                  <span className="text-orange-400 font-semibold">Table Raja</span> or ask a Table Raja to add your name!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Tables
            </p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">19</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Capacity
            </p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              152 <span className="text-xs font-normal text-slate-500">seats</span>
            </p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5">
            <p className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
              Reserved
            </p>
            <p className="text-xl sm:text-2xl font-black text-orange-400 mt-1">
              {stats.occupied}
            </p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5">
            <p className="text-[11px] font-semibold text-green-400 uppercase tracking-wider">
              Available Seats
            </p>
            <p className="text-xl sm:text-2xl font-black text-green-400 mt-1">
              {stats.available}
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-3">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table number or person's name (e.g. rahul, table 5)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3.5 py-1.5 rounded-xl transition shrink-0 ${
                filterMode === "all"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              All Tables (19)
            </button>
            <button
              onClick={() => setFilterMode("open")}
              className={`px-3.5 py-1.5 rounded-xl transition shrink-0 ${
                filterMode === "open"
                  ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Has Empty Seats ({stats.openTables})
            </button>
            <button
              onClick={() => setFilterMode("full")}
              className={`px-3.5 py-1.5 rounded-xl transition shrink-0 ${
                filterMode === "full"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Full (8/8)
            </button>
            {myTable && (
              <button
                onClick={() => setFilterMode("my")}
                className={`px-3.5 py-1.5 rounded-xl transition shrink-0 ${
                  filterMode === "my"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                My Table (T{myTable.tableNumber})
              </button>
            )}
          </div>
        </div>

        {/* 19 Tables Visual Grid */}
        <section>
          {filteredTables.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
              <p className="text-base font-semibold text-slate-300 mb-1">No tables match your search</p>
              <p className="text-xs">Try searching a different name or clear filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTables.map((table: any) => {
                const count = table.members?.length ?? 0;
                const isFull = count >= 8;
                const isEmpty = count === 0;
                const isMine = myTable?._id === table._id;
                const isRaja = table.rajaName === user.username;

                return (
                  <div
                    key={table._id}
                    onClick={() => router.push(`/table/${table.tableNumber}`)}
                    className={`group relative rounded-3xl p-5 cursor-pointer border transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl select-none ${
                      isMine
                        ? "bg-gradient-to-b from-orange-950/40 via-slate-900 to-slate-900 border-orange-500 shadow-xl shadow-orange-500/10"
                        : isFull
                        ? "bg-slate-900/70 border-slate-800/80 hover:border-slate-700"
                        : "bg-slate-900/90 border-slate-800/90 hover:border-orange-500/50"
                    }`}
                  >
                    {/* Top status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        <span className="text-orange-400 font-black text-sm">
                          {table.tableNumber < 10 ? `0${table.tableNumber}` : table.tableNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isRaja && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                            RAJA
                          </span>
                        )}
                        {isMine && !isRaja && (
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                            YOUR SEAT
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isFull
                              ? "bg-red-500/20 text-red-400"
                              : isEmpty
                              ? "bg-slate-800 text-slate-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {count}/8
                        </span>
                      </div>
                    </div>

                    {/* Table Title */}
                    <div className="mb-3">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Table
                      </p>
                      <h3 className="text-2xl font-black text-white leading-tight">
                        {table.tableNumber < 10 ? `0${table.tableNumber}` : table.tableNumber}
                      </h3>
                      {table.rajaName ? (
                        <p className="text-xs text-orange-400 font-semibold truncate mt-0.5">
                          Raja: @{table.rajaName}
                        </p>
                      ) : (
                        <p className="text-xs text-green-400 font-medium mt-0.5">
                          Open — Be Table Raja!
                        </p>
                      )}
                    </div>

                    {/* 8 Seat Visual Dots */}
                    <div className="bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800/60 mb-3">
                      <div className="flex items-center justify-between mb-1.5 text-[10px] font-semibold text-slate-400">
                        <span>Seating Map</span>
                        <span>{8 - count} left</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {Array.from({ length: 8 }).map((_, si) => {
                          const seated = si < count;
                          const member = table.members?.[si];
                          const isThisMe = member?.username === user.username;

                          return (
                            <div
                              key={si}
                              className={`h-2.5 rounded-full transition-all ${
                                isThisMe
                                  ? "bg-orange-500 shadow-sm shadow-orange-500"
                                  : seated
                                  ? "bg-slate-400"
                                  : "bg-slate-800"
                              }`}
                              title={member ? member.username : `Seat ${si + 1} (Empty)`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Member Names Preview */}
                    <div className="text-[11px] text-slate-400 min-h-[36px] flex flex-wrap items-center gap-1">
                      {count === 0 ? (
                        <span className="text-slate-600 italic">No one seated yet</span>
                      ) : (
                        table.members?.slice(0, 4).map((m: any) => (
                          <span
                            key={m.username}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium truncate max-w-[80px] ${
                              m.username === table.rajaName
                                ? "bg-amber-500/20 text-amber-300 font-semibold"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {m.username}
                          </span>
                        ))
                      )}
                      {count > 4 && (
                        <span className="text-[10px] text-slate-500 font-semibold">
                          +{count - 4} more
                        </span>
                      )}
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-orange-400 group-hover:text-orange-300">
                      <span>{isEmpty ? "Claim as Raja" : "View Table"}</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Announcements Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <h3 className="font-bold text-lg text-white">Announcements</h3>
              </div>
              <button
                onClick={() => setShowNotifModal(false)}
                className="text-slate-400 hover:text-white text-xl p-1"
              >
                x
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {(!notifications || notifications.length === 0) ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No announcements yet
                </div>
              ) : (
                notifications.map((n: any) => (
                  <div
                    key={n._id}
                    className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs text-orange-400 font-semibold">
                      <span>By {n.sentBy}</span>
                      <span className="text-slate-500 font-normal">
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-100">{n.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowNotifModal(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
