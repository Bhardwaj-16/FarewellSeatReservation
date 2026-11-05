"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationBanner from "../components/NotificationBanner";

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const tables = useQuery(api.tables.getAllTables);
  const notifications = useQuery(api.notifications.getNotifications, {});

  const sendNotification = useMutation(api.notifications.sendNotification);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const joinTable = useMutation(api.tables.joinTable);
  const leaveTable = useMutation(api.tables.leaveTable);
  const resetTable = useMutation(api.tables.resetTable);

  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementTargetType, setAnnouncementTargetType] = useState<"all" | "table" | "user">("all");
  const [targetTableNum, setTargetTableNum] = useState<number>(1);
  const [targetUserVal, setTargetUserVal] = useState<string>("");
  const [sendingNotif, setSendingNotif] = useState(false);

  const [addPersonName, setAddPersonName] = useState("");
  const [addPersonTable, setAddPersonTable] = useState(1);
  const [removePersonName, setRemovePersonName] = useState("");
  const [removePersonTable, setRemovePersonTable] = useState(1);
  const [resetTableNum, setResetTableNum] = useState(1);

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (statusMessage) {
      const t = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [statusMessage]);

  if (loading || !user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Verifying admin credentials...</p>
      </div>
    );
  }

  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!announcementMsg.trim()) return;

    setSendingNotif(true);
    setStatusMessage(null);

    let target = "all";
    if (announcementTargetType === "table") {
      target = `table:${targetTableNum}`;
    } else if (announcementTargetType === "user") {
      target = `user:${targetUserVal.toLowerCase().trim()}`;
    }

    try {
      await sendNotification({
        token: user!.token,
        message: announcementMsg.trim(),
        target,
      });
      setAnnouncementMsg("");
      setStatusMessage({
        type: "success",
        text: `Announcement sent successfully (${target === "all" ? "Broadcast to everyone" : target})!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.data ?? err.message ?? "Failed to send announcement",
      });
    } finally {
      setSendingNotif(false);
    }
  }

  async function handleAdminAddMember(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = addPersonName.toLowerCase().trim();
    if (!cleanName) return;

    setStatusMessage(null);
    try {
      await joinTable({
        token: user!.token,
        tableNumber: addPersonTable,
        memberName: cleanName,
      });
      setStatusMessage({
        type: "success",
        text: `Added "${cleanName}" to Table ${addPersonTable}!`,
      });
      setAddPersonName("");
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.data ?? err.message ?? "Failed to add member",
      });
    }
  }

  async function handleAdminRemoveMember(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = removePersonName.toLowerCase().trim();
    if (!cleanName) return;

    setStatusMessage(null);
    try {
      await leaveTable({
        token: user!.token,
        tableNumber: removePersonTable,
        memberName: cleanName,
      });
      setStatusMessage({
        type: "success",
        text: `Removed "${cleanName}" from Table ${removePersonTable}!`,
      });
      setRemovePersonName("");
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.data ?? err.message ?? "Failed to remove member",
      });
    }
  }

  async function handleAdminResetTable() {
    if (!confirm(`Are you sure you want to reset Table ${resetTableNum}? This will remove all seated members.`)) {
      return;
    }

    setStatusMessage(null);
    try {
      await resetTable({
        token: user!.token,
        tableNumber: resetTableNum,
      });
      setStatusMessage({
        type: "success",
        text: `Table ${resetTableNum} has been completely reset.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.data ?? err.message ?? "Failed to reset table",
      });
    }
  }

  const sortedTables = [...(tables ?? [])].sort(
    (a, b) => a.tableNumber - b.tableNumber
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <NotificationBanner />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-purple-900/40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1"
            >
              <span>←</span>
              <span>Floor Plan</span>
            </button>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M20 12h2M2 12h2M12 20v2M12 2v2"/>
              </svg>
              <h1 className="font-extrabold text-base text-white">
                Superuser Admin Panel
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-purple-500/20 text-purple-300 font-bold px-2.5 py-1 rounded-xl border border-purple-500/30">
              Admin Authorized
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Status Notification Alert */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-start gap-3 animate-in fade-in duration-200 ${
              statusMessage.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
            <div className="leading-snug">{statusMessage.text}</div>
          </div>
        )}

        {/* SECTION 1: Announcements & Messaging */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div>
              <h2 className="text-lg font-bold text-white">
                Send Messages &amp; Announcements
              </h2>
              <p className="text-xs text-slate-400">
                Broadcast a popup notification to everyone, or target a specific table or user.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            {/* Target Selector */}
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAnnouncementTargetType("all")}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  announcementTargetType === "all"
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                Broadcast to Everyone
              </button>
              <button
                type="button"
                onClick={() => setAnnouncementTargetType("table")}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  announcementTargetType === "table"
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                Target Specific Table
              </button>
              <button
                type="button"
                onClick={() => setAnnouncementTargetType("user")}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  announcementTargetType === "user"
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                Direct to Specific User
              </button>
            </div>

            {announcementTargetType === "table" && (
              <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <label className="text-xs text-slate-400 font-bold">Select Table:</label>
                <select
                  value={targetTableNum}
                  onChange={(e) => setTargetTableNum(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500"
                >
                  {Array.from({ length: 19 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Table {n}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {announcementTargetType === "user" && (
              <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <label className="text-xs text-slate-400 font-bold">Target Username:</label>
                <input
                  type="text"
                  value={targetUserVal}
                  onChange={(e) => setTargetUserVal(e.target.value.toLowerCase().trim())}
                  placeholder="e.g. rahul"
                  required
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 flex-1 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            <div>
              <textarea
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                placeholder="Type notification message here..."
                rows={3}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sendingNotif || !announcementMsg.trim()}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50"
            >
              {sendingNotif ? "Sending..." : "Send Notification Popup"}
            </button>
          </form>

          {/* Active Notifications List */}
          {notifications && notifications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Announcements ({notifications.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {notifications.map((n: any) => (
                  <div
                    key={n._id}
                    className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-400">@{n.sentBy}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          {n.target || "all"}
                        </span>
                      </div>
                      <p className="text-slate-200 mt-1">{n.message}</p>
                    </div>
                    <button
                      onClick={() => deleteNotification({ token: user.token, id: n._id })}
                      className="text-red-400 hover:text-red-300 text-[11px] font-bold bg-red-500/10 px-2 py-1 rounded-lg shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: Table Member Management Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Add Person */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <h3 className="text-sm font-bold text-white">
                Add Person to Any Table
              </h3>
            </div>
            <form onSubmit={handleAdminAddMember} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Person&apos;s Name (stored lowercase)
                </label>
                <input
                  type="text"
                  value={addPersonName}
                  onChange={(e) => setAddPersonName(e.target.value.toLowerCase())}
                  placeholder="e.g. rohit"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Table Number
                </label>
                <select
                  value={addPersonTable}
                  onChange={(e) => setAddPersonTable(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500"
                >
                  {Array.from({ length: 19 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Table {n}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={!addPersonName.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2.5 rounded-xl transition disabled:opacity-50"
              >
                + Add to Table {addPersonTable}
              </button>
            </form>
          </section>

          {/* Remove Person */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <h3 className="text-sm font-bold text-white">
                Remove Person from Any Table
              </h3>
            </div>
            <form onSubmit={handleAdminRemoveMember} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Person&apos;s Name
                </label>
                <input
                  type="text"
                  value={removePersonName}
                  onChange={(e) => setRemovePersonName(e.target.value.toLowerCase())}
                  placeholder="e.g. rohit"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Table Number
                </label>
                <select
                  value={removePersonTable}
                  onChange={(e) => setRemovePersonTable(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  {Array.from({ length: 19 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Table {n}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={!removePersonName.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl transition disabled:opacity-50"
              >
                - Remove from Table {removePersonTable}
              </button>
            </form>
          </section>
        </div>

        {/* SECTION 3: Reset Table Override */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
            <h3 className="text-sm font-bold text-white">
              Reset Entire Table (Emergency Clear)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Clears all 8 seats of a table and clears the Table Raja status so the table becomes completely open again.
          </p>
          <div className="flex items-center gap-3 max-w-md">
            <select
              value={resetTableNum}
              onChange={(e) => setResetTableNum(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              {Array.from({ length: 19 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Table {n}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdminResetTable}
              className="bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white font-bold text-xs px-4 py-2 rounded-xl border border-slate-700 transition"
            >
              Clear Table {resetTableNum}
            </button>
          </div>
        </section>

        {/* SECTION 4: Live 19 Tables Overview */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <h3 className="text-sm font-bold text-white">
                Live Overview of All 19 Tables
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Total 19 tables x 8 seats = 152 seats
            </span>
          </div>

          <div className="space-y-2">
            {sortedTables.map((t: any) => {
              const count = t.members?.length ?? 0;
              return (
                <div
                  key={t._id}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-orange-400 w-16">
                      Table {t.tableNumber < 10 ? `0${t.tableNumber}` : t.tableNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {t.rajaName ? `@${t.rajaName} (Raja)` : "Open"}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-1 px-2">
                    {t.members?.map((m: any) => (
                      <span
                        key={m.username}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          m.username === t.rajaName
                            ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {m.username === t.rajaName ? "[Raja] " : ""}{m.username}
                      </span>
                    ))}
                    {count === 0 && (
                      <span className="text-slate-600 italic">Empty table</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        count >= 8
                          ? "bg-red-500/20 text-red-400"
                          : count === 0
                          ? "bg-slate-800 text-slate-500"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {count}/8
                    </span>
                    <button
                      onClick={() => router.push(`/table/${t.tableNumber}`)}
                      className="text-orange-400 hover:text-orange-300 font-bold underline"
                    >
                      Inspect →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
