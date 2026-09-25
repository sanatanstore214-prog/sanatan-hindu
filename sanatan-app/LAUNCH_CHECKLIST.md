# 🚀 Bhakti Daily — Google Play Launch Checklist

Ye **step-by-step** guide hai app ko Google Play par publish karke **kamai
shuru** karne ke liye. Technical jaankari kam se kam rakhi hai. 🙏

App abhi **ready + signed** hai (v4.0). Neeche jo ⬜ hai wo **aapko** karna hai
(zyada tar Google account/paisa wali cheezein — sirf aap kar sakte ho).

---

## 📦 0) Jo AB TAK ban chuka hai (ready)
- ✅ **Google Play 2026 shart poori:** targetSdk **36** (Android 16), edge-to-edge + predictive back
- ✅ **AdMob SDK 25.x** (2028 tak supported) + UMP consent
- ✅ **Signed App Bundle** (Play upload ke liye): `app-release.aab` (v4.0, code 12)
- ✅ **Signed APK** (khud phone me test ke liye): `app-release.apk`
- ✅ **Upload keystore**: `keystore/bhakti-upload.keystore` — *isko sambhaal kar rakho (neeche step 1)*
- ✅ **Feature graphic** (1024x500) + **8 framed screenshots** (Play limit) — `store-assets/`
- ✅ **App icon** 512x512 — `store-assets/playstore-icon-512.png`
- ✅ **Store listing text** (title, description, keywords) — `store-assets/PLAY_LISTING.md`
- ✅ **Data Safety** answers — `store-assets/DATA_SAFETY.md`
- ✅ **Privacy Policy** — `PRIVACY_POLICY.md`

> Ye APK/AAB/keystore file git me **commit NAHI** hote (safety). Main inhe
> aapko chat me alag se bhej raha hoon (download kar lena).

---

## 🔑 1) Keystore ka BACKUP lo — sabse ZAROORI ⚠️
`bhakti-upload.keystore` file aur uske passwords ke bina aap **kabhi app update
nahi kar paoge**. Isliye:
- ⬜ File ko **2-3 jagah** safe rakho (Google Drive + pendrive + email to self).
- ⬜ Passwords likh kar rakho (ye `key.properties` me hain):
  - storePassword: `BhaktiDaily2026`
  - keyAlias: `bhakti`
  - keyPassword: `BhaktiDaily2026`
- ⬜ Kisi ke saath **share mat karo**. (Chaho to baad me password badal sakte ho.)

> Play par "Play App Signing" on hoga (default) — isse agar upload key kho bhi
> jaye to Google se reset ho sakta hai, par phir bhi backup zaroori hai.

---

## 💳 2) Google Play Developer account
- ⬜ Jao: **https://play.google.com/console** → sign in.
- ⬜ **$25 (~₹2,000)** one-time fee bharo (lifetime, koi renewal nahi).
- ⬜ Identity verification (naam, address, kabhi-kabhi ID) — 1-2 din lag sakte hain.

---

## 💰 3) AdMob (kamai ka source) — REAL IDs daalo
Abhi app me **Google ke TEST ad IDs** lage hain (safe — inse kamai nahi hoti,
aur inhe click karna bhi safe hai). Asli kamai ke liye:
- ⬜ **https://admob.google.com** par account banao (free). Bank/UPI + PAN chahiye (payout ke liye).
- ⬜ App add karo → **App ID** milega (`ca-app-pub-XXXX~YYYY`).
- ⬜ **4 ad units** banao: Banner (Adaptive), Interstitial, **Rewarded** (reward `पुण्य अंक`, 1), **App open** → har ek ka **Ad Unit ID** (`ca-app-pub-XXXX/ZZZZ`).
- ⬜ **App ID** daalo: `app/build.gradle` me `admobAppId` wali line.
- ⬜ **Ad Unit IDs** daalo: `app/src/main/java/.../AdConfig.java` (charon).
- ⬜ AdMob → **Privacy & messaging** → "European regulations" message **Publish** karo (UMP consent).
- ⬜ **app-ads.txt** apni website ke root par (`store-assets/app-ads.txt` template) — Play Console me wahi website.
- 📘 Poori jaankari + kamai ka hisaab: **`EARNING_GUIDE.md`**
- ⬜ App dobara build karo (neeche step 8 jaisa `bundleRelease`).

> ⚠️ **Apne hi ads par khud click MAT karo** aur testing me apni real ID +
> apne phone se click mat karo — Google account ban kar sakta hai.

---

## 🌐 4) Privacy Policy online host karo (Play ke liye zaroori)
- ⬜ `PRIVACY_POLICY.md` ka text kisi free page par daalo:
  - Sabse aasan: GitHub Pages (is repo me `web/` folder hai), ya
    **https://telegra.ph** / Google Sites / Notion public page.
- ⬜ Us page ka **URL copy** karo — Play Console me "Privacy Policy" me paste karoge.

---

## 🏪 5) Play Console me app banao
- ⬜ Console → **Create app**: naam `Bhakti Daily`, language Hindi, **App**, **Free**.
- ⬜ **Store listing** bharo (text `store-assets/PLAY_LISTING.md` se):
  - ⬜ App name, Short description, Full description
  - ⬜ App icon (512x512), Feature graphic (1024x500)
  - ⬜ Phone screenshots (`store-assets/screenshots/` ki 8 files upload karo (`extra/` nahi))
  - ⬜ Category: **Lifestyle** (ya Books & Reference), Email + Privacy Policy URL

---

## 📋 6) Policy forms (Console → "App content")
- ⬜ **Privacy policy** URL daalo (step 4)
- ⬜ **Ads**: "Yes, my app contains ads"
- ⬜ **Data safety**: `store-assets/DATA_SAFETY.md` ke hisaab se bharo
      (Advertising ID = Yes; Group Jaap on kiya to Name + jaap count bhi)
- ⬜ **Content rating** questionnaire (devotional app → "Everyone")
- ⬜ **Target audience**: 13+ (ya jaisa chaho), News app = No
- ⬜ **Government app** = No

---

## ⬆️ 7) Release upload karo
- ⬜ Console → **Production** (pehli baar **Closed testing** recommend hai) → **Create release**.
- ⬜ **Play App Signing** ko **on** rehne do (default).
- ⬜ `app-release.aab` upload karo.
- ⬜ Release notes daalo (`PLAY_LISTING.md` ka "What's new v4.0").
- ⬜ **Review** → **Rollout**. Pehli review me **2-7 din** lag sakte hain.

---

## 👨‍👩‍👧 8) (Optional) Group Jaap chalu karna
Group/Family Jaap tab tak "setup pending" dikhta hai jab tak free Firebase na
jode. Poori vidhi: **`GROUP_SETUP.md`** (5 min, free). Ye baad me bhi kar sakte
ho — app iske bina bhi poora chalta hai.

---

## 🔁 9) App dobara build karne ka tarika (jab bhi kuch badlo)
```bash
cd sanatan-app
./gradlew bundleRelease   # Play upload ke liye .aab
./gradlew assembleRelease # phone test ke liye .apk
```
Output:
- AAB → `app/build/outputs/bundle/release/app-release.aab`
- APK → `app/build/outputs/apk/release/app-release.apk`

> Har nayi release me `app/build.gradle` me **versionCode +1** (abhi 12 → 13) aur
> `versionName` badlo (abhi "4.0").

---

## 📈 10) Launch ke baad (kamai badhane ke liye)
- ⬜ Family/dost ko WhatsApp par app + group code bhejo (app me built-in invite).
- ⬜ Roz "आज का आशीर्वाद" card share — har share = naye installs (organic loop).
- ⬜ Reviews maango (4-5★) — ranking + trust badhta hai.
- ⬜ Tyohaar ke din push/share zyada — traffic peak hota hai.
- ⬜ 20-30 installs ke baad AdMob earnings dikhne lagti hai; payout ₹8,000+
      (threshold) par bank me aata hai.

---

### 📞 Help
Kisi bhi step par atko to mujhe bolo — main us step ko detail me karwa dunga. 🚩
