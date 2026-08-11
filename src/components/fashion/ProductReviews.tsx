"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { copy } from "@/lib/fashion/copy";
import type { ProductReview } from "@/lib/fashion/types";

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch(`/api/fashion/reviews?productId=${productId}`);
    const data = await res.json();
    setReviews(data.reviews ?? []);
  }

  useEffect(() => {
    void load();
    fetch("/api/fashion/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.customer?.name) setCustomerName(data.customer.name);
      })
      .catch(() => undefined);
  }, [productId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/fashion/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, comment, customerName }),
    });
    if (!res.ok) {
      setMessage("মতামত দেওয়া যায়নি");
      return;
    }
    setComment("");
    setMessage("ধন্যবাদ! আপনার মতামত যোগ হয়েছে");
    await load();
  }

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section className="mt-16 rounded-[2rem] border border-black/6 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            {copy.reviews.title}
          </h2>
          {avg ? (
            <p className="mt-2 text-[#8f624e]">
              ★ {avg} / 5 · {reviews.length} মতামত
            </p>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-[#faf4f0] p-5">
        <div className="flex flex-wrap gap-4">
          <label className="block flex-1 min-w-[140px]">
            <span className="text-sm text-[#9b7766]">নাম</span>
            <input
              className="field mt-1"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-[#9b7766]">রেটিং</span>
            <select
              className="field mt-1"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-[#9b7766]">মতামত</span>
          <textarea
            className="field mt-1 min-h-24"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={copy.reviews.placeholder}
            required
          />
        </label>
        {message ? <p className="text-sm text-[#8b6456]">{message}</p> : null}
        <FashionButton type="submit">{copy.reviews.submit}</FashionButton>
      </form>

      <div className="mt-8 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-[#6f554a]">{copy.reviews.noReviews}</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-black/5 bg-[#fdf8f4] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{review.customerName}</p>
                <p className="text-[#8f624e]">{"★".repeat(review.rating)}</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-[#6c5247]">{review.comment}</p>
              <p className="mt-2 text-xs text-[#a0897d]">
                {new Date(review.createdAt).toLocaleDateString("bn-BD")}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
