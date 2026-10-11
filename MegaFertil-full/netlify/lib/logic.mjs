const SC_NAME = { m: "erkak", f: "ayol", c: "juftlik" };
/* ===== LOGIC (toza funksiyalar, DOM'siz; Node'da sinab ko'riladi) ===== */
const DOMAINS = ["lifestyle", "nutrition", "stress_sleep", "spec", "history"];
const DOMAIN_LABEL = { lifestyle: "Turmush tarzi", nutrition: "Ovqatlanish", stress_sleep: "Uyqu va stress", spec: "Siklga / erkak omiliga oid", history: "Anamnez va ko'riklar" };
const W = { lifestyle: 0.25, nutrition: 0.15, stress_sleep: 0.2, spec: 0.25, history: 0.15 };

const o = (id, t, p, flag) => ({ id, t, p: p || {}, flag: flag || null });

const QS = {
  Q1: { code: "Q1", t: "Test kim uchun?", opts: [o("m", "Men — erkak"), o("f", "Men — ayol"), o("c", "Biz — juftlik")] },
  Q2: { code: "Q2", t: "Yoshingiz qaysi oraliqda? (juftlikda: kattangiz)", opts: [o("a", "18–24"), o("b", "25–29"), o("c", "30–34", { history: 1 }), o("d", "35–39", { history: 2 }), o("e", "40 va undan katta", { history: 3 })] },
  Q3: { code: "Q3", t: "Farzand rejalashtirganingizga qancha vaqt bo'ldi?", opts: [o("a", "Hali boshlamadik"), o("b", "6 oydan kam", {}), o("c", "6–12 oy", { history: 1 }), o("d", "12 oydan ko'p", { history: 2 })] },
  Q4: { code: "Q4", t: "Chekish va alkogol iste'moli", opts: [o("a", "Umuman yo'q"), o("b", "Ba'zan", { lifestyle: 1 }), o("c", "Muntazam", { lifestyle: 3 })] },
  Q5: { code: "Q5", t: "Haftasiga necha marta jismoniy faollik qilasiz?", opts: [o("a", "Deyarli yo'q", { lifestyle: 3 }), o("b", "1–2 marta", { lifestyle: 2 }), o("c", "3–4 marta"), o("d", "5 va undan ko'p")] },
  Q6: { code: "Q6", t: "Ovqatlanish tartibingiz qanday?", opts: [o("a", "Sabzavot, meva va oqsil muvozanatli"), o("b", "Ba'zan muvozanat buziladi", { nutrition: 1 }), o("c", "Ko'pincha tez ovqat va shirinlik", { nutrition: 3 })] },
  Q7: { code: "Q7", t: "Uyqu va stress holatingiz", opts: [o("a", "7–8 soat uxlayman, stress past"), o("b", "Uyqu yetarli, stress o'rtacha", { stress_sleep: 1 }), o("c", "6 soatdan kam yoki stress yuqori", { stress_sleep: 2 }), o("d", "Uyqu buzilgan va stress doimiy", { stress_sleep: 3 })] },
  A1: { code: "A1", t: "Hayz sikli muntazammi? (ayol uchun)", opts: [o("a", "Muntazam"), o("b", "Ba'zan buziladi", { spec: 1 }), o("c", "Juda tartibsiz yoki yo'q", { spec: 3 }, "CYCLE_IRREG")] },
  A2: { code: "A2", t: "Hayz davridagi og'riq darajasi (ayol uchun)", opts: [o("a", "Yo'q"), o("b", "Yengil", { spec: 1 }), o("c", "Kuchli, kundalik ishga xalaqit beradi", { spec: 2 }, "PAIN_SEVERE")] },
  A3: { code: "A3", t: "Shifokor sizga ginekologik holat borligini aytganmi?", opts: [o("n", "Yo'q"), o("u", "Bilmayman / eslolmayman", { history: 1 }), o("y", "Ha", { history: 3 }, "MED_HISTORY")] },
  A4: { code: "A4", t: "Oxirgi yilda vazningiz o'zgarganmi?", opts: [o("a", "Barqaror"), o("b", "3–5 kg o'zgardi", { lifestyle: 1 }), o("c", "5 kg dan ko'p o'zgardi", { lifestyle: 2 })] },
  A5: { code: "A5", t: "Gormonal kontratseptivlar qabul qilganmisiz?", opts: [o("a", "Hech qachon"), o("b", "Ha, 6 oydan oldin to'xtatganman"), o("c", "Ha, yaqinda to'xtatdim", { history: 1 })] },
  A6: { code: "A6", t: "Oxirgi 12 oyda ginekolog ko'rigidan o'tdingizmi?", opts: [o("y", "Ha"), o("n", "Yo'q", { history: 1 })] },
  E1: { code: "E1", t: "Issiqlik ta'siri: uzoq o'tirish, sauna/hammom, issiq ish muhiti (erkak uchun)", opts: [o("a", "Deyarli yo'q"), o("b", "Ba'zan", { spec: 1 }), o("c", "Muntazam", { spec: 3 })] },
  E2: { code: "E2", t: "Kasbingizda zararli omillar bormi? (kimyoviy, tebranish, uzoq haydash)", opts: [o("a", "Yo'q"), o("b", "Bitta omil", { spec: 1 }), o("c", "Bir nechta omil", { spec: 2 })] },
  E3: { code: "E3", t: "Shifokor sizga urologik yoki androlog holat borligini aytganmi?", opts: [o("n", "Yo'q"), o("u", "Bilmayman / eslolmayman", { history: 1 }), o("y", "Ha", { history: 3 }, "MED_HISTORY")] },
  E4: { code: "E4", t: "Vazn guruhingiz (tana massa indeksi bo'yicha, taxminan)", opts: [o("a", "Me'yorda"), o("b", "Biroz ortiqcha", { lifestyle: 1 }), o("c", "Sezilarli ortiqcha", { lifestyle: 2 })] },
  E5: { code: "E5", t: "Surunkali kasallik yoki muntazam dori qabul qilasizmi?", opts: [o("n", "Yo'q"), o("y", "Ha", { history: 3 }, "MED_HISTORY")] },
  E6: { code: "E6", t: "Oxirgi 12 oyda urolog ko'rigi yoki spermogramma bo'lganmi?", opts: [o("y", "Ha"), o("n", "Yo'q", { history: 1 })] },
  Q14: { code: "Q14", t: "Hozir vitamin yoki qo'shimcha qabul qilasizmi?", opts: [o("a", "Yo'q"), o("b", "Ha, shifokor bilan kelishganman"), o("c", "Ha, o'zim tanlaganman", { lifestyle: 1 })] },
  Q15: { code: "Q15", t: "Tavsiyani qaysi kanalda olishni xohlaysiz?", opts: [o("tg", "Telegram"), o("ph", "Telefon"), o("web", "Faqat saytda")] },
};

const COMMON = ["Q2", "Q3", "Q4", "Q5", "Q6", "Q7"];
const FLOW = {
  m: ["Q1", ...COMMON, "E1", "E2", "E3", "E4", "E5", "E6", "Q14", "Q15"],
  f: ["Q1", ...COMMON, "A1", "A2", "A3", "A4", "A5", "A6", "Q14", "Q15"],
  c: ["Q1", ...COMMON, "A1", "A3", "A6", "E1", "E3", "E6", "Q14", "Q15"],
};
const PART_CODES = {
  m: { "Erkak": [...COMMON, "E1", "E2", "E3", "E4", "E5", "E6", "Q14"] },
  f: { "Ayol": [...COMMON, "A1", "A2", "A3", "A4", "A5", "A6", "Q14"] },
  c: { "Ayol": [...COMMON, "A1", "A3", "A6", "Q14"], "Erkak": [...COMMON, "E1", "E3", "E6", "Q14"] },
};

function domainScores(codes, answers) {
  const out = {};
  for (const d of DOMAINS) {
    let sum = 0, max = 0;
    for (const c of codes) {
      const q = QS[c];
      max += Math.max(0, ...q.opts.map((x) => x.p[d] || 0));
      const op = q.opts.find((x) => x.id === answers[c]);
      if (op) sum += op.p[d] || 0;
    }
    out[d] = max ? Math.round(100 * (1 - Math.min(sum / max, 1))) : null;
  }
  return out;
}
function indexOf(ds) {
  let tw = 0, s = 0;
  for (const d of DOMAINS) { if (ds[d] == null) continue; tw += W[d]; s += W[d] * ds[d]; }
  return tw ? Math.round(s / tw) : 0;
}
function bandOf(i) { return i >= 80 ? "high" : i >= 60 ? "medium" : i >= 40 ? "attention" : "consult"; }
const BAND_LABEL = { high: "Qulay", medium: "O'rtacha", attention: "E'tibor kerak", consult: "Mutaxassis ko'rigi tavsiya etiladi" };
const FLAG_LABEL = {
  MED_HISTORY: "Shifokor aytgan holat yoki surunkali kasallik/dori",
  CYCLE_IRREG: "Hayz sikli juda tartibsiz yoki yo'q",
  PAIN_SEVERE: "Hayz davrida kuchli og'riq",
  TRY_12M: "Farzand ko'rishga 12 oydan ortiq urinish",
  TRY_6M_35: "35 yoshdan oshgan va 6 oydan ortiq urinish",
  AGE40_TRY6: "40 yosh va undan katta, 6 oydan ortiq urinish",
};
function redFlags(codes, a) {
  const f = [];
  const has = (c) => codes.includes(c);
  if ((has("A3") && a.A3 === "y") || (has("E3") && a.E3 === "y") || (has("E5") && a.E5 === "y")) f.push("MED_HISTORY");
  if (has("A1") && a.A1 === "c") f.push("CYCLE_IRREG");
  if (has("A2") && a.A2 === "c") f.push("PAIN_SEVERE");
  const older = a.Q2 === "d" || a.Q2 === "e";
  if (a.Q3 === "d") f.push("TRY_12M");
  else if (older && a.Q3 === "c") f.push("TRY_6M_35");
  if (a.Q2 === "e" && (a.Q3 === "c" || a.Q3 === "d")) f.push("AGE40_TRY6");
  return f;
}
function flowCodes(sc) { return FLOW[sc] || []; }
function isComplete(sc, answers) { return flowCodes(sc).length === 15 && flowCodes(sc).every((c) => answers[c]); }
function computeResult(sc, answers) {
  const codes = flowCodes(sc);
  const a = {};
  for (const c of codes) if (answers[c]) a[c] = answers[c];
  const parts = Object.entries(PART_CODES[sc]).map(([label, cs]) => {
    const domains = domainScores(cs, a);
    return { label, domains, idx: indexOf(domains) };
  });
  let index;
  if (parts.length === 2) {
    const mn = Math.min(parts[0].idx, parts[1].idx);
    index = Math.round(Math.min((parts[0].idx + parts[1].idx) / 2, mn + 15));
  } else index = parts[0].idx;
  const flags = redFlags(codes, a);
  // eng zaif domenlar (barcha qismlar bo'yicha o'rtacha)
  const avg = {};
  for (const d of DOMAINS) {
    const v = parts.map((p) => p.domains[d]).filter((x) => x != null);
    avg[d] = v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null;
  }
  const weak = DOMAINS.filter((d) => avg[d] != null).sort((x, y) => avg[x] - avg[y]).slice(0, 3);
  return { scenario: sc, index, band: bandOf(index), parts, flags, weak, avg, channel: a.Q15 || "web" };
}
const TIPS = {
  lifestyle: "Chekish, alkogol va harakat odatlarini ko'rib chiqing: haftasiga 3–4 marta o'rtacha yuklama ko'pchilik uchun qulay boshlang'ich nuqta.",
  nutrition: "Ovqatlanishda sabzavot, meva va oqsil muvozanatiga e'tibor bering, tez ovqat va shirinlik chastotasini kamaytiring.",
  stress_sleep: "Uyquni muntazam va yetarli qiling; kundalik stressni kamaytiradigan odat (piyoda yurish, nafas mashqi) qo'shing.",
  spec: "Sikl yoki erkak salomatligi bilan bog'liq belgilar bo'lsa, ularni ginekolog yoki urolog bilan muhokama qiling.",
  history: "Oxirgi 12 oyda ko'rikdan o'tmagan bo'lsangiz, tegishli shifokor ko'rigiga yoziling.",
};
function leadGrade(res, hasPhone) {
  if (!hasPhone) return "C";
  if (res.flags.length) return "A";
  return res.index >= 40 && res.index < 80 ? "A" : "B";
}

/* ---- telefon, manzil, buyurtma ---- */
function digits(s) { return String(s || "").replace(/\D/g, ""); }
function phoneLocal(s) { let d = digits(s); if (d.startsWith("998")) d = d.slice(3); return d.slice(0, 9); }
function fmtPhone(s) {
  const d = phoneLocal(s);
  let r = "+998";
  if (d.length) r += " (" + d.slice(0, 2);
  if (d.length >= 2) r += ")";
  if (d.length > 2) r += " " + d.slice(2, 5);
  if (d.length > 5) r += "-" + d.slice(5, 7);
  if (d.length > 7) r += "-" + d.slice(7, 9);
  return r;
}
function validPhone(s) { return phoneLocal(s).length === 9; }
const fmtSum = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
const FEE = { A: 20000, B: 30000, C: 40000 };
const FREE_FROM = 500000;
function calcOrder(price, qty, promo, zone) {
  const sub = price * qty;
  const pr = String(promo || "").trim().toUpperCase();
  const disc = pr === "TEST10" ? Math.round(sub * 0.1) : 0;
  const after = sub - disc;
  const fee = after >= FREE_FROM ? 0 : FEE[zone] || FEE.C;
  return { sub, disc, fee, total: after + fee, promoOk: pr === "" ? null : disc > 0 };
}
const REGIONS = [
  { id: "tsh", n: "Toshkent shahri", z: "A", d: ["Chilonzor", "Yunusobod", "Mirzo Ulug'bek", "Yakkasaroy", "Shayxontohur", "Sergeli", "Olmazor"] },
  { id: "tv", n: "Toshkent viloyati", z: "A", d: ["Chirchiq", "Angren", "Olmaliq", "Zangiota", "Qibray", "Nurafshon"] },
  { id: "sam", n: "Samarqand viloyati", z: "B", d: ["Samarqand shahri", "Kattaqo'rg'on", "Urgut", "Bulung'ur"] },
  { id: "bux", n: "Buxoro viloyati", z: "B", d: ["Buxoro shahri", "G'ijduvon", "Kogon", "Vobkent"] },
  { id: "far", n: "Farg'ona viloyati", z: "B", d: ["Farg'ona shahri", "Marg'ilon", "Qo'qon", "Quvasoy"] },
  { id: "and", n: "Andijon viloyati", z: "B", d: ["Andijon shahri", "Asaka", "Xonobod", "Shahrixon"] },
  { id: "nam", n: "Namangan viloyati", z: "B", d: ["Namangan shahri", "Chust", "Pop", "Uychi"] },
  { id: "xor", n: "Xorazm viloyati", z: "C", d: ["Urganch", "Xiva", "Shovot", "Xonqa"] },
  { id: "qq", n: "Qoraqalpog'iston Respublikasi", z: "C", d: ["Nukus", "Mo'ynoq", "Qo'ng'irot", "Beruniy"] },
  { id: "qas", n: "Qashqadaryo viloyati", z: "C", d: ["Qarshi", "Shahrisabz", "Kitob", "Muborak"] },
  { id: "sur", n: "Surxondaryo viloyati", z: "C", d: ["Termiz", "Denov", "Sho'rchi", "Boysun"] },
  { id: "nav", n: "Navoiy viloyati", z: "C", d: ["Navoiy shahri", "Zarafshon", "Uchquduq", "Karmana"] },
  { id: "jiz", n: "Jizzax viloyati", z: "B", d: ["Jizzax shahri", "Forish", "G'allaorol", "Zomin"] },
  { id: "sir", n: "Sirdaryo viloyati", z: "B", d: ["Guliston", "Yangiyer", "Shirin", "Sardoba"] },
];
function validateOrder(f) {
  const e = {};
  if (String(f.name || "").trim().length < 2) e.name = "Ismingizni kiriting";
  if (!validPhone(f.phone)) e.phone = "Telefon raqamini to'liq kiriting (9 raqam)";
  const r = REGIONS.find((x) => x.id === f.region);
  if (!r) e.region = "Viloyatni tanlang";
  else if (!r.d.includes(f.district)) e.district = "Tumanni tanlang";
  if (String(f.address || "").trim().length < 5) e.address = "Manzilni kiriting (ko'cha, uy)";
  if (!f.adult) e.adult = "18 yoshdan oshganingizni tasdiqlang";
  if (!f.consent) e.consent = "Ma'lumotlarni qayta ishlashga rozilik kerak";
  return e;
}

/* ---- AI: guardrail + retrieval ---- */
function norm(s) {
  return String(s || "").toLowerCase().replace(/[ʻʼ’‘`´']/g, "").replace(/[^a-zа-яё0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
const STOP = new Set(["bu", "va", "bilan", "uchun", "qanday", "qancha", "nima", "bor", "yoq", "men", "siz", "sizda", "menga", "kerak", "mumkin", "mumkinmi", "boladimi", "bormi", "emas", "ham", "yoki", "qaysi", "necha", "kim", "qayerda"]);
function toks(s) { return norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.slice(0, 5)); }
const RX = {
  urgent: /qon ket|qonash|hushdan|nafas ol\w* qiyin|oldirmoq|oldirish|suitsid|ozimga zarar|kuchli ogriq/,
  injection: /qoidalarni unut|ignore|system prompt|tizim prompt|ko ?rsatmalaring|jailbreak|prompt\w* (kor|ko)sat|oldingi (buyruq|korsatma)/,
  minor: /\b1[0-7] yosh|voyaga yetmagan/,
  human: /menejer|operator|odam bilan|qongiroq|telefon qil|boglan|aloqaga chiq|jonli|inson bilan/,
  medical: /tashxis|diagnoz|doza|necha (marta|dona|tabletka|kapsula)|kuniga necha|homilad|emiz|kasal|davola|alomat|ogri|bepusht|retsept|antibiotik|dorini (bekor|almash)|spermogram|tahlil natij|gormon|saraton|diabet|bosim|kasallik|shifokor kerakmi|xavfsizmi/,
};
function classify(text) {
  const t = norm(text);
  if (RX.urgent.test(t)) return "urgent";
  if (RX.injection.test(t)) return "injection";
  if (RX.minor.test(t)) return "minor";
  if (RX.human.test(t)) return "human";
  if (RX.medical.test(t)) return "medical";
  return "ok";
}
const FORBIDDEN = [/davolaydi/i, /davolaydigan/i, /kafolat/i, /100\s?%/, /tashxis qo['ʻ’]?yadi/i, /bepushtlikni yo['ʻ’]?q/i, /shifo topasiz/i, /homilador bo['ʻ’]?lasiz/i];
function validateClaim(text) { return FORBIDDEN.filter((r) => r.test(text)).map((r) => r.source); }
const TAU = 0.5;
function retrieve(query, kb) {
  const docs = kb.filter((c) => c.status === "published");
  const q = toks(query);
  if (!q.length || !docs.length) return [];
  const sets = docs.map((c) => new Set(toks(c.title + " " + c.keywords + " " + c.text)));
  const N = docs.length;
  const idf = {};
  for (const w of new Set(q)) { const df = sets.filter((s) => s.has(w)).length; idf[w] = Math.log(1 + N / (df + 0.5)); }
  const total = Object.values(idf).reduce((s, x) => s + x, 0) || 1;
  return docs
    .map((c, i) => {
      const hit = [...new Set(q)].filter((w) => sets[i].has(w));
      const kw = new Set(toks(c.title + " " + c.keywords));
      const bonus = hit.filter((w) => kw.has(w)).length * 0.04;
      return { doc: c, score: Math.min(1, hit.reduce((s, w) => s + idf[w], 0) / total + bonus), hit };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
function workHours(now) {
  const h = (now.getUTCHours() + 5) % 24;
  return h >= 9 && h < 21;
}
function answer(text, kb) {
  const risk = classify(text);
  const base = { risk, hits: [], handoff: null, text: "", sources: [] };
  if (risk === "urgent") return { ...base, handoff: { code: "URGENT", priority: "urgent" }, text: "Bu holat shoshilinch e'tibor talab qilishi mumkin. Iltimos, hoziroq 103 ga qo'ng'iroq qiling yoki eng yaqin shifoxonaga murojaat qiling. Men menejerni ham xabardor qildim." };
  if (risk === "injection") return { ...base, text: "Bu so'rov bo'yicha yordam bera olmayman. Mahsulot, buyurtma yoki test natijasi haqida savol bersangiz, mamnuniyat bilan javob beraman." };
  if (risk === "minor") return { ...base, handoff: { code: "MED_Q", priority: "high" }, text: "Mahsulot 18 yoshdan oshganlar uchun. Salomatlik bo'yicha savollar uchun shifokor yoki ota-onangiz bilan maslahatlashing." };
  if (risk === "human") return { ...base, handoff: { code: "USER_ASK", priority: "normal" }, text: "Albatta, sizni menejerga ulayman." };
  if (risk === "medical") return { ...base, handoff: { code: "MED_Q", priority: "high" }, text: "Bu savol tibbiy xulosa yoki dozani talab qiladi, men esa shifokor emasman va tashxis qo'ya olmayman. Iltimos, shifokor bilan maslahatlashing. Xohlasangiz, menejerga ulayman. Qabul qilish tartibi uchun mahsulot yorlig'idagi yo'riqnomaga qarang." };
  const hits = retrieve(text, kb);
  if (!hits.length || hits[0].score < TAU) return { ...base, hits, handoff: { code: "NO_ANSWER", priority: "normal" }, text: "Bu savol bo'yicha tasdiqlangan ma'lumotim yo'q. Noto'g'ri javob bermaslik uchun menejerga ulashni taklif qilaman." };
  const top = hits[0].doc;
  const bad = validateClaim(top.text);
  if (bad.length) return { ...base, hits, handoff: { code: "NO_ANSWER", priority: "normal" }, text: "Javobni tasdiqlay olmadim, menejerga ulashni taklif qilaman." };
  return { ...base, hits, sources: [top.title], text: top.text };
}

/* ---- avtomatlashtirish ---- */
const FLOW_A = [
  { d: 1, t: "Natijangiz: indeks {idx} ({band}). Eng yaxshilanadigan soha: {weak}. Bugun bitta amaliy qadamni sinab ko'ring.", cta: "Hisobotni ochish" },
  { d: 3, t: "Qisqa ta'limiy material: {weak} bo'yicha kundalik odatlar.", cta: "Mahsulot haqida bilish" },
  { d: 7, t: "Savol-javob va yetkazish shartlari. Savolingiz bo'lsa, menejer yordam beradi.", cta: "Buyurtma berish", sales: true },
  { d: 10, t: "Cheklangan taklif: promo-kod TEST10, 48 soat amal qiladi.", cta: "Taklifdan foydalanish", sales: true },
];
const FLOW_A_SAFE = { 7: "Shifokor ko'rigiga tayyorlanish: savollar ro'yxati (ta'limiy material).", 10: "Shifokor bilan suhbatdan keyin savollaringiz bo'lsa, menejer yordam beradi." };
const FLOW_B = [
  { d: 1, t: "Mahsulot yetib keldimi? Qabul qilish tartibi uchun yorliqdagi yo'riqnomaga qarang. Savol bo'lsa, shu yerda yozing.", cta: "AI ga savol" },
  { d: 3, t: "Kurs boshlandimi? Bir tugma bilan javob bering.", cta: "Boshladim / Hali yo'q" },
  { d: 7, t: "Qisqa so'rovnoma (1–5 baho). Nojo'ya ta'sir sezgan bo'lsangiz, shu yerda xabar bering.", cta: "Baho berish" },
  { d: 10, t: "Qayta test: indeksingizni solishtiring (bu tibbiy natija emas, turmush tarzi dinamikasi).", cta: "Testni qayta o'tish" },
];
function fmtMsg(t, ctx) {
  return t.replace("{idx}", ctx.idx).replace("{band}", BAND_LABEL[ctx.band] || "").replace(/\{weak\}/g, ctx.weak);
}
function schedule(kind, anchor, ctx) {
  const steps = kind === "A" ? FLOW_A : FLOW_B;
  return steps.map((s) => {
    const when = new Date(anchor.getTime() + s.d * 86400000);
    when.setUTCHours(5, 0, 0, 0); // 10:00 Toshkent vaqti
    let text = fmtMsg(s.t, ctx);
    let status = "rejalangan";
    if (kind === "A" && ctx.bought) status = "to'xtatilgan (xarid qilingan)";
    else if (kind === "A" && ctx.flagged && s.sales) text = FLOW_A_SAFE[s.d];
    if (ctx.optout) status = "to'xtatilgan (rozilik yo'q)";
    return { d: s.d, when, text, cta: s.cta, channel: ctx.tg ? "Telegram" : "SMS", status };
  });
}


export { QS, FLOW, computeResult, isComplete, answer, classify, retrieve, validateClaim, TAU, workHours, fmtPhone, validPhone, phoneLocal, norm, BAND_LABEL, FLAG_LABEL, SC_NAME };
