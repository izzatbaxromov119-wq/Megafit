import { handleUpdate } from "../lib/bot.mjs";
export default async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) return new Response("forbidden", { status: 403 });
  let up = null;
  try { up = await req.json(); } catch (e) { return new Response("ok"); }
  try { await handleUpdate(up); } catch (e) { console.error("telegram:", e.message); } // Telegram qayta yubormasligi uchun doim 200
  return new Response("ok");
};
export const config = { path: "/api/telegram" };
