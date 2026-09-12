"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { kmApi } from "@/lib/kajmama/client";
import { maskPhone } from "@/lib/kajmama/format";
import type { BookingStatus, PublicUser } from "@/lib/kajmama/types";
import { useKm } from "./KmSession";
import { KmAvatar, KmMoney, KmStatus } from "./KmUi";

type Msg = { id: string; fromUserId: string; text: string; createdAt: string; mine: boolean };

type Payload = {
  booking: {
    id: string;
    status: BookingStatus;
    price: number;
    hirerId: string;
    workerId: string;
    siteFee?: number;
    workerPayout?: number;
    commissionPct?: number;
  };
  job: { title: string; description: string; whenText: string } | null;
  hirer: PublicUser | null;
  worker: PublicUser | null;
  messages: Msg[];
  myReview?: { rating: number; text: string };
  meId: string;
  payments?: {
    banks: { bankName: string; accountName: string; accountNumber: string; branch: string }[];
    mobiles: { type: string; number: string; name: string }[];
    commissionPct: number;
  };
};

export function KmBooking() {
  const { id } = useParams<{ id: string }>();
  const { lang, user } = useKm();
  const bn = lang === "bn";
  const [data, setData] = useState<Payload | null>(null);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [payMethod, setPayMethod] = useState("bkash");
  const [payRef, setPayRef] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const d = await kmApi<Payload>(`/api/kajmama/bookings/${id}`);
    setData(d);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let live = true;
    kmApi<Payload>(`/api/kajmama/bookings/${id}`)
      .then((d) => {
        if (live) setData(d);
      })
      .catch((e) => {
        if (live) setError(e instanceof Error ? e.message : "লোড হয়নি");
      });
    return () => {
      live = false;
    };
  }, [id]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError("");
    try {
      await kmApi(`/api/kajmama/bookings/${id}`, {
        method: "POST",
        body: JSON.stringify({ action: "message", text }),
      });
      setText("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "পাঠানো যায়নি");
    }
  }

  async function setStatus(status: BookingStatus) {
    if (!id) return;
    setError("");
    try {
      await kmApi(`/api/kajmama/bookings/${id}`, {
        method: "POST",
        body: JSON.stringify({ action: "status", status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "আপডেট হয়নি");
    }
  }

  async function review(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      await kmApi(`/api/kajmama/bookings/${id}`, {
        method: "POST",
        body: JSON.stringify({ action: "review", rating, text: reviewText }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "রিভিউ হয়নি");
    }
  }

  if (error && !data) {
    return (
      <div className="km-page km-wrap">
        <p className="km-error">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="km-page km-wrap">
        <p className="km-muted">{bn ? "লোড হচ্ছে…" : "Loading…"}</p>
      </div>
    );
  }

  const other = user?.id === data.booking.hirerId ? data.worker : data.hirer;
  const isWorker = user?.id === data.booking.workerId;
  const isHirer = user?.id === data.booking.hirerId;
  const st = data.booking.status;

  return (
    <div className="km-page km-wrap km-profile">
      <section className="km-card">
        <div className="km-worker-foot">
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{data.job?.title || "কাজ"}</h1>
          <KmStatus status={st} />
        </div>
        <p className="km-muted">{data.job?.description}</p>
        <p>
          <KmMoney amount={data.booking.price} /> · {data.job?.whenText}
        </p>
        {error ? <p className="km-error">{error}</p> : null}

        <div className="km-chat">
          {data.messages.map((m) => (
            <div key={m.id} className={`km-bubble ${m.mine ? "mine" : ""}`}>
              {m.text}
            </div>
          ))}
        </div>
        <form className="km-row" onSubmit={send}>
          <input
            className="km-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={bn ? "মেসেজ লিখুন" : "Write a message"}
          />
          <button className="km-btn dark sm" type="submit" style={{ flex: "none" }}>
            {bn ? "পাঠান" : "Send"}
          </button>
        </form>
      </section>

      <aside className="km-card">
        {other ? (
          <div className="km-worker-top">
            <KmAvatar name={other.name} />
            <div>
              <strong>{other.name}</strong>
              <p className="km-meta">
                {other.area}, {other.district}
              </p>
              <p className="km-meta">
                {bn ? "ফোন" : "Phone"}: {other.phone || maskPhone("01XXXXXXXXX")}
              </p>
            </div>
          </div>
        ) : null}

        <div className="km-cta" style={{ marginTop: "1rem", flexDirection: "column" }}>
          {isWorker && st === "pending" ? (
            <>
              <button className="km-btn gold" type="button" onClick={() => void setStatus("accepted")}>
                {bn ? "একসেপ্ট" : "Accept"}
              </button>
              <button className="km-btn ghost" type="button" onClick={() => void setStatus("declined")}>
                {bn ? "না" : "Decline"}
              </button>
            </>
          ) : null}
          {isWorker && st === "accepted" ? (
            <button className="km-btn gold" type="button" onClick={() => void setStatus("in_progress")}>
              {bn ? "কাজ শুরু" : "Start work"}
            </button>
          ) : null}
          {isHirer && (st === "accepted" || st === "in_progress") ? (
            <button className="km-btn gold" type="button" onClick={() => void setStatus("completed")}>
              {bn ? "কাজ শেষ" : "Mark complete"}
            </button>
          ) : null}
          {(isHirer || isWorker) && (st === "pending" || st === "accepted") ? (
            <button className="km-btn ghost" type="button" onClick={() => void setStatus("declined")}>
              {bn ? "বাতিল" : "Cancel"}
            </button>
          ) : null}
        </div>

        {st === "completed" && isHirer ? (
          <form
            className="km-form"
            style={{ marginTop: "1rem" }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!id) return;
              void kmApi(`/api/kajmama/bookings/${id}`, {
                method: "POST",
                body: JSON.stringify({ action: "pay", paymentMethod: payMethod, paymentRef: payRef || "DEMO" }),
              })
                .then(() => load())
                .catch((err) => setError(err instanceof Error ? err.message : "পেমেন্ট হয়নি"));
            }}
          >
            <h3>{bn ? "ওয়েবসাইটে পেমেন্ট করুন" : "Pay on the website"}</h3>
            <p className="km-hint">
              {bn
                ? `সাইট ফি কর্মী থেকে কাটা: ৳${data.booking.siteFee || 0} · কর্মী পাবেন ৳${data.booking.workerPayout || 0}`
                : `Fee from worker: ৳${data.booking.siteFee || 0} · worker gets ৳${data.booking.workerPayout || 0}`}
            </p>
            {(data.payments?.mobiles || []).map((m) => (
              <p key={m.number} className="km-meta">
                {m.type}: {m.number} ({m.name})
              </p>
            ))}
            {(data.payments?.banks || []).map((b) => (
              <p key={b.accountNumber} className="km-meta">
                {b.bankName}: {b.accountNumber}
              </p>
            ))}
            <select className="km-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="bank">Bank</option>
            </select>
            <input
              className="km-input"
              placeholder={bn ? "ট্রান্সঅ্যাকশন আইডি" : "Transaction ID"}
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
            />
            <button className="km-btn gold" type="submit">
              {bn ? "পেমেন্ট নিশ্চিত" : "Confirm payment"}
            </button>
          </form>
        ) : null}
        {st === "completed" && isWorker ? (
          <p className="km-hint">
            {bn
              ? "ওয়েবসাইটে পেমেন্ট না হওয়া পর্যন্ত নতুন কাজ নিতে পারবেন না, রেটিংও খুলবে না।"
              : "Until website payment is done you cannot take a new job, and ratings stay locked."}
          </p>
        ) : null}

        {st === "paid" && !data.myReview ? (
          <form onSubmit={review} className="km-form" style={{ marginTop: "1rem" }}>
            <h3>{bn ? "রিভিউ দিন" : "Leave a review"}</h3>
            <select className="km-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
            <textarea className="km-textarea" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
            <button className="km-btn dark" type="submit">
              {bn ? "রিভিউ সেভ" : "Save review"}
            </button>
          </form>
        ) : null}
        {data.myReview ? (
          <p className="km-hint">
            {bn ? "আপনার রিভিউ" : "Your review"}: {data.myReview.rating}★ {data.myReview.text}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
