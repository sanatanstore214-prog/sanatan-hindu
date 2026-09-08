# 🚩 Bhakti Daily — Chalisa, Aarti, Mantra & Daily Bhakti Reminder

Ek **premium, offline** devotional Android app. Hanuman Chalisa, aarti,
mantra + **daily reminder**, **streak**, **search**, **favorites**, **dark
mode**, **share cards**. Kamai **Google AdMob** se.

> Architecture: native `MainActivity` (Java) ek WebView host karta hai jo
> offline HTML/CSS/JS app serve karta hai (`WebViewAssetLoader`). Reminders,
> notifications, sharing, ads — sab native. Content + UI web layer me.

---

## ✨ Features
- **Home dashboard** — samay ke hisaab se greeting, "aaj ki bhakti" (vaar-devta),
  streak, quick access, continue-reading, favorites, recents, agla tyohar.
- **Library** — Chalisa / Aarti / Mantra sections (17 verified paath ready,
  baaki catalog me "जल्द" — hum galat/nakli religious text nahi daalte).
- **Reader** — bada/chota font, Light/Dark, **Focus mode**, progress bar,
  "jahan chhoda tha", favorite, share, share-card.
- **Daily Reminder** — AlarmManager se, boot ke baad bhi, deep-link seedha
  content me. Android 13+ permission handle.
- **Streak** — 3/7/21/40/108 din milestones (koi jua-jaisi cheez nahi).
- **Search / Favorites / Recents** — sab offline, localStorage.
- **Share cards** — canvas se sundar card → native share (FileProvider).
- **Ads** — banner + interstitial sirf natural boundaries par (launch ya
  reading ke waqt kabhi nahi). Premium se ads band (architecture ready).

---

## 📲 APK banao
### GitHub Actions (aasaan)
Repo → **Actions** → "Build Sanatan Hindu APK" → **Run workflow** → Artifacts
se `app-debug.apk` download → phone me install.

### PC par
```bash
cd sanatan-app
./gradlew assembleDebug        # app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease      # unsigned release (Play ke liye sign karna hoga)
```

---

## 🔑 Apni kamai ON karo (AdMob)
Abhi **Google TEST ad IDs** lage hain (safe, inse paisa nahi). Badalna:
1. `app/build.gradle` → `manifestPlaceholders.admobAppId` = apni **App ID**
2. `app/src/main/java/com/sanatanhindu/app/AdConfig.java` → `BANNER_AD_UNIT_ID`
   aur `INTERSTITIAL_AD_UNIT_ID` = apni real Ad Unit IDs
3. Rebuild.

> ⚠️ Real ID lagne ke baad apne phone se apne ad par **click mat karna**.

---

## 🏪 Play Store
- `store-assets/PLAY_LISTING.md` — naam, description, keywords, screenshots plan
- `store-assets/DATA_SAFETY.md` — Play Data Safety form ke jawab
- `../PRIVACY_POLICY.md` — privacy policy (public host karke URL Play me daalo)
- Release ke liye: keystore banao → `signingConfigs` add karo → `bundleRelease` (.aab)

---

## 📝 Content add/badalna
Sirf **ek file**: `app/src/main/assets/web/data/content.js`
- `items[]` me entry: `{id, type:"chalisa|aarti|mantra", title, deity, accent,
  icon, status:"ready", text, keywords}`.
- `status:"coming_soon"` wale me **verified** text daal ke `"ready"` kar do.

Design: `assets/web/css/app.css`. Logic: `assets/web/js/app.js`.

---

## 🧪 Tests
```bash
node /tmp/webtest/bhakti_test.js   # 20 view+logic tests (jsdom)
```
