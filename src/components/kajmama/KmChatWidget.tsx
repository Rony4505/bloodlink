"use client";

import { useEffect, useState } from "react";
import { kmApi } from "@/lib/kajmama/client";
import { useKm } from "./KmSession";

const VIS_KEY = "kajmama-visitor";

function visitorKey() {
  try {
    let k = localStorage.getItem(VIS_KEY);
    if (!k) {
      k = `vis_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VIS_KEY, k);
    }
    return k;
  } catch {
    return "vis_anon";
  }
}

type Msg = { id: string; from: "visitor" | "admin"; text: string };

export function KmChatWidget() {
  const { lang, meta, user } = useKm();
  const bn = lang === "bn";
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"site" | "links">("site");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const wa = meta.contact.whatsapp.replace(/\D/g, "") || "01712345678";
  const mail = meta.contact.email || "support@kajmamabd.com";
  const fb = meta.contact.facebook || "https://facebook.com";

  useEffect(() => {
    if (!open) return;
    const key = visitorKey();
    kmApi<{ messages: Msg[] }>(`/api/kajmama/support?visitorKey=${encodeURIComponent(key)}`)
      .then((d) => setMessages(d.messages || []))
      .catch(() => setMessages([]));
  }, [open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const key = visitorKey();
    try {
      await kmApi("/api/kajmama/support", {
        method: "POST",
        body: JSON.stringify({ visitorKey: key, name: user?.name, text }),
      });
      setText("");
      const d = await kmApi<{ messages: Msg[] }>(`/api/kajmama/support?visitorKey=${encodeURIComponent(key)}`);
      setMessages(d.messages || []);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="km-chatfab">
      {open ? (
        <div className="km-chatpanel">
          <header>
            <strong>{bn ? "অ্যাডমিনের সাথে চ্যাট" : "Chat with admin"}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="close">
              ×
            </button>
          </header>
          <div className="km-chattabs">
            <button type="button" className={tab === "site" ? "on" : ""} onClick={() => setTab("site")}>
              {bn ? "ওয়েবসাইট" : "Website"}
            </button>
            <button type="button" className={tab === "links" ? "on" : ""} onClick={() => setTab("links")}>
              {bn ? "অন্য মাধ্যম" : "Other"}
            </button>
          </div>
          {tab === "site" ? (
            <>
              <div className="km-chatlog">
                {messages.length === 0 ? (
                  <p className="km-muted">{bn ? "হ্যালো — কী সাহায্য লাগবে?" : "Hi — how can we help?"}</p>
                ) : null}
                {messages.map((m) => (
                  <div key={m.id} className={`km-bubble ${m.from === "visitor" ? "mine" : ""}`}>
                    {m.text}
                  </div>
                ))}
              </div>
              <form onSubmit={send}>
                <input
                  className="km-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={bn ? "লিখুন…" : "Write…"}
                />
                <button className="km-btn gold sm" type="submit">
                  {bn ? "পাঠান" : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="km-chat-links">
              <a href={`https://wa.me/88${wa}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <a href={fb} target="_blank" rel="noreferrer">
                Facebook
              </a>
              <a href={`mailto:${mail}`}>Email · {mail}</a>
              <a href={`tel:${meta.contact.phone}`}>{meta.contact.phone}</a>
            </div>
          )}
        </div>
      ) : null}
      <button type="button" className="km-fab" onClick={() => setOpen((v) => !v)}>
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
