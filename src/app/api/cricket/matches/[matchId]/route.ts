import { applyBall, setMatchLineup, setPlayersOnStrike, startSecondInnings, undoLastBall } from "@/lib/cricket/engine";
import { tenantAccessOk } from "@/lib/cricket/format";
import { fail, ok } from "@/lib/cricket/http";
import { normalizePlayer } from "@/lib/cricket/lineup";
import {
  findMatch,
  findTenantById,
  readCricketStore,
  updateCricketStore,
} from "@/lib/cricket/store";
import type { BallType, GraphicKind, MatchStatus, Player, PlayerRole, TeamSide } from "@/lib/cricket/types";

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
    playerRecords: store.playerRecords?.[tenant.id] || [],
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
  "player",
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
    playerId?: string;
    nonStrikerOut?: boolean;
    players?: Array<{
      id?: string;
      name: string;
      team: TeamSide;
      role: PlayerRole;
      number?: number;
    }>;
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
        nonStrikerOut: body.nonStrikerOut,
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
    } else if (action === "set_lineup") {
      if (!Array.isArray(body.players) || body.players.length < 2) {
        return;
      }
      const players: Player[] = body.players.map((p, i) =>
        normalizePlayer({
          id: p.id || `p_${p.team}_${i}_${Date.now().toString(36)}`,
          name: (p.name || `Player ${i + 1}`).trim(),
          team: p.team,
          role: p.role || "batter",
          number: p.number ?? i + 1,
        }),
      );
      m = setMatchLineup(m, players);
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
        graphic: {
          kind,
          playerId: kind === "player" ? body.playerId : undefined,
          updatedAt: new Date().toISOString(),
        },
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
  return ok({
    match: updated,
    playerRecords: saved.playerRecords?.[tenant.id] || [],
  });
}
