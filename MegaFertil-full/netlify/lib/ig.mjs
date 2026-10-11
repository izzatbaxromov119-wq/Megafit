// Instagram (Meta) yordamchilari
import { createHmac, timingSafeEqual } from "node:crypto";
export function verifySignature(raw, header) {
  const secret = process.env.IG_APP_SECRET;
  if (!secret || !header || !header.startsWith("sha256=")) return false;
  const want = createHmac("sha256", secret).update(raw).digest("hex");
  const got = header.slice(7);
  if (got.length !== want.length) return false;
  try { return timingSafeEqual(Buffer.from(got, "hex"), Buffer.from(want, "hex")); } catch (e) { return false; }
}
export async function igSend(userId, text) {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) throw new Error("IG_ACCESS_TOKEN sozlanmagan");
  const r = await fetch("https://graph.instagram.com/v21.0/me/messages", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ recipient: { id: String(userId) }, message: { text: String(text).slice(0, 950) } }),
  });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error("Instagram yuborish: " + ((j.error && j.error.message) || r.status)); }
  return true;
}
