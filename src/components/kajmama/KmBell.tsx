"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { kmApi } from "@/lib/kajmama/client";
import { KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { useKm } from "./KmSession";

type Note = {
  id: string;
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  href: string;
  read: boolean;
  createdAt: string;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function enablePush(publicKey: string) {
  if (!("Notification" in window)) return "unsupported" as const;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? ("denied" as const) : ("denied" as const);
  try {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const reg = await navigator.serviceWorker.register("/kajmama-sw.js", { scope: "/kajmama/" });
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await kmApi("/api/kajmama/notifications", {
        method: "POST",
        body: JSON.stringify({ action: "subscribe", endpoint: json.endpoint, keys: json.keys }),
      });
      return "granted" as const;
    }
    await kmApi("/api/kajmama/notifications", {
      method: "POST",
      body: JSON.stringify({ action: "subscribe", permissionOnly: true }),
    });
    return "granted" as const;
  } catch {
    await kmApi("/api/kajmama/notifications", {
      method: "POST",
      body: JSON.stringify({ action: "subscribe", permissionOnly: true }),
    });
    return "granted" as const;
  }
}

export function KmBell() {
  const { lang, user } = useKm();
  const bn = lang === "bn";
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [vapid, setVapid] = useState("");
  const [pushOn, setPushOn] = useState(false);
  const [pushMsg, setPushMsg] = useState("");
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const d = await kmApi<{
      notifications: Note[];
      unread: number;
      vapidPublicKey?: string;
      pushOn?: boolean;
    }>("/api/kajmama/notifications");
    setNotes(d.notifications || []);
    setUnread(d.unread || 0);
    setVapid(d.vapidPublicKey || "");
    setPushOn(!!d.pushOn);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let live = true;
    kmApi<{ notifications: Note[]; unread: number; vapidPublicKey?: string; pushOn?: boolean }>(
      "/api/kajmama/notifications",
    )
      .then((d) => {
        if (!live) return;
        setNotes(d.notifications || []);
        setUnread(d.unread || 0);
        setVapid(d.vapidPublicKey || "");
        setPushOn(!!d.pushOn);
      })
      .catch(() => {
        if (live) setNotes([]);
      });
    const t = window.setInterval(() => {
      void load();
    }, 25000);
    return () => {
      live = false;
      window.clearInterval(t);
    };
  }, [user, load]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) return null;

  return (
    <div className="km-bell" ref={box}>
      <button
        type="button"
        className="km-bell-btn"
        aria-label={bn ? "নোটিফিকেশন" : "Notifications"}
        onClick={() => setOpen((v) => !v)}
      >
        🔔
        {unread > 0 ? <i>{unread > 9 ? "9+" : unread}</i> : null}
      </button>
      {open ? (
        <div className="km-bell-panel">
          <header>
            <strong>{bn ? "নোটিফিকেশন" : "Notifications"}</strong>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => {
                  void kmApi("/api/kajmama/notifications", {
                    method: "POST",
                    body: JSON.stringify({ action: "readAll" }),
                  }).then(() => load());
                }}
              >
                {bn ? "সব পড়া" : "Mark all"}
              </button>
            ) : null}
          </header>
          <div className="km-bell-push">
            {pushOn ? (
              <span>{bn ? "পুশ চালু আছে" : "Push is on"}</span>
            ) : (
              <button
                type="button"
                className="km-btn gold sm"
                onClick={() => {
                  setPushMsg("");
                  void enablePush(vapid).then((r) => {
                    if (r === "granted") {
                      setPushOn(true);
                      setPushMsg(bn ? "পুশ নোটিফিকেশন চালু।" : "Push notifications on.");
                    } else {
                      setPushMsg(bn ? "অনুমতি দেওয়া হয়নি।" : "Permission not granted.");
                    }
                  });
                }}
              >
                {bn ? "পুশ চালু করুন" : "Enable push"}
              </button>
            )}
            {pushMsg ? <em>{pushMsg}</em> : null}
          </div>
          <div className="km-bell-list">
            {notes.length === 0 ? (
              <p className="km-muted">{bn ? "এখন কোনো নোটিফিকেশন নেই।" : "No notifications yet."}</p>
            ) : (
              notes.map((n) => (
                <Link
                  key={n.id}
                  href={n.href || `${KAJMAMA_BASE}/dashboard`}
                  className={n.read ? "" : "unread"}
                  onClick={() => {
                    if (!n.read) {
                      void kmApi("/api/kajmama/notifications", {
                        method: "POST",
                        body: JSON.stringify({ action: "read", id: n.id }),
                      });
                    }
                    setOpen(false);
                  }}
                >
                  <b>{bn ? n.titleBn : n.titleEn}</b>
                  <span>{bn ? n.bodyBn : n.bodyEn}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
