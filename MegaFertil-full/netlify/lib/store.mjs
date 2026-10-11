// Oddiy kalit-qiymat ombori. Netlify Blobs ishlasa, doimiy saqlaydi; aks holda xotirada (server qayta ishga tushsa o'chadi).
const mem = new Map();
let storeP = null;
function getStoreSafe() {
  if (!storeP) {
    storeP = import("@netlify/blobs").then((m) => m.getStore("megafertil")).catch(() => null);
  }
  return storeP;
}
export async function kvGet(key) {
  const s = await getStoreSafe();
  if (s) {
    try { const v = await s.get(key, { type: "json" }); if (v != null) return v; } catch (e) { /* xotiraga tushamiz */ }
  }
  return mem.has(key) ? mem.get(key) : null;
}
export async function kvSet(key, val) {
  mem.set(key, val);
  const s = await getStoreSafe();
  if (s) { try { await s.setJSON(key, val); } catch (e) { /* xotirada qoladi */ } }
}
// IP bo'yicha minutlik limit (xotirada, tezkor himoya)
const rl = new Map();
export function rateLimit(key, max) {
  const m = Math.floor(Date.now() / 60000), k = key + ":" + m;
  const n = (rl.get(k) || 0) + 1;
  rl.set(k, n);
  if (rl.size > 5000) for (const x of rl.keys()) if (!x.endsWith(":" + m)) rl.delete(x);
  return n <= max;
}
