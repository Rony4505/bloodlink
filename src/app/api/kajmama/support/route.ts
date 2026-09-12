import { getSessionUser, isKajmamaAdmin } from "@/lib/kajmama/auth";
import { fail, newId, ok } from "@/lib/kajmama/http";
import { readKajmamaStore, updateKajmamaStore } from "@/lib/kajmama/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const visitorKey = (searchParams.get("visitorKey") || "").trim();
  const store = await readKajmamaStore();
  const admin = await isKajmamaAdmin();

  if (admin) {
    const keys = [...new Set(store.support.map((m) => m.visitorKey))];
    const threads = keys.map((key) => {
      const msgs = store.support.filter((m) => m.visitorKey === key);
      const last = msgs[msgs.length - 1];
      return {
        visitorKey: key,
        name: msgs.find((m) => m.from === "visitor")?.name || "ভিজিটর",
        lastText: last?.text || "",
        lastAt: last?.createdAt || "",
        messages: msgs,
      };
    });
    threads.sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt));
    return ok({ threads });
  }

  if (!visitorKey) return fail("visitorKey দিন");
  const messages = store.support.filter((m) => m.visitorKey === visitorKey);
  return ok({ messages });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      visitorKey?: string;
      name?: string;
      text?: string;
    };
    const text = (body.text || "").trim();
    if (!text) return fail("মেসেজ লিখুন");

    if (body.action === "admin-reply") {
      if (!(await isKajmamaAdmin())) return fail("অ্যাডমিন লগইন করুন", 401);
      const visitorKey = (body.visitorKey || "").trim();
      if (!visitorKey) return fail("visitorKey দিন");
      await updateKajmamaStore((s) => {
        s.support.push({
          id: newId("sup"),
          visitorKey,
          from: "admin",
          name: "KajMama Admin",
          text: text.slice(0, 800),
          createdAt: new Date().toISOString(),
        });
      });
      return ok({ ok: true });
    }

    const visitorKey = (body.visitorKey || "").trim() || newId("vis");
    const me = await getSessionUser();
    const name = (body.name || me?.name || "ভিজিটর").trim().slice(0, 80);
    await updateKajmamaStore((s) => {
      s.support.push({
        id: newId("sup"),
        visitorKey,
        from: "visitor",
        name,
        text: text.slice(0, 800),
        createdAt: new Date().toISOString(),
      });
    });
    return ok({ ok: true, visitorKey });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "পাঠানো যায়নি");
  }
}
