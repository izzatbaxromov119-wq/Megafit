# MegaFertil: sayt + Telegram-bot + AI + CRM + Instagram

Bitta Netlify saytida ishlaydi. Kod ichida kalit yo'q: hamma kalit Netlify sozlamasiga kiritiladi.

```
Sayt (index.html) ──/api/lead──► Menejer Telegram guruhi (+ Bitrix24, ixtiyoriy)
        │  └─────/api/chat──► AI (Claude + bilimlar bazasi + guardrail)
Telegram-bot ─/api/telegram──► AI  ─► xavfli savol/so'rov bo'lsa menejerga uzatadi
Instagram DM ─/api/instagram─► AI  ─► xavfli savol/so'rov bo'lsa menejerga uzatadi
Menejer guruhda xabarga REPLY qilsa, javob mijozga (Telegram yoki Instagram) yetadi.
```

## 1. Joylash (taxminan 15 daqiqa)
1. github.com da bepul akkaunt oching, **New repository** yarating (nomi: megafertil).
2. Repozitoriyada **uploading an existing file** ni bosing va shu papkadagi hamma narsani (`index.html`, `netlify.toml`, `package.json`, `netlify` papkasi) sudrab tashlang. `.env.example` va `README.md` ni ham mumkin. **Commit changes**.
3. app.netlify.com → **Add new site → Import an existing project** → GitHub → repozitoriyni tanlang → **Deploy** (boshqa sozlama kerak emas).
4. Netlify'da **Site configuration → Environment variables** ga `.env.example` dagi kerakli qiymatlarni kiriting (pastdagi 2–5 bosqichlar bo'yicha). Har o'zgarishdan keyin **Deploys → Trigger deploy → Deploy site**.

## 2. Telegram-bot
1. Telegramda **@BotFather** → `/newbot` → nom va username bering → token oling → `TELEGRAM_BOT_TOKEN`.
2. `TELEGRAM_WEBHOOK_SECRET` va `SETUP_KEY` ni o'zingiz o'ylab toping, `ANTHROPIC_API_KEY` ni qo'shing, `SITE_URL` ni yozing. Qayta deploy qiling.
3. Brauzerda oching: `https://SAYTINGIZ/api/setup?key=SETUP_KEY`. `"ok": true` va `"bot": "@..."` chiqsa, bot ulandi.
4. Menejerlar uchun Telegram guruh oching, botni qo'shing, guruhda `/id` deb yozing. Bot "Chat ID: -100..." deb javob beradi. Shuni `TELEGRAM_MANAGER_CHAT_ID` ga yozing, qayta deploy qiling.
5. `https://SAYTINGIZ/api/setup?key=SETUP_KEY&test=1` ni oching: guruhga test xabar kelishi kerak.
6. `index.html` ichida `const CONFIG = {` qatorini toping va `tgBot: "sizning_botingiz"` (@ belgisisiz) yozing. Shunda saytda "Telegramda yozish" tugmalari chiqadi.

**Menejer ishlashi.** Lid yoki "Menejerga uzatildi" xabari guruhga tushadi. Unga **reply** qilib yozsangiz, javob mijozga ketadi. `/close` deb reply qilsangiz suhbat yopiladi va AI yana javob bera boshlaydi.

## 3. Instagram Direct (AI javobi)
1. developers.facebook.com → **Create app** (Business turi) → **Instagram** mahsulotini qo'shing.
2. Instagram akkauntingiz **Professional (Business/Creator)** bo'lishi kerak. Ilovada **API setup with Instagram login** → akkauntni ulang → token yarating → `IG_ACCESS_TOKEN`.
3. **App settings → Basic → App secret** → `IG_APP_SECRET`. `IG_VERIFY_TOKEN` ga istalgan matn yozing. Qayta deploy qiling.
4. Webhooks bo'limida: Callback URL = `https://SAYTINGIZ/api/instagram`, Verify token = `IG_VERIFY_TOKEN` → **Verify and save** → `messages` maydoniga obuna bo'ling.
5. `index.html` dagi `CONFIG` da `instagram: "sahifangiz_nomi"` yozing.

**Muhim:** Meta ilovasi "Development" rejimida faqat siz qo'shgan test foydalanuvchilarga javob beradi. Hammaga ishlashi uchun Meta **App Review** (`instagram_business_manage_messages`) va ko'pincha **Business Verification** kerak. Bu bir necha kun olishi mumkin va men uni tezlashtira olmayman. Instagram'da mijoz yozganidan keyin 24 soat ichida javob berish mumkin. Mijoz telefon raqamini matnda yozsa, bot uni ushlab CRM ga yuboradi.

## 4. CRM
- **Asosiy:** menejer Telegram guruhi (kalit kerak emas, doim ishlaydi).
- **Bitrix24 (ixtiyoriy):** Bitrix24 → Developer resources → Other → **Incoming webhook** (CRM huquqi bilan) → URL ni `BITRIX_WEBHOOK_URL` ga yozing. Har lid Bitrix24 da **Lid** sifatida UTM bilan ochiladi.
- amoCRM yoki boshqa CRM kerak bo'lsa, `netlify/lib/crm.mjs` ga bitta funksiya qo'shiladi (`toBitrix` ga o'xshash).

## 5. AI bilimlar bazasi
Tasdiqlangan matnlar `netlify/lib/kb.mjs` faylida. **Hozirgi matnlar namuna.** Haqiqiy narx, tarkib, yetkazish va qaytarish shartlarini shu yerda tahrirlang (faqat `status: "published"` hujjatlar ishlatiladi). Tibbiy mazmundagi har bir o'zgarishni shifokor yoki yurist ko'rib chiqsin. Saytdagi demo Admin paneli bilimlar bazasini o'zgartirmaydi, u faqat demo.

## Cheklovlar (ochiq aytaman)
- Saytdagi **Admin** bo'limi demo: u faqat tashrif buyuruvchining o'z brauzeridagi ma'lumotni ko'rsatadi. Haqiqiy lidlar Telegram guruhida (va Bitrix24 da). Admin tugmasini yashirish: `CONFIG` da `admin: false`.
- Suhbat holati Netlify Blobs'da saqlanadi. U ishlamasa, holat vaqtincha xotirada turadi va server qayta ishga tushganda o'chadi (menejerga uzatilgan suhbat AI ga qaytib ketishi mumkin).
- Ma'lumotlar xorijiy serverlarga (Netlify, Telegram, Anthropic, Meta) o'tadi. Sog'liq ma'lumotlari uchun O'zbekiston qonunidagi lokalizatsiya talablarini yurist bilan tekshiring; AI ga ism va telefon yuborilmaydi, faqat savol matni va indeks.
- Instagram App Review sizning tomoningizda; men uni o'tkaza olmayman.
- Tizim mahsulot "dori emas" degan taxminga tayanadi. Reklama va matnlarni regulyator talablariga moslang.
