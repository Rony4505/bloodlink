import { getSessionUser } from "@/lib/kajmama/auth";
import { fail, ok } from "@/lib/kajmama/http";
import { toPublicUser, workerList } from "@/lib/kajmama/public";
import { findUser, readKajmamaStore, reviewsFor } from "@/lib/kajmama/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const store = await readKajmamaStore();
  const user = findUser(store, id);
  if (!user || user.role !== "worker" || user.blocked) return fail("ওয়ার্কার পাওয়া যায়নি", 404);

  const me = await getSessionUser();
  const reveal =
    !!me &&
    (me.id === user.id ||
      store.bookings.some(
        (b) =>
          ["accepted", "in_progress", "completed"].includes(b.status) &&
          ((b.hirerId === me.id && b.workerId === user.id) ||
            (b.workerId === me.id && b.hirerId === user.id)),
      ));

  const reviews = reviewsFor(store, user.id).map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt,
    fromName: findUser(store, r.fromUserId)?.name || "সদস্য",
  }));

  const similar = workerList(store, {
    category: user.skills[0],
    district: user.district,
  })
    .filter((w) => w.id !== user.id)
    .slice(0, 4);

  return ok({
    worker: toPublicUser(store, user, { revealPhone: reveal }),
    reviews,
    similar,
    canHire: !!me && me.id !== user.id,
  });
}
