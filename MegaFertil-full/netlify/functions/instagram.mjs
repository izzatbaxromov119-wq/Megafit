import { verifySignature } from "../lib/ig.mjs";
import { converse } from "../lib/convo.mjs";
import { sendTo } from "../lib/convo.mjs";
export default async (req) => {
  if (req.method === "GET") { // Meta webhook tasdiqlash
    const u = new URL(req.url), t = process.env.IG_VERIFY_TOKEN;
    if (t && u.searchParams.get("hub.mode") === "subscribe" && u.searchParams.get("hub.verify_token") === t) return new Response(u.searchParams.get("hub.challenge") || "", { status: 200 });
    return new Response("forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("ok");
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) return new Response("forbidden", { status: 403 });
  let body = null;
  try { body = JSON.parse(raw); } catch (e) { return new Response("ok"); }
  try {
    for (const entry of body.entry || []) for (const ev of entry.messaging || []) {
      const m = ev.message;
      if (!m || m.is_echo || typeof m.text !== "string" || !ev.sender || !ev.sender.id) continue;
      const r = await converse({ ch: "i", id: String(ev.sender.id), name: "", username: "", text: m.text });
      for (const text of r.messages) await sendTo("i", String(ev.sender.id), text);
      if (r.offer) await sendTo("i", String(ev.sender.id), "Menejer bilan gaplashish uchun «menejer» deb yozing.");
    }
  } catch (e) { console.error("instagram:", e.message); }
  return new Response("ok");
};
export const config = { path: "/api/instagram" };
