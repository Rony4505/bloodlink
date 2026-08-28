/** Strip spaces/dashes and map Bengali numerals — email clients often break OTP copy/paste. */
export function normalizeOtpCode(raw: string): string {
  const bengali = "০১২৩৪৫৬৭৮৯";
  let out = "";
  for (const ch of raw.trim()) {
    const bn = bengali.indexOf(ch);
    if (bn >= 0) out += String(bn);
    else if (ch >= "0" && ch <= "9") out += ch;
  }
  return out;
}
