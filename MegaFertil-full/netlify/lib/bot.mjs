// Telegram webhook mantiqi
import { tgCall, tgSend, escapeHtml as h } from "./tg.mjs";
import { converse, manualHandoff, closeHandoff, sendTo, CH_NAME } from "./convo.mjs";
import { dispatchLead, managerChat, notifyManager } from "./crm.mjs";
import { kvGet, kvSet } from "./store.mjs";
import { fmtPhone } from "./logic.mjs";

const HELP = "Men MegaFertil ma'lumot yordamchisiman: narx, to'lov, yetkazish, buyurtma va test natijasi haqida so'rang. Men shifokor emasman va tashxis qo'ymayman.\nMenejer bilan gaplashish: /menejer · Xabarlarni to'xtatish: /stop";
const nameOf = (u) => [u.first_name, u.last_name].filter(Boolean).join(" ");

export async function handleUpdate(up) {
  if (up.callback_query) return onCallback(up.callback_query);
  const msg = up.message;
  if (!msg || !msg.chat) return;
  const text = typeof msg.text === "string" ? msg.text : "";
  if (/^\/id(@\w+)?$/.test(text.trim())) return tgSend(msg.chat.id, `Chat ID: <code>${h(msg.chat.id)}</code>`);
  if (String(msg.chat.id) === managerChat()) return onManager(msg, text);
  if (msg.chat.type !== "private" || !msg.from || msg.from.is_bot) return;
  if (msg.contact) return onContact(msg);
  if (!text) return tgSend(msg.chat.id, "Iltimos, savolingizni matn bilan yozing.");
  if (text.startsWith("/start")) return onStart(msg, text.slice(6).trim());
  if (/^\/stop(@\w+)?$/.test(text)) { await patch(msg.from.id, { mktOff: true }); return tgSend(msg.chat.id, "Marketing xabarlari o'chirildi. Savollaringizga javob berishda davom etaman."); }
  if (/^\/menejer(@\w+)?$/.test(text)) return reply(msg.chat.id, [await manualHandoff({ ch: "u", id: msg.from.id, name: nameOf(msg.from), username: msg.from.username, reason: "USER_ASK" })]);
  if (text.startsWith("/")) return tgSend(msg.chat.id, h(HELP));
  tgCall("sendChatAction", { chat_id: msg.chat.id, action: "typing" }).catch(() => {});
  const r = await converse({ ch: "u", id: msg.from.id, name: nameOf(msg.from), username: msg.from.username, text });
  return reply(msg.chat.id, r.messages, r.offer);
}
async function patch(id, obj) { const k = `u:${id}`; const s = (await kvGet(k)) || { hist: [] }; Object.assign(s, obj); await kvSet(k, s); return s; }
async function reply(chatId, messages, offer) {
  for (let i = 0; i < messages.length; i++) {
    const last = i === messages.length - 1;
    const extra = last && offer ? { reply_markup: { inline_keyboard: [[{ text: "Menejerga ulash", callback_data: "ho:" + offer.code }]] } } : undefined;
    await tgSend(chatId, h(messages[i]), extra);
  }
}
async function onStart(msg, payload) {
  const from = msg.from;
  let hello = "Salom" + (from.first_name ? ", " + from.first_name : "") + "!";
  const token = /^[A-Za-z0-9_-]{4,40}$/.test(payload) ? payload : "";
  const lead = token ? await kvGet("lead:" + token) : null;
  await patch(from.id, { token: token || undefined, lead: lead ? lead.name : undefined });
  if (lead) {
    hello += " Saytdagi so'rovingiz bog'landi.";
    await notifyManager(`<b>Telegram ulandi</b> #u${from.id}\nMijoz: ${h(nameOf(from))}${from.username ? " @" + h(from.username) : ""}\nSayt lidi: ${h(lead.name || "—")} ${h(lead.phone || "")}`).catch(() => {});
  }
  const kb = [[{ text: "Telefon raqamni ulashish", request_contact: true }]];
  const inline = process.env.SITE_URL ? { inline_keyboard: [[{ text: "Bepul testni boshlash", url: process.env.SITE_URL }]] } : undefined;
  await tgSend(msg.chat.id, h(hello + "\n\n" + HELP), { reply_markup: { keyboard: kb, resize_keyboard: true, one_time_keyboard: true } });
  if (inline) await tgSend(msg.chat.id, "Test 2 daqiqa davom etadi:", { reply_markup: inline });
}
async function onContact(msg) {
  const c = msg.contact, from = msg.from;
  if (c.user_id && c.user_id !== from.id) return tgSend(msg.chat.id, "Iltimos, o'zingizning raqamingizni ulashing.");
  const digits = String(c.phone_number || "").replace(/\D/g, "").replace(/^998/, "");
  const phone = digits.length === 9 ? fmtPhone(digits) : "+" + String(c.phone_number || "").replace(/\D/g, "");
  const s = await patch(from.id, { phone });
  const res = await dispatchLead({ kind: "telegram", name: nameOf(from), phone, source: "Telegram-bot", note: `${from.username ? "@" + from.username : ""}${s.lead ? "\nSayt lidi: " + s.lead : ""}`, utm_source: "telegram", utm_medium: "bot", token: s.token });
  const ok = res.ok !== false;
  return tgSend(msg.chat.id, h(ok ? "Rahmat! Raqamingiz qabul qilindi, menejer bog'lanadi." : "Raqam qabul qilindi, lekin tizimga yozishda xatolik bo'ldi. Birozdan keyin yana urinib ko'ring."), { reply_markup: { remove_keyboard: true } });
}
async function onCallback(q) {
  tgCall("answerCallbackQuery", { callback_query_id: q.id }).catch(() => {});
  if (!q.data || !q.data.startsWith("ho:") || !q.message) return;
  const m = await manualHandoff({ ch: "u", id: q.from.id, name: nameOf(q.from), username: q.from.username, reason: q.data.slice(3) });
  return tgSend(q.message.chat.id, h(m));
}
// menejer guruhi: xabarga reply qilinsa, mijozga yetkaziladi
async function onManager(msg, text) {
  const orig = msg.reply_to_message && msg.reply_to_message.text;
  const m = orig && orig.match(/#([ui])(\d{3,})/);
  if (!m || !text) return;
  const [, ch, id] = m;
  if (/^\/close(@\w+)?$/.test(text.trim())) { await closeHandoff(ch, id); return tgSend(msg.chat.id, `#${ch}${id}: suhbat yakunlandi.`); }
  if (text.startsWith("/")) return;
  await sendTo(ch, id, "Menejer: " + text);
  return tgSend(msg.chat.id, `Yuborildi → ${CH_NAME[ch]} #${ch}${id}`);
}
