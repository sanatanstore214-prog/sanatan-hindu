# 👨‍👩‍👧 Bhakti Daily — Family / Group Jaap Setup

Group Jaap ka **poora system app me ban chuka hai** (group banao / code se join karo,
sabhi ka jaap ek **samuhik total** me judta hai, **leaderboard**, WhatsApp invite).
Bas ek **FREE Firebase (Firestore)** project jodna hai — **~5 minute, bilkul free**.

Jab tak config khali hai, app "setup pending" screen dikhata hai aur **baaki poora
app normal chalta hai**. Setup ke baad group jaap live ho jayega.

> Kharcha? Nahi. Firebase ka free "Spark" plan choti/madhyam app ke liye kaafi hai.

---

## ⚡ Fatafat setup (6 step)

### 1) Firebase project banao
1. Jao: **https://console.firebase.google.com**
2. **Add project** → koi bhi naam (jaise `bhakti-daily`) → Continue.
3. Google Analytics **off** kar sakte ho (zaroori nahi) → **Create project**.

### 2) Firestore database chalu karo
1. Left menu → **Build → Firestore Database** → **Create database**.
2. Location: `asia-south1 (Mumbai)` (India ke liye best) → Next.
3. **Start in production mode** chuno → Enable.
   *(Rules abhi neeche step 3 me lagayenge — tab tak koi access nahi.)*

### 3) Security Rules lagao (copy-paste)
Firestore Database → **Rules** tab → sab hata kar ye paste karo → **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groups/{code} {
      allow read: if true;
      allow create: if request.resource.data.name is string
                    && request.resource.data.name.size() <= 40
                    && request.resource.data.total == 0;
      allow update: if true;     // samuhik total badhane ke liye
      allow delete: if false;

      match /members/{uid} {
        allow read: if true;
        allow write: if request.resource.data.name is string
                     && request.resource.data.name.size() <= 24;
      }
    }
  }
}
```

> Ye rules sirf `groups` collection tak access dete hain (naam ≤ 24/40 akshar).
> Saved data sirf: **group ka naam, member ka naam, jaap count**. Koi phone number/
> email/location nahi. Baad me aur strict kar sakte ho.

### 4) Project ID + Web API Key lo
1. Upar ⚙️ (gear) → **Project settings** → **General** tab.
2. **Project ID** copy karo (jaise `bhakti-daily-1a2b3`).
3. Usi page par neeche **Your apps** → **Web app** (`</>`) add karo (agar nahi hai):
   nickname `bhakti-web` → Register. Jo config dikhe usme se **`apiKey`** copy karo
   (jaise `AIzaSy....`). *(Ye "Web API Key" public hoti hai — secret nahi. Suraksha
   Rules se aati hai.)*

### 5) Config file me daalo
`app/src/main/assets/web/data/group-config.js` kholo, dono value bharo:

```js
window.BHAKTI_GROUP_CONFIG = {
  projectId: "bhakti-daily-1a2b3",   // <- apna Project ID
  apiKey: "AIzaSy...."               // <- apna Web API Key
};
```

### 6) App dobara build karo
Bas! Ab **मेरी → समूह जाप** me jaakar group bana/join kar sakte ho.
`./gradlew assembleRelease` (ya web PWA ke liye kuch nahi — turant chalega).

---

## ✅ Kya-kya milta hai (already bana hua)
- **समूह बनाएँ** → 6-akshar ka unique code milta hai (share karne layak).
- **कोड से जुड़ें** → parivaar/dost usi code se ek group me.
- **सामूहिक जाप total** → sab members ka jaap live jud kar ek bada aankda.
- **Leaderboard** → kaun kitna jaap kar raha (🥇🥈🥉), "आप" highlight.
- **WhatsApp invite** → 1-tap par code ke saath nyauta.
- Har mala (jaap round) pura hone par **apne aap group total me jud jata hai**.

## 🔒 Privacy / suraksha (short)
- Sirf **naam + jaap count** cloud me jata hai. Koi personal ID nahi.
- Web API key public hai (normal for client apps) — asli suraksha **Rules** se.
- Chaho to Firestore console me **Usage** dekh sakte ho; free plan me limits kaafi hai.

## 🧯 Kaam na kare to?
- App me group screen "नेटवर्क समस्या" bole → check: Rules **Publish** hue?
  Project ID/API key sahi paste hue? Phone me internet hai?
- "कोड नहीं मिला" → code galat/expire nahi hota; dobara type karo (bade akshar).
- Firestore console → **Data** tab me `groups` collection dikhega jab pehla group banega.
