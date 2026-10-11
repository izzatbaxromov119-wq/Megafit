import { aiReply } from "../lib/ai.mjs";
import { rateLimit } from "../lib/store.mjs";
const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || "x";
  if (!rateLimit("chat:" + ip, 20)) return json({ ok: false, error: "rate" }, 429);
  const raw = await req.text();
  if (raw.length > 8000) return json({ ok: false, error: "size" }, 413);
  let b; try { b = JSON.parse(raw); } catch (e) { return json({ ok: false, error: "json" }, 400); }
  if (!b || typeof b.message !== "string" || !b.message.trim()) return json({ ok: false, error: "message" }, 400);
  const r = await aiReply({ text: b.message, history: b.history, context: b.context });
  return json({ ok: true, ...r });
};
export const config = { path: "/api/chat" };
