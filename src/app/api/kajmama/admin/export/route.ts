import { isKajmamaAdmin } from "@/lib/kajmama/auth";
import { fail } from "@/lib/kajmama/http";
import { findUser, readKajmamaStore } from "@/lib/kajmama/store";

export const runtime = "nodejs";

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "\uFEFF";
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(","), ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(","))];
  return `\uFEFF${lines.join("\n")}`;
}

function inRange(iso: string, from: string, to: string) {
  const t = +new Date(iso);
  if (from && t < +new Date(from)) return false;
  if (to && t > +new Date(to) + 24 * 60 * 60 * 1000 - 1) return false;
  return true;
}

export async function GET(request: Request) {
  if (!(await isKajmamaAdmin())) return fail("অ্যাডমিন লগইন করুন", 401);
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "workers";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const store = await readKajmamaStore();

  let rows: Record<string, unknown>[] = [];
  if (kind === "workers") {
    rows = store.users
      .filter((u) => u.role === "worker")
      .filter((u) => inRange(u.createdAt, from, to))
      .map((u) => ({
        name: u.name,
        phone: u.phone,
        district: u.district,
        upazila: u.upazila,
        area: u.area,
        skills: u.skills.join("|"),
        package: u.packageId,
        premiumUntil: u.packageExpiresAt || "",
        bank: u.payout?.bankName,
        bankAccount: u.payout?.bankAccount,
        mobileBanking: u.payout?.mobileBanking,
        createdAt: u.createdAt,
      }));
  } else if (kind === "hirers") {
    rows = store.users
      .filter((u) => u.role === "hirer")
      .filter((u) => inRange(u.createdAt, from, to))
      .map((u) => ({
        name: u.name,
        phone: u.phone,
        district: u.district,
        upazila: u.upazila,
        createdAt: u.createdAt,
      }));
  } else if (kind === "jobs") {
    rows = store.jobs.filter((j) => inRange(j.createdAt, from, to)).map((j) => ({
      title: j.title,
      category: j.categoryId,
      district: j.district,
      upazila: j.upazila,
      budget: j.budget,
      status: j.status,
      createdAt: j.createdAt,
    }));
  } else if (kind === "bookings" || kind === "payments") {
    rows = store.bookings
      .filter((b) => inRange(b.createdAt, from, to))
      .filter((b) => (kind === "payments" ? b.status === "paid" : true))
      .map((b) => {
        const w = findUser(store, b.workerId);
        const h = findUser(store, b.hirerId);
        return {
          bookingId: b.id,
          status: b.status,
          hirer: h?.name,
          worker: w?.name,
          price: b.price,
          siteFee: b.siteFee,
          workerPayout: b.workerPayout,
          paidAt: b.paidAt || "",
          paymentMethod: b.paymentMethod || "",
          paymentRef: b.paymentRef || "",
          createdAt: b.createdAt,
        };
      });
  } else if (kind === "reviews") {
    rows = store.reviews.filter((r) => inRange(r.createdAt, from, to)).map((r) => ({
      rating: r.rating,
      text: r.text,
      from: findUser(store, r.fromUserId)?.name,
      to: findUser(store, r.toUserId)?.name,
      createdAt: r.createdAt,
    }));
  } else {
    return fail("kind সঠিক নয়");
  }

  const body = csv(rows);
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="kajmama-${kind}.csv"`,
    },
  });
}
