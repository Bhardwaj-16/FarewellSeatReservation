"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function NotificationBanner() {
  const { user } = useAuth();
  const notifications = useQuery(api.notifications.getNotifications, {
    username: user?.username,
  });

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [toastNotification, setToastNotification] = useState<any | null>(null);

  const activeNotifs = (notifications ?? []).filter(
    (n: any) => !dismissed.has(n._id)
  );

  useEffect(() => {
    if (activeNotifs.length > 0) {
      const latest = activeNotifs[0];
      setToastNotification(latest);
    } else {
      setToastNotification(null);
    }
  }, [activeNotifs.length]);

  return (
    <>
      {/* Live Floating Notification Toast Popup */}
      {toastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-md animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white rounded-2xl shadow-2xl shadow-orange-500/30 p-4 border border-orange-400/40 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-100">
                    Announcement
                  </span>
                  {toastNotification.target && toastNotification.target !== "all" && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                      {toastNotification.target}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium mt-1 leading-snug break-words">
                  {toastNotification.message}
                </p>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/20 text-[11px] text-orange-100/80">
                  <span>From: {toastNotification.sentBy}</span>
                  <button
                    onClick={() => {
                      setDismissed((prev) => new Set([...prev, toastNotification._id]));
                      setToastNotification(null);
                    }}
                    className="font-bold underline hover:text-white"
                  >
                    Got it, Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setDismissed((prev) => new Set([...prev, toastNotification._id]));
                  setToastNotification(null);
                }}
                className="text-white/80 hover:text-white text-xl leading-none p-1"
                aria-label="Close"
              >
                x
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
