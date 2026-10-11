// CRM qatlami: menejer Telegram guruhi (asosiy) + ixtiyoriy Bitrix24. Yangi CRM qo'shish uchun shu faylga adapter qo'shing.
import { tgSend, escapeHtml as h } from "./tg.mjs";

const KIND = { callback: "Qo'ng'iroq so'rovi", quiz: "Test natijasi", order: "Yangi buyurtma", telegram: "Telegram kontakt", instagram: "Instagram so'rov", handoff: "Menejerga uzatildi" };
const clip = (v, n) => String(v == null ? "" : v).slice(0, n || 300);

export function formatLead(l) {
  const L = [`<b>${h(KIND[l.kind] || "Yangi lid")}</b>`];
  const row = (k, v) => { if (v !== "" && v != null) L.push(`${k}: ${h(v)}`); };
  row("Ism", l.name); row("Telefon", l.phone); row("Qulay vaqt", l.time);
  if (l.scenario || l.index !== "" && l.index != null) row("Test", `${l.scenario || ""} indeks ${l.index ?? ""} ${l.band || ""}`.trim());
  row("Bayroqlar", l.flags); row("Daraja", l.grade);
  if (l.order_id) { row("Buyurtma", `${l.order_id}, ${l.qty} qadoq, ${l.total} so'm, ${l.pay}`); row("Manzil", [l.region, l.district, l.address].filter(Boolean).join(", ")); row("Promo", l.promo); }
  row("Manba", l.source); row("Birinchi aloqa", l.first_source);
  if (l.utm_campaign || l.utm_content) row("UTM", [l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content].filter(Boolean).join(" / "));
  row("Izoh", l.note);
  return L.join("\n");
}

async function toBitrix(l) {
  const base = String(process.env.BITRIX_WEBHOOK_URL || "").replace(/\/?$/, "/");
  const comments = [l.time && `Qulay vaqt: ${l.time}`, l.scenario && `Test: ${l.scenario}, indeks ${l.index}, ${l.band}, bayroqlar: ${l.flags || "yo'q"}`, l.order_id && `Buyurtma ${l.order_id}: ${l.qty} qadoq, ${l.total} so'm, ${l.pay}, ${l.region}, ${l.district}, ${l.address}`, l.note].filter(Boolean).join("\n");
  const r = await fetch(base + "crm.lead.add.json", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { TITLE: `MegaFertil: ${KIND[l.kind] || "lid"} ${l.name || l.phone || ""}`.trim(), NAME: l.name || "", PHONE: l.phone ? [{ VALUE: l.phone, VALUE_TYPE: "WORK" }] : [], SOURCE_DESCRIPTION: l.source || "", UTM_SOURCE: l.utm_source || "", UTM_MEDIUM: l.utm_medium || "", UTM_CAMPAIGN: l.utm_campaign || "", UTM_CONTENT: l.utm_content || "", COMMENTS: comments, OPENED: "Y" }, params: { REGISTER_SONET_EVENT: "Y" } }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.result) throw new Error("Bitrix24: " + (j.error_description || j.error || r.status));
  return j.result;
}
export const managerChat = () => String(process.env.TELEGRAM_MANAGER_CHAT_ID || "");
export async function notifyManager(html) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !managerChat()) return false;
  await tgSend(managerChat(), html);
  return true;
}
// natija: { telegram: true|false|undefined, bitrix: ... }, destinations: nechta manzil sozlangan
export async function dispatchLead(raw) {
  const l = {}; for (const k of Object.keys(raw || {})) l[k] = clip(raw[k], k === "note" ? 1500 : 300);
  const res = { destinations: 0 };
  if (process.env.TELEGRAM_BOT_TOKEN && managerChat()) {
    res.destinations++;
    try { await tgSend(managerChat(), formatLead(l)); res.telegram = true; } catch (e) { res.telegram = false; console.error("CRM/Telegram:", e.message); }
  }
  if (process.env.BITRIX_WEBHOOK_URL) {
    res.destinations++;
    try { res.bitrix = await toBitrix(l); } catch (e) { res.bitrix = false; console.error("CRM/Bitrix:", e.message); }
  }
  res.ok = res.telegram === true || (res.bitrix !== undefined && res.bitrix !== false);
  return res;
}
