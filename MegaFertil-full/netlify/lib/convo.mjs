// Telegram va Instagram uchun umumiy suhbat mantiqi: limit, AI, menejerga uzatish, telefon ushlash.
import { aiReply } from "./ai.mjs";
import { kvGet, kvSet } from "./store.mjs";
import { dispatchLead, notifyManager } from "./crm.mjs";
import { tgSend, escapeHtml as h } from "./tg.mjs";
import { igSend } from "./ig.mjs";
import { workHours, fmtPhone } from "./logic.mjs";

export const CH_NAME = { u: "Telegram", i: "Instagram" };
export async function sendTo(ch, id, text) {
  if (ch === "u") return tgSend(id, h(text));
  if (ch === "i") return igSend(id, text);
  throw new Error("noma'lum kanal");
}
export function extractPhone(text) {
  const m = String(text || "").match(/(?:\+?998)?[\s\-()]*(\d{2})[\s\-()]*(\d{3})[\s\-]*(\d{2})[\s\-]*(\d{2})(?!\d)/);
  if (!m) return null;
  const d = m.slice(1).join("");
  return d.length === 9 ? d : null;
}
const tag = (ch, id) => `#${ch}${id}`;
const WAIT = () => (workHours(new Date()) ? "Menejer 09:00–21:00 oralig'ida javob beradi." : "Hozir ish vaqtidan tashqari: menejer ertaga 09:00 dan keyin yozadi.");

export async function handoff({ ch, id, name, username, reason, state }) {
  state.handed = true;
  const last = (state.hist || []).slice(-4).map((m) => `${m.role === "user" ? "Mijoz" : "AI"}: ${m.content}`).join("\n");
  await notifyManager(`<b>Menejerga uzatildi</b> ${tag(ch, id)}\nKanal: ${CH_NAME[ch]}\nMijoz: ${h(name || "—")}${username ? " @" + h(username) : ""}\nSabab: ${h(reason)}${state.phone ? "\nTelefon: " + h(state.phone) : ""}${last ? "\n\n" + h(last) : ""}\n\nJavob berish: shu xabarga reply qiling. /close — suhbatni yakunlash.`).catch((e) => console.error("handoff xabari:", e.message));
  return `Suhbat menejerga uzatildi. ${WAIT()}${state.phone ? "" : ch === "i" ? " Qo'ng'iroq uchun telefon raqamingizni yozing." : ""}`;
}

// natija: { messages: [matn...], offer: {code,priority}|null }
export async function converse({ ch, id, name, username, text }) {
  const key = `${ch}:${id}`;
  const state = (await kvGet(key)) || { hist: [], n: 0 };
  const hr = Math.floor(Date.now() / 3600000);
  if (state.hr !== hr) { state.hr = hr; state.n = 0; }
  state.n++;
  if (state.n > 30) { await kvSet(key, state); return { messages: ["Soatlik xabarlar limiti tugadi. Birozdan keyin yozing."], offer: null }; }
  const t = String(text || "").trim().slice(0, 1000);
  if (!t) return { messages: [], offer: null };

  const p9 = extractPhone(t);
  if (p9) { // mijoz o'zi telefon yozdi: qo'ng'iroq so'rovi
    state.phone = fmtPhone(p9);
    const note = (state.hist || []).slice(-4).map((m) => `${m.role === "user" ? "Mijoz" : "AI"}: ${m.content}`).join("\n");
    const res = await dispatchLead({ kind: "callback", name, phone: state.phone, source: CH_NAME[ch], note: `${username ? "@" + username + "\n" : ""}${note}`, utm_source: ch === "u" ? "telegram" : "instagram", utm_medium: "bot" });
    await kvSet(key, state);
    return { messages: [res.ok === false && res.destinations ? "Raqamingiz qabul qilindi, lekin tizimga yozishda xatolik bo'ldi. Iltimos, birozdan keyin yana yozing." : `Raqamingiz qabul qilindi (${state.phone}). ${WAIT()}`], offer: null };
  }
  if (state.handed) { // menejer bilan suhbat: AI jim, xabar menejerga boradi
    await notifyManager(`<b>Mijoz yozdi</b> ${tag(ch, id)}\n${h(t)}`).catch((e) => console.error(e.message));
    await kvSet(key, state);
    return { messages: [], offer: null };
  }
  const r = await aiReply({ text: t, history: state.hist, context: state.ctx });
  state.hist = [...(state.hist || []), { role: "user", content: t.slice(0, 500) }, { role: "assistant", content: r.text.slice(0, 600) }].slice(-8);
  const messages = [r.text];
  let offer = null;
  if (r.handoff) {
    if (r.handoff.code === "URGENT" || r.handoff.code === "USER_ASK") messages.push(await handoff({ ch, id, name, username, reason: r.handoff.code, state }));
    else offer = r.handoff;
  }
  await kvSet(key, state);
  return { messages, offer };
}
export async function closeHandoff(ch, id) {
  const key = `${ch}:${id}`;
  const state = (await kvGet(key)) || { hist: [] };
  state.handed = false;
  await kvSet(key, state);
  await sendTo(ch, id, "Suhbat yakunlandi. Yangi savolingiz bo'lsa, shu yerga yozing.");
}
export async function manualHandoff(args) {
  const key = `${args.ch}:${args.id}`;
  const state = (await kvGet(key)) || { hist: [], n: 0 };
  const msg = await handoff({ ...args, state });
  await kvSet(key, state);
  return msg;
}
