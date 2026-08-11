"use client";

import { useState, type FormEvent } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">
              Contact
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold md:text-6xl">
              We&apos;re here for styling help and order support
            </h1>
            <div className="mt-8 space-y-4 text-base leading-8 text-[#6e5449]">
              <p>WhatsApp: +880 1XXX-XXXXXX</p>
              <p>Email: hello@nooredhaka.com</p>
              <p>Hours: 10:00 AM – 9:00 PM (GMT+6)</p>
              <p>Dhaka showroom appointments available on request.</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]"
          >
            {sent ? (
              <div className="rounded-[1.5rem] bg-[#faf4f0] p-6 text-[#5b4339]">
                <p className="font-semibold">Message sent successfully.</p>
                <p className="mt-2 text-sm leading-7">
                  Our styling team will get back to you shortly on WhatsApp or email.
                </p>
              </div>
            ) : (
              <>
                <label className="block">
                  <span className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">
                    Name
                  </span>
                  <input className="field mt-2" required />
                </label>
                <label className="mt-5 block">
                  <span className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">
                    Phone
                  </span>
                  <input className="field mt-2" required />
                </label>
                <label className="mt-5 block">
                  <span className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">
                    Message
                  </span>
                  <textarea className="field mt-2 min-h-32 resize-y" required />
                </label>
                <div className="mt-6">
                  <FashionButton type="submit">Send message</FashionButton>
                </div>
              </>
            )}
          </form>
        </div>
      </section>
    </FashionShell>
  );
}
