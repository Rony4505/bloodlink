import type {
  CheckoutPaymentMethod,
  FashionPaymentMethod,
  StoreSettings,
} from "./types";

export const CHECKOUT_PAYMENT_METHODS: CheckoutPaymentMethod[] = [
  "cod",
  "bank",
  "mobile_banking",
];

export function normalizeCheckoutPaymentMethod(
  value: unknown,
): CheckoutPaymentMethod {
  if (value === "bank") return "bank";
  if (value === "mobile_banking" || value === "bkash" || value === "nagad") {
    return "mobile_banking";
  }
  return "cod";
}

export function paymentMethodLabel(
  method: FashionPaymentMethod,
  labels: {
    cod: string;
    bank: string;
    mobileBanking: string;
    bkash: string;
    nagad: string;
  },
): string {
  if (method === "bank") return labels.bank;
  if (method === "mobile_banking") return labels.mobileBanking;
  if (method === "bkash") return labels.bkash;
  if (method === "nagad") return labels.nagad;
  return labels.cod;
}

export function hasBankAccounts(settings: StoreSettings): boolean {
  return Boolean(
    settings.bankAccountNumber?.trim() ||
      settings.bankName?.trim() ||
      settings.bankAccountName?.trim(),
  );
}

export function hasMobileBankingAccounts(settings: StoreSettings): boolean {
  return Boolean(
    settings.bkashNumber?.trim() ||
      settings.nagadNumber?.trim() ||
      settings.rocketNumber?.trim(),
  );
}
