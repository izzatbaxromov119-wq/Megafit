// Telegram Bot API yordamchilari
export const escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

export async function tgCall(method, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan");
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(`Telegram ${method}: ${j.description || r.status}`);
  return j.result;
}

// matn HTML sifatida yuboriladi: dinamik qismlarni escapeHtml() bilan o'rang
export const tgSend = (chat_id, text, extra) =>
  tgCall("sendMessage", { chat_id, text: String(text).slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true, ...(extra || {}) });
