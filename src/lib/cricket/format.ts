import { oversFromBalls } from "./engine";
import type { Innings, Match, MatchStatus, RentalPlan, Tenant } from "./types";

type ScoreBits = { runs: number; wickets: number; legalBalls?: number };

export function formatScore(innings: ScoreBits | Innings | undefined): string {
  if (!innings) return "0/0";
  return `${innings.runs}/${innings.wickets}`;
}

export function formatOvers(innings: ScoreBits | Innings | undefined): string {
  if (!innings) return "0.0";
  return oversFromBalls(innings.legalBalls || 0);
}

export function runRate(innings: Innings | undefined): string {
  if (!innings || innings.legalBalls === 0) return "0.00";
  const overs = innings.legalBalls / 6;
  return (innings.runs / overs).toFixed(2);
}

export function requiredRate(match: Match): string | null {
  const inn = match.innings[match.currentInningsIndex];
  if (!inn || !match.target || match.currentInningsIndex === 0) return null;
  const need = match.target - inn.runs;
  if (need <= 0) return "0.00";
  const maxBalls = match.format === "ODI" ? 300 : match.format === "T20" ? 120 : 120;
  const left = Math.max(1, maxBalls - inn.legalBalls);
  return ((need / left) * 6).toFixed(2);
}

export function statusLabel(status: MatchStatus): string {
  if (status === "live") return "লাইভ";
  if (status === "completed") return "শেষ";
  return "আসন্ন";
}

export function planLabel(plan: RentalPlan): string {
  if (plan === "daily") return "দৈনিক";
  if (plan === "weekly") return "সাপ্তাহিক";
  if (plan === "monthly") return "মাসিক";
  return "ইভেন্ট";
}

export function isTenantExpired(tenant: Tenant, now = Date.now()): boolean {
  return new Date(tenant.expiresAt).getTime() < now;
}

export function tenantAccessOk(tenant: Tenant | undefined): boolean {
  if (!tenant) return false;
  return tenant.active && !isTenantExpired(tenant);
}

export function matchHeadline(match: Match): string {
  const inn = match.innings[match.currentInningsIndex];
  const batting = inn?.battingTeam === "a" ? match.teamA : match.teamB;
  return `${batting.short} ${formatScore(inn)} (${formatOvers(inn)})`;
}

export function resultText(match: Match): string | null {
  if (match.status !== "completed") return null;
  if (match.result?.summaryBn) return match.result.summaryBn;
  const first = match.innings[0];
  const second = match.innings[1];
  if (!first) return "ম্যাচ শেষ";
  if (!second) {
    const team = first.battingTeam === "a" ? match.teamA.name : match.teamB.name;
    return `${team} ${first.runs}/${first.wickets}`;
  }
  if (second.runs >= (match.target || first.runs + 1)) {
    const team = second.battingTeam === "a" ? match.teamA.name : match.teamB.name;
    const wkts = 10 - second.wickets;
    return `${team} ${wkts} উইকেটে জিতছে`;
  }
  const team = first.battingTeam === "a" ? match.teamA.name : match.teamB.name;
  const margin = first.runs - second.runs;
  return `${team} ${margin} রানে জিতছে`;
}

export function formatScheduleWhen(iso?: string): string {
  if (!iso) return "সময় নির্ধারিত হয়নি";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "সময় নির্ধারিত হয়নি";
  return d.toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" });
}
