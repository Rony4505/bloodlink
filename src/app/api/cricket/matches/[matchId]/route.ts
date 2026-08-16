import { applyBall, setPlayersOnStrike, startSecondInnings, undoLastBall } from "@/lib/cricket/engine";
import { tenantAccessOk } from "@/lib/cricket/format";
import { fail, ok } from "@/lib/cricket/http";
import {
  findMatch,
  findTenantById,
  readCricketStore,
  updateCricketStore,
} from "@/lib/cricket/store";
import type { BallType, GraphicKind, MatchStatus } from "@/lib/cricket/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ matchId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { matchId } = await ctx.params;
  const store = await readCricketStore();
  const match = findMatch(store, matchId);
  if (!match) return fail("ম্যাচ পাওয়া যায়নি", 404);
  const tenant = findTenantById(store, match.tenantId);
  if (!tenant || !tenantAccessOk(tenant)) return fail("অ্যাক্সেস নেই", 403);
  return ok({
    match,
    tenant: {
      slug: tenant.slug,
      name: tenant.name,
      brandColor: tenant.brandColor,
    },
  });
}

const GRAPHIC_KINDS: GraphicKind[] = [
  "hidden",
  "batter",
  "bowler",
  "partnership",
  "batting",
  "bowling",
  "teams",
];

export async function POST(request: Request, ctx: Ctx) {
  const { matchId } = await ctx.params;
  const body = (await request.json()) as {
    action?: string;
    tenantPin?: string;
    type?: BallType;
    runs?: number;
    isWicket?: boolean;
    note?: string;
    strikerName?: string;
    nonStrikerName?: string;
    bowlerName?: string;
    strikerId?: string;
    nonStrikerId?: string;
    bowlerId?: string;
    videoUrl?: string;
    status?: MatchStatus;
    title?: string;
    graphicKind?: GraphicKind;
  };

  const store = await readCricketStore();
  const match = findMatch(store, matchId);
  if (!match) return fail("ম্যাচ পাওয়া যায়নি", 404);
  const tenant = findTenantById(store, match.tenantId);
  if (!tenant) return fail("ক্লাব পাওয়া যায়নি", 404);
  if (!tenantAccessOk(tenant)) return fail("রেন্ট মেয়াদ শেষ", 403);
  if (body.tenantPin !== tenant.pin) return fail("পিন ভুল", 401);

  const action = body.action || "ball";

  const saved = await updateCricketStore((s) => {
    const idx = s.matches.findIndex((m) => m.id === matchId);
    if (idx < 0) return;
    let m = s.matches[idx];

    if (action === "ball") {
      m = applyBall(m, {
        type: body.type || "run",
        runs: body.runs ?? 0,
        isWicket: body.isWicket,
        note: body.note,
        strikerName: body.strikerName,
        nonStrikerName: body.nonStrikerName,
        bowlerName: body.bowlerName,
      });
    } else if (action === "undo") {
      m = undoLastBall(m);
    } else if (action === "second_innings") {
      m = startSecondInnings(m);
    } else if (action === "set_players") {
      m = setPlayersOnStrike(m, {
        strikerId: body.strikerId,
        nonStrikerId: body.nonStrikerId,
        bowlerId: body.bowlerId,
        strikerName: body.strikerName,
        nonStrikerName: body.nonStrikerName,
        bowlerName: body.bowlerName,
      });
    } else if (action === "update_meta") {
      if (typeof body.videoUrl === "string") m.videoUrl = body.videoUrl.trim();
      if (body.status) m.status = body.status;
      if (body.title) m.title = body.title.trim();
      m.updatedAt = new Date().toISOString();
    } else if (action === "set_graphic") {
      const kind =
        body.graphicKind && GRAPHIC_KINDS.includes(body.graphicKind) ? body.graphicKind : "hidden";
      m = {
        ...m,
        graphic: { kind, updatedAt: new Date().toISOString() },
        updatedAt: new Date().toISOString(),
      };
    } else if (action === "complete") {
      m.status = "completed";
      m.updatedAt = new Date().toISOString();
    } else {
      return;
    }

    s.matches[idx] = m;
  });

  const updated = findMatch(saved, matchId);
  if (!updated) return fail("update failed", 500);
  return ok({ match: updated });
}
