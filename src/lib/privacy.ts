export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const last = digits.slice(-3);
  const prefix = digits.slice(0, 2);
  return `${prefix}***-***${last}`;
}

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Map Bengali numerals to ASCII so "০১৭..." typed on a Bangla keyboard is accepted. */
function asciiDigits(value: string): string {
  let out = "";
  for (const ch of value) {
    const bn = BENGALI_DIGITS.indexOf(ch);
    out += bn >= 0 ? String(bn) : ch;
  }
  return out;
}

export function normalizePhone(phone: string): string {
  const digits = asciiDigits(phone).replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length >= 13) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

export function isValidBdPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^01[3-9]\d{8}$/.test(normalized);
}
