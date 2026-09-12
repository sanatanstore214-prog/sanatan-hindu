# 🚩 Bhakti Daily 3.0 — Daily Sanatan Utility

Ek **premium, offline** devotional app jo har din kholne ki wajah deta hai:
**Aaj ka Sanatan** (पंचांग/तिथि/सूर्योदय), **Jaap counter**, Chalisa/Aarti/Mantra,
**त्योहार mode**, **daily reminder**, **streak**, **wallpaper**, **share cards** —
kamai **Google AdMob** se.

> Architecture: native `MainActivity` (Java) ek WebView host karta hai jo offline
> HTML/CSS/JS app serve karta hai (`WebViewAssetLoader`). Reminders, notifications,
> sharing, wallpaper-set, clipboard, ads — native. Content + UI web layer me,
> modular JS.

---

## ✨ 3.0 Features
- **आज का सनातन (Home)** — greeting + **पंचांग** (weekday, तिथि/पक्ष, चंद्र-कला,
  विक्रम संवत, चुने शहर का सूर्योदय/सूर्यास्त — सब **ganitiy compute**, fabricate नहीं),
  आज की भक्ति (smart recommendation), quick tiles, quote, अगला त्योहार countdown.
- **📿 Jaap Counter** — 11/21/51/108/1008, big tap-ring + progress, vibration/sound
  toggle, aaj/kul count, माला rounds, reset, पूर्ण होने पर streak + share.
- **Smart recommendation** — festival-aware → vaar-devta → time-of-day (`recommend.js`).
- **📅 Festival mode** — list + detail (countdown, verified info, **shareable
  greeting card**, related Chalisa/Aarti/Mantra). Data fabricate नहीं.
- **📚 Library** — Chalisa / Aarti / Mantra (17 verified ready + catalog "जल्द").
- **Premium reader** — font size, Light/Dark, **Focus mode**, progress, continue,
  favorite, **copy**, share, share-card, **auto-scroll**, **audio player
  architecture** (URL जोड़ते ही चालू; अभी "ऑडियो जल्द").
- **🔔 Reminders** — Morning / Daily Chalisa / Evening Aarti / Festival, deep-link,
  boot-persist, Android 13+ permission.
- **🔥 Streak** + milestones (3/7/21/40/108).
- **🖼️ Wallpaper** — app-drawn devotional wallpapers → **set / गैलरी में सेव / शेयर**.
- **🪷 मेरी भक्ति** — personal dashboard (streak, jaap stats, favorites, recents,
  reminders, wallpaper, settings).
- **🔎 Search** (offline, title/deity/keywords + suggestions) · **Dark mode** ·
  tablet layout · **privacy-conscious analytics** (off-able).

## 🧩 Web modules
`data/content.js` (catalog) · `store.js` (persistence) · `bridge.js` (native) ·
`analytics.js` · `panchang.js` (astronomy) · `recommend.js` · `sharecard.js` ·
`wallpaper.js` · `app.js` (router+views).

## 🧠 Native
`MainActivity` (WebView + AdMob + bridge: reminders, notifications, share text/image,
setWallpaper, saveImage→MediaStore, copyText, deep-link) · `ReminderScheduler` /
`ReminderReceiver` / `BootReceiver` · `AdConfig`.

---

## 📲 Build
```bash
cd sanatan-app
./gradlew assembleDebug     # app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease   # unsigned; Play ke liye sign karo
```
Ya GitHub → **Actions** → "Build Sanatan Hindu APK" → Artifacts.

## 🔑 Kamai ON (AdMob)
`app/build.gradle` → `manifestPlaceholders.admobAppId` (App ID); `AdConfig.java` →
`BANNER_AD_UNIT_ID` + `INTERSTITIAL_AD_UNIT_ID`. Test IDs se paisa nahi; apne ad par
khud click mat karna.

## 📝 Content add
`data/content.js` → `items[]` me `{id,type,title,deity,accent,icon,status:"ready",text,
meaning?,audio?,keywords}`. `coming_soon` me **verified** text daal ke `ready` karo.
Festivals: `festivals[]` me `{date,name,deity,accent,info,greeting,related[]}`.

## 🧪 Tests
`node /tmp/webtest/bhakti3_test.js` — 39 view+logic tests (jsdom).

## 🏪 Play
`store-assets/PLAY_LISTING.md`, `store-assets/DATA_SAFETY.md`, `../PRIVACY_POLICY.md`.
