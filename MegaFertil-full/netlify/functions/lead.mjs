import { dispatchLead } from "../lib/crm.mjs";
import { kvSet, rateLimit } from "../lib/store.mjs";
import { validPhone, fmtPhone, phoneLocal } from "../lib/logic.mjs";
const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const KINDS = ["callback", "quiz", "order"];
export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || "x";
  if (!rateLimit("lead:" + ip, 10)) return json({ ok: false, error: "rate" }, 429);
  const raw = await req.text();
  if (raw.length > 10000) return json({ ok: false, error: "size" }, 413);
  let b; try { b = JSON.parse(raw); } catch (e) { return json({ ok: false, error: "json" }, 400); }
  if (!b || typeof b !== "object" || b.bot_field) return json({ ok: true }); // bot tuzog'i: jim qabul qilamiz
  if (!KINDS.includes(b.kind)) return json({ ok: false, error: "kind" }, 400);
  if (!validPhone(b.phone)) return json({ ok: false, error: "phone" }, 400);
  if (b.consent !== "yes") return json({ ok: false, error: "consent" }, 400);
  const lead = { ...b, phone: fmtPhone(phoneLocal(b.phone)) };
  delete lead.bot_field; delete lead.consent; delete lead.token;
  const res = await dispatchLead(lead);
  if (!res.destinations) return json({ ok: false, error: "no_destination" }, 503);
  if (!res.ok) return json({ ok: false, error: "delivery" }, 502);
  if (typeof b.token === "string" && /^[A-Za-z0-9_-]{4,40}$/.test(b.token)) await kvSet("lead:" + b.token, { name: String(b.name || "").slice(0, 80), phone: lead.phone, t: Date.now() });
  return json({ ok: true });
};
export const config = { path: "/api/lead" };
