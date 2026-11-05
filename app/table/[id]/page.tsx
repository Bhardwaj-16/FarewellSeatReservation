"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationBanner from "../../components/NotificationBanner";

const SEAT_COLORS = [
  "border-orange-500/40 bg-orange-500/10 text-orange-400",
  "border-amber-500/40 bg-amber-500/10 text-amber-400",
  "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  "border-sky-500/40 bg-sky-500/10 text-sky-400",
  "border-indigo-500/40 bg-indigo-500/10 text-indigo-400",
  "border-purple-500/40 bg-purple-500/10 text-purple-400",
  "border-pink-500/40 bg-pink-500/10 text-pink-400",
  "border-rose-500/40 bg-rose-500/10 text-rose-400",
];

export default function TableDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tableNumber = Number(params.id);

  const table = useQuery(api.tables.getTable, { tableNumber });
  const joinTable = useMutation(api.tables.joinTable);
  const leaveTable = useMutation(api.tables.leaveTable);

  const [addName, setAddName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (loading || !user || table === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading table...</p>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-4xl mb-3 text-slate-500">!</p>
        <h2 className="text-xl font-bold text-white">Table not found</h2>
        <p className="text-slate-400 text-sm mt-1">Table {tableNumber} does not exist.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Back to Floor Plan
        </button>
      </div>
    );
  }

  const members = table.members ?? [];
  const count = members.length;
  const isFull = count >= 8;
  const isEmpty = count === 0;

  // Fixed: compare by username only (rajaId vs token was always false)
  const isTableRaja = table.rajaName === user.username;
  const isUserSeatedHere = members.some((m: any) => m.username === user.username);
  const canManageTable = isTableRaja || user.isAdmin;

  async function handleClaimTable() {
    setError("");
    setSuccess("");
    setActionBusy(true);

    try {
      await joinTable({
        token: user!.token,
        tableNumber,
      });
      setSuccess(`Congratulations! You are now the Table Raja for Table ${tableNumber}!`);
    } catch (err: any) {
      setError(err.data ?? err.message ?? "Failed to join table");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = addName.toLowerCase().trim().replace(/\s+/g, "");
    if (!cleanName) return;

    setError("");
    setSuccess("");
    setActionBusy(true);

    try {
      await joinTable({
        token: user!.token,
        tableNumber,
        memberName: cleanName,
      });
      setSuccess(`Added "${cleanName}" to Table ${tableNumber}!`);
      setAddName("");
    } catch (err: any) {
      setError(err.data ?? err.message ?? "Failed to add member");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRemoveMember(targetUsername: string) {
    const isSelf = targetUsername === user!.username;
    const confirmMsg = isSelf
      ? `Are you sure you want to leave Table ${tableNumber}?`
      : `Remove "${targetUsername}" from Table ${tableNumber}?`;

    if (!confirm(confirmMsg)) return;

    setError("");
    setSuccess("");
    setActionBusy(true);

    try {
      await leaveTable({
        token: user!.token,
        tableNumber,
        memberName: targetUsername,
      });
      setSuccess(
        isSelf
          ? `You have left Table ${tableNumber}.`
          : `Removed "${targetUsername}" from Table ${tableNumber}.`
      );
    } catch (err: any) {
      setError(err.data ?? err.message ?? "Failed to remove member");
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <NotificationBanner />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60"
          >
            <span>←</span>
            <span>Floor Plan</span>
          </button>

          <div className="text-center">
            <h1 className="text-base sm:text-lg font-black text-white">
              Table {tableNumber < 10 ? `0${tableNumber}` : tableNumber}
            </h1>
            <p className="text-[11px] text-slate-400">
              {count}/8 Seats Reserved
            </p>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isFull
                ? "bg-red-500/20 text-red-400"
                : isEmpty
                ? "bg-slate-800 text-slate-400"
                : "bg-green-500/20 text-green-400"
            }`}
          >
            {isFull ? "FULL" : `${8 - count} open`}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Feedback Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="leading-snug">{error}</div>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <div className="leading-snug">{success}</div>
          </div>
        )}

        {/* Table Hero Overview Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 shadow-inner">
                <span className="text-orange-400 font-black text-2xl">
                  {tableNumber < 10 ? `0${tableNumber}` : tableNumber}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold text-orange-400 tracking-wider">
                    Banquet Table
                  </span>
                  {isTableRaja && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      You are the Table Raja
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-white mt-0.5">
                  Table {tableNumber}
                </h2>
                {table.rajaName ? (
                  <p className="text-sm font-semibold text-orange-300 flex items-center gap-1 mt-0.5">
                    <span>Table Raja:</span>
                    <span className="underline">@{table.rajaName}</span>
                  </p>
                ) : (
                  <p className="text-xs text-green-400 font-medium mt-0.5">
                    Table is empty! First to join becomes Table Raja.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Status / Leave / Claim CTA */}
            <div>
              {isEmpty ? (
                <button
                  onClick={handleClaimTable}
                  disabled={actionBusy}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-500/25 transition disabled:opacity-50"
                >
                  {actionBusy ? "Claiming..." : "Claim Table as Raja"}
                </button>
              ) : isUserSeatedHere ? (
                <button
                  onClick={() => handleRemoveMember(user.username)}
                  disabled={actionBusy}
                  className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                >
                  {actionBusy ? "Please wait..." : "Leave Table (Free Seat)"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Raja Controls Banner: Add Member */}
        {canManageTable && !isFull && (
          <div className="bg-slate-900 border border-orange-500/30 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {user.isAdmin ? "Superuser Admin: Add Member" : "Table Raja Controls: Add Member"}
                </h3>
                <p className="text-xs text-slate-400">
                  Add someone to Table {tableNumber}. Name will be saved in lowercase.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddMember} className="flex gap-2.5">
              <input
                type="text"
                value={addName}
                onChange={(e) =>
                  setAddName(e.target.value.toLowerCase().replace(/\s+/g, ""))
                }
                placeholder="Enter member's name (e.g. rahul, ananya)..."
                required
                className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
              />
              <button
                type="submit"
                disabled={actionBusy || !addName.trim()}
                className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50"
              >
                {actionBusy ? "Adding..." : "+ Add"}
              </button>
            </form>
          </div>
        )}

        {/* Regular User Notice: Table locked to Raja */}
        {!canManageTable && !isEmpty && !isUserSeatedHere && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 text-slate-400 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <div>
              <p className="font-semibold text-slate-300">
                Reserved Table (Host: @{table.rajaName})
              </p>
              <p>
                Only the Table Raja (@{table.rajaName}) or Admin can add or remove members from this table.
              </p>
            </div>
          </div>
        )}

        {/* 8 Seats Visual Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Table Seats ({count}/8)
            </h3>
            <span className="text-[11px] text-slate-500">
              8 seats total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, index) => {
              const member = members[index];
              const isSeated = Boolean(member);
              const isRaja = member && member.username === table.rajaName;
              const isMe = member && member.username === user.username;
              const colorStyle = SEAT_COLORS[index % SEAT_COLORS.length];

              return (
                <div
                  key={index}
                  className={`rounded-2xl p-4 border transition-all flex items-center justify-between gap-3 ${
                    isSeated
                      ? `${colorStyle} shadow-sm`
                      : "bg-slate-900/60 border-slate-800/80 border-dashed text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Seat Avatar Number or Initial */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSeated
                          ? "bg-white/10 shadow-inner"
                          : "bg-slate-800/70 text-slate-500"
                      }`}
                    >
                      {isSeated ? (
                        <span>{member.username.charAt(0).toUpperCase()}</span>
                      ) : (
                        <span>#{index + 1}</span>
                      )}
                    </div>

                    {/* Member Details */}
                    <div className="min-w-0">
                      {isSeated ? (
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-white truncate max-w-[130px]">
                              {member.username}
                            </span>
                            {isRaja && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                                Raja
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[10px] bg-orange-500/20 text-orange-400 font-bold px-1.5 py-0.5 rounded border border-orange-500/30">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Seat {index + 1}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            Seat {index + 1} (Empty)
                          </p>
                          <p className="text-[11px] text-slate-600">Available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Remove member */}
                  {isSeated && (canManageTable || isMe) && (
                    <button
                      onClick={() => handleRemoveMember(member.username)}
                      disabled={actionBusy}
                      className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1.5 rounded-xl font-bold transition shrink-0"
                      title={isMe ? "Leave table" : "Remove member"}
                    >
                      {isMe && !canManageTable ? "Leave" : "Remove"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
