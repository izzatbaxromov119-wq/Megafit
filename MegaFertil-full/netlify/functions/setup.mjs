import { tgCall, tgSend } from "../lib/tg.mjs";
const json = (o, s) => new Response(JSON.stringify(o, null, 2), { status: s || 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const ENV = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "TELEGRAM_MANAGER_CHAT_ID", "SITE_URL", "ANTHROPIC_API_KEY", "BITRIX_WEBHOOK_URL", "IG_VERIFY_TOKEN", "IG_APP_SECRET", "IG_ACCESS_TOKEN"];
export default async (req) => {
  const key = process.env.SETUP_KEY, u = new URL(req.url);
  if (!key || u.searchParams.get("key") !== key) return json({ ok: false, error: "SETUP_KEY noto'g'ri yoki sozlanmagan" }, 403);
  const out = { env: Object.fromEntries(ENV.map((k) => [k, !!process.env[k]])) };
  if (u.searchParams.get("info")) { // faqat o'qish: webhook holati (hech narsani o'zgartirmaydi)
    try {
      const me = await tgCall("getMe"), i = await tgCall("getWebhookInfo");
      return json({ ok: true, bot: "@" + me.username, url: i.url, pending: i.pending_update_count, lastErrorAt: i.last_error_date ? new Date(i.last_error_date * 1000).toISOString() : null, lastError: i.last_error_message || null, allowed: i.allowed_updates || null, ip: i.ip_address || null, expected: u.origin + "/api/telegram", now: new Date().toISOString() });
    } catch (e) { return json({ ok: false, telegramError: e.message }, 500); }
  }
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET) {
    try {
      out.setWebhook = await tgCall("setWebhook", { url: u.origin + "/api/telegram", secret_token: process.env.TELEGRAM_WEBHOOK_SECRET, allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
      await tgCall("setMyCommands", { commands: [{ command: "start", description: "Boshlash" }, { command: "menejer", description: "Menejer bilan bog'lanish" }, { command: "stop", description: "Xabarlarni to'xtatish" }] });
      const me = await tgCall("getMe"); out.bot = "@" + me.username;
      const info = await tgCall("getWebhookInfo"); out.webhook = { url: info.url, pending: info.pending_update_count, lastError: info.last_error_message || null };
    } catch (e) { out.telegramError = e.message; }
    if (u.searchParams.get("test") && process.env.TELEGRAM_MANAGER_CHAT_ID) {
      try { await tgSend(process.env.TELEGRAM_MANAGER_CHAT_ID, "Test: MegaFertil serveri menejer guruhiga ulandi."); out.managerTest = "yuborildi"; } catch (e) { out.managerTest = "xato: " + e.message; }
    }
  } else out.telegram = "TELEGRAM_BOT_TOKEN va TELEGRAM_WEBHOOK_SECRET kerak";
  out.instagramWebhook = u.origin + "/api/instagram";
  return json({ ok: true, ...out });
};
export const config = { path: "/api/setup" };
