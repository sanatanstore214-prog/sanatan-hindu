# 🚩 Sanatan Hindu — Devotional App (with AdMob earning)

Ek **offline भक्ति app** — Hanuman Chalisa, Aarti, Mantra aur 2026 ka
Vrat/Tyohar calendar. Kamai **Google AdMob ads** se hoti hai (banner +
full-screen ad).

> **Note:** Ye app **WebView + HTML/JS** se bana hai. Saara content phone ke
> andar offline hai — internet sirf ad load karne ke liye chahiye.

---

## 💰 Paise kaise aayenge? (Sach-sach)

Ye **koi "auto free money" app nahi** hai. Asli kamai ka rasta:

```
App banao  →  Play Store par daalo  →  Log download karein  →
   App khulne par ads dikhe  →  Ads se paisa (AdMob)
```

- **Banner ad**: niche hamesha dikhta hai → har view par thoda paisa.
- **Interstitial (full-screen) ad**: har 4 screen-change par ek baar.
- Kamai **users par depend** karti hai. ~1000 active users se mahine ke
  kuch hazaar rupaye possible hain — par iske liye **download laana**
  (Instagram/WhatsApp/YouTube promotion) zaroori hai. Ye mehnat se aata hai,
  jaadू se nahi.

> ⚠️ **AdMob ke 2 golden rules** (warna account ban):
> 1. Apni real ad ID lagne ke baad **apne phone se apne hi ad mat click karo**.
> 2. Doston ko "click karo" mat bolo. Sirf asli users.

---

## 📲 APK kaise banayein (2 tareeke)

### Tareeka 1 — GitHub Actions se (sabse aasaan, PC me kuch install nahi karna)

1. Is code ko GitHub par push karo (already pushed hai).
2. GitHub repo → **Actions** tab → **"Build Sanatan Hindu APK"** → **Run workflow**.
3. ~3-4 min baad **Artifacts** se `SanatanHindu-debug-apk` download karo.
4. ZIP kholke andar `app-debug.apk` apne Android phone me install karo.
   (Phone settings me "Unknown sources / Install unknown apps" allow karna padega.)

### Tareeka 2 — Apne computer par (Android SDK chahiye)

```bash
cd sanatan-app
./gradlew assembleDebug
# APK yahan milega:
# app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔑 Apni AdMob ID lagao (kamai ON karne ke liye)

Abhi app me **Google ki TEST ad IDs** lagi hain (safe — par inse paisa nahi
milta). Apni kamai shuru karne ke liye:

1. https://admob.google.com par **free account** banao.
2. **Apps → Add App → Android** → app ka naam "Sanatan Hindu" do.
   - Yahan se **App ID** milega: `ca-app-pub-XXXXXXXX~YYYYYYYY`
3. **Ad units** banao: ek **Banner**, ek **Interstitial**.
   - Har ek ka **Ad unit ID** milega: `ca-app-pub-XXXXXXXX/ZZZZZZZZ`
4. Code me 2 jagah badlo:

   **a) App ID** → `app/build.gradle` me:
   ```gradle
   manifestPlaceholders = [
       admobAppId: "ca-app-pub-XXXXXXXX~YYYYYYYY"   // <- apni App ID
   ]
   ```

   **b) Ad unit IDs** → `app/src/main/java/com/sanatanhindu/app/MainActivity.java` me:
   ```java
   private static final String BANNER_AD_UNIT_ID = "ca-app-pub-XXXXXXXX/ZZZZZZZZ";
   private static final String INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-XXXXXXXX/WWWWWWWW";
   ```

5. Dobara build karo (upar wala Tareeka 1 ya 2).

---

## 🏪 Play Store par publish (kamai ke liye zaroori)

1. **Google Play Console** account banao (ek baar **$25** fees).
2. **Release APK/AAB** chahiye (debug nahi). Signed build banao:
   - Keystore banao → `app/build.gradle` me `signingConfigs` add karo →
     `./gradlew assembleRelease`.
3. Play Console me app banao, screenshots + icon + description daalo, AdMob
   se link karo, review ke liye bhejo. Approve hone me 1-7 din.

> Pehli baar ke liye debug APK **direct phone install** karke test kar lo;
> Play Store baad me.

---

## 📁 Content kaise badlein / jodein

Naya aarti / mantra / tyohar add karna ho to sirf **ek file** edit karo:
`app/src/main/assets/web/data/content.js`

- `paath[]`  → aarti / chalisa
- `mantra[]` → mantra
- `festivals[]` → vrat/tyohar (date `"YYYY-MM-DD"` format me)

Design badalna ho: `assets/web/css/style.css`.

---

## ⚠️ Disclaimers

- Tyohar ki tareekein **sanket (tentative)** hain — tithi ke hisaab se 1-2
  din aage-peeche ho sakti hain. App me bhi ye note dikhta hai.
- Sacred texts (Chalisa/Aarti/Mantra) shraddha se daale gaye hain; koi
  galti dikhe to `content.js` me theek kar lena.
