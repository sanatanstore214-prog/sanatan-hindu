# 🚀 Bhakti Daily — Google Play Launch Checklist

Ye **step-by-step** guide hai app ko Google Play par publish karke **kamai
shuru** karne ke liye. Technical jaankari kam se kam rakhi hai. 🙏

App abhi **ready + signed** hai (v4.2). Neeche jo ⬜ hai wo **aapko** karna hai
(zyada tar Google account/paisa wali cheezein — sirf aap kar sakte ho).

---

## 📦 0) Jo AB TAK ban chuka hai (ready)
- ✅ **Google Play 2026 shart poori:** targetSdk **36** (Android 16), edge-to-edge + predictive back
- ✅ **AdMob SDK 25.x** (2028 tak supported) + UMP consent
- ✅ **Signed App Bundle** (Play upload ke liye): `app-release.aab` (v4.2, code 14)
- ✅ **v4.2 fix:** app khulte hi khali (blank) screen wala bug theek — Android 10 + purane WebView par asli test karke verify kiya
- ✅ **Signed APK** (khud phone me test ke liye): `app-release.apk`
- ✅ **Upload keystore**: `keystore/bhakti-upload.keystore` — *isko sambhaal kar rakho (neeche step 1)*
- ✅ **Feature graphic** (1024x500) + **8 framed screenshots** (Play limit) — `store-assets/`
- ✅ **App icon** 512x512 — `store-assets/playstore-icon-512.png`
- ✅ **Store listing text** (title, description, keywords) — `store-assets/PLAY_LISTING.md`
- ✅ **Data Safety** answers — `store-assets/DATA_SAFETY.md`
- ✅ **Privacy Policy** — online (Google Doc, published): https://docs.google.com/document/d/e/2PACX-1vTKdl20eFsGi8rpn3Rn7oW_FwF6iXiVpaO1-WX6EKpx7PHMw65tMMEV3Br_KfoA-JeJQ7imUrH9FO1e/pub
  (app ke andar bhi: Settings → 📄 प्राइवेसी पॉलिसी; text = `PRIVACY_POLICY.md`)

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

## 💰 3) AdMob (kamai ka source)
- ✅ AdMob account + app **Bhakti Daily** + 4 ad units (Banner, Interstitial, Rewarded, App open)
- ✅ Real IDs app me lag gaye: **Play/release build = asli ads**, **"Bhakti TEST" = Google test ads** — `ADMOB_SETUP.md`
- ✅ Privacy policy URL AdMob me set + Europe consent message **"Bhakti Daily - GDPR" Published & On** (25 Sep 2026)
- ⬜ **Payments** (naam, pata, PAN, bank) — sirf aap bharo; ~$100 hone par payout.
- ⬜ **app-ads.txt** apni website ke root par (`store-assets/app-ads.txt`) — Play Console me wahi website.
- ⚠️ Apne phone par sirf **"Bhakti TEST"** app chalao (test ads). Play wale (real ads) app me apne ads par kabhi tap mat karna.
- 📘 Poori jaankari + kamai ka hisaab: **`EARNING_GUIDE.md`**

> ⚠️ **Apne hi ads par khud click MAT karo** aur testing me apni real ID +
> apne phone se click mat karo — Google account ban kar sakta hai.

---

## 🌐 4) Privacy Policy online — ✅ HO GAYA
- ✅ Published Google Doc (text `PRIVACY_POLICY.md` se hubahu same):
  **https://docs.google.com/document/d/e/2PACX-1vTKdl20eFsGi8rpn3Rn7oW_FwF6iXiVpaO1-WX6EKpx7PHMw65tMMEV3Br_KfoA-JeJQ7imUrH9FO1e/pub**
- Yahi URL Play Console me daalna hai (step 5 aur 6).
- ⚠️ Policy kabhi badlo to **teeno jagah** same rakho: `PRIVACY_POLICY.md` → `python3 scripts/build_privacy.py`
  (app ke andar wali copy) → Google Doc me wahi text.

---

## 🏪 5) Play Console me app banao
- ⬜ Console → **Create app**: naam `Bhakti Daily`, language Hindi, **App**, **Free**.
- ⬜ **Store listing** bharo (text `store-assets/PLAY_LISTING.md` se):
  - ⬜ App name, Short description, Full description
  - ⬜ App icon (512x512), Feature graphic (1024x500)
  - ⬜ Phone screenshots (`store-assets/screenshots/` ki 8 files upload karo (`extra/` nahi))
  - ⬜ Category: **Lifestyle** (ya Books & Reference), Email + Privacy Policy URL (step 4 wala link)

---

## 📋 6) Policy forms (Console → "App content")
- ⬜ **Privacy policy** URL daalo: https://docs.google.com/document/d/e/2PACX-1vTKdl20eFsGi8rpn3Rn7oW_FwF6iXiVpaO1-WX6EKpx7PHMw65tMMEV3Br_KfoA-JeJQ7imUrH9FO1e/pub
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
- ⬜ Release notes daalo (`PLAY_LISTING.md` ka "What's new v4.2").
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

> Har nayi release me `app/build.gradle` me **versionCode +1** (abhi 14 → 15) aur
> `versionName` badlo (abhi "4.2").

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
