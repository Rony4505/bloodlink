import { normalizeCheckoutPaymentMethod } from "./payment";
import type { CheckoutForm } from "./types";

const DRAFT_KEY = "scc_checkout_draft_v1";

export function readCheckoutDraft(): Partial<CheckoutForm> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<CheckoutForm>;
    if (!parsed || typeof parsed !== "object") return {};
    return {
      ...parsed,
      paymentMethod: normalizeCheckoutPaymentMethod(parsed.paymentMethod),
    };
  } catch {
    return {};
  }
}

export function writeCheckoutDraft(form: CheckoutForm) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        district: form.district,
        note: form.note,
        paymentMethod: form.paymentMethod,
        couponCode: form.couponCode,
      }),
    );
  } catch {
    /* ignore quota errors */
  }
}

export function clearCheckoutDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
