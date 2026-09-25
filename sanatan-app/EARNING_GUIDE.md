# 💰 Bhakti Daily — Earning Guide (₹100/din ka sach + raasta)

## 1) Seedha sach pehle
- **Koi bhi app ₹100/din ki guarantee nahi de sakta.** Kamai = *roz aane wale users (DAU)* × *har user par ads* × *eCPM (₹ per 1000 ads)*.
- India me 2026 ke andaazan rate (±2–3x, bahut badalte hain):

| Ad format | ₹ / 1000 impressions |
|---|---|
| Banner (adaptive) | ₹5 – 12 |
| App open | ₹40 – 100 |
| Interstitial | ₹75 – 170 |
| Rewarded (sabse mehenga) | ₹130 – 260 |

- Is app ka ad-load (halka, policy-safe) ≈ **₹0.20–0.25 per daily user per din**.
- Isliye **₹100/din ≈ ~450 roz ke users** chahiye (achha case ~250, kamzor case 800–1000).
- 450 roz ke users ke liye aam taur par **kai hazaar installs** chahiye (sab roz nahi aate).
- **Payout:** AdMob $100 (~₹8,700) jama hone par bank me bhejta hai → ₹100/din par ~3 mahine me pehla payment.
- Naye AdMob account me pehle kuch hafte **"limited ad serving"** ho sakta hai — normal hai, dheere-dheere khulta hai.

| Roz ke users (DAU) | Andaazan kamai / din |
|---|---|
| 100 | ~₹20–25 |
| 250 | ~₹55 |
| 450 | **~₹100** |
| 1,000 | ~₹220 |
| 5,000 | ~₹1,100 |

> Sources: revenuelab.fyi AdMob eCPM benchmarks 2026, monetizemore India eCPM,
> AdMob payment threshold (support.google.com/admob/answer/2772208).

---

## 2) App me kya bana hai — Earning Engine v4.0

| Format | Kab dikhta hai | Suraksha (policy) |
|---|---|---|
| **Adaptive banner** | Neeche, har screen | Nav buttons se 8dp door (galti se click na ho) |
| **Interstitial** | Sirf *natural break*: 25s+ paath padhkar lautna, mala poori hona, har 3rd screen badalna | 90 sec gap · app khulne ke 45 sec tak nahi · **audio/TTS chalte kabhi nahi** · launch par kabhi nahi |
| **App open** | App me 30s+ baad lautne par | 3 ghante me max 1 · pehle 2 launch me nahi · WhatsApp/share se lautne par nahi · doosre full-screen ad ke turant baad nahi · 4h me expire |
| **Rewarded** 💎 | **Sirf user ke tap par** — inaam pehle likha hota hai | Inaam sirf app ke andar (पुण्य अंक / designs) — kabhi paisa nahi |
| **UMP consent** | EEA/UK users ko form | Google policy (bina iske Europe me ads limited) |

**Rewarded ke 4 moke (sabse zyada kamai):**
1. 🎁 **दैनिक पुण्य दुगना** (1/din)
2. 📿 **Mala ke baad पुण्य दुगना** (5/din)
3. ✨ **Premium gold/glow Status designs — 24 ghante unlock**
4. 🛡️ **स्ट्रीक रक्षक** — ek din chhoot gaya ho to streak bachao

**DAU badhane wale features (retention = kamai):**
naya onboarding (naam → raashi → reminder ka samay) · दैनिक पुण्य 7-din chakra (din 7 = 108) ·
1 din ki chhoot · streak rakshak · raashifal · naam + **apni photo** wala Status/DP (viral) ·
parivaar samuh jaap · aaj ka aashirwad (WhatsApp).

---

## 3) Kamai chalu karne ke steps (ye sirf aap kar sakte ho)
1. **AdMob account:** https://admob.google.com → bank/UPI + PAN + payment profile.
2. **App add karo** (Android). Play par publish hone ke baad AdMob me app ko store listing se **link** karo.
3. **4 ad units banao:** Banner (Adaptive), Interstitial, **Rewarded** (reward naam: `पुण्य अंक`, amount `1`), **App open**.
4. **IDs daalo:**
   - `app/build.gradle` → `admobAppId` = aapka App ID (`ca-app-pub-XXXX~YYYY`)
   - `app/src/main/java/com/sanatanhindu/app/AdConfig.java` → charon unit IDs
5. **Privacy & messaging** (AdMob) → **"European regulations (GDPR)"** message banao aur *Publish* karo (app ka UMP code isi ko dikhata hai).
6. **app-ads.txt** (bahut zaroori — bina iske fill/eCPM kam):
   - `store-assets/app-ads.txt` me apna publisher ID daalo.
   - Ise apni developer website ke **root** par rakho (jaise `https://aapkisite.com/app-ads.txt`).
   - Wahi website Play Console → Store settings → Website me daalo.
   - Free tarika: GitHub user site `https://<username>.github.io/app-ads.txt`.
7. **Build + upload:** `LAUNCH_CHECKLIST.md` (app ab **targetSdk 36** par hai — Play ki 2026 shart poori).
8. **Test:** AdMob → Settings → *Test devices* me apna phone jodo. **Apne ads par kabhi click mat karo.**

---

## 4) Users kaise laayein (DAU = kamai)
- **Launch week:** parivaar/dost/satsang se 50–100 installs (app ka WhatsApp invite + samuh jaap code).
- **Roz:** "आज का आशीर्वाद" aur naam/photo wala **Status/DP** share — har card me Play link hai.
- **Tyohaar:** Navratri, Diwali, Mahashivratri, Janmashtami se 3–5 din pehle festival status post karo (traffic + Q4 eCPM dono upar).
- **Reels / Shorts:** status designs ki 10–15 sec screen recording — "apne naam wala Mahadev status kaise banaye".
- **Bhakti groups** (WhatsApp/Facebook): spam nahi — kaam ki cheez share karo.
- **Reviews:** pehle 20–50 asli achhe reviews ranking badhate hain. **Kabhi fake/paid review nahi** (Play ban).
- **ASO:** title/keywords `store-assets/PLAY_LISTING.md` me ready.

---

## 5) Account bachao — ye kabhi mat karna
- ❌ Apne ads par click / dosto se click karwana (sabse jaldi ban)
- ❌ "Ad dekho, paise pao" jaisa kuch — rewarded inaam **sirf app ke andar**
- ❌ `AdConfig.java` ke gaps/limits kam karke zyada ads — policy strike + users bhaag jaate hain
- ❌ Play ke *Designed for Families* program me opt-in (app-open ads wahan allowed nahi)
- ❌ Ads ke upar koi button/popup

## 6) Kya dekhte rehna hai
- **AdMob → Reports:** eCPM, match rate, impressions per user.
- **Play Console:** installs, **DAU**, D1/D7 retention, crashes.
- DAU hai par kamai kam? → app-ads.txt, GDPR message, sahi unit IDs, "limited ad serving" status check karo.
