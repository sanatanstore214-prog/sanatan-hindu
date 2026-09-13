# 📺 Bhakti Daily — Live Darshan Setup & Licensing

Live Darshan ka **poora system ban chuka hai** (temple list, detail, aarti
timings, "लाइव दर्शन देखें" button). Ye **official mandir stream** kholta hai.
Bas har mandir ka **verified official URL** daalna baaki hai.

---

## ⚠️ Legal — sabse zaroori
Mandir ke darshan/aarti streams par **copyright** hota hai (mandir trust ya
unke broadcaster ka). Isliye:

**Karo (legal):**
- Sirf us mandir ka **AADHIKARIK (official)** live stream use karo — jo mandir
  trust khud publicly YouTube/apni website par chalata hai.
- Best: bade mandir ke liye trust se **likhit permission** le lo (production app
  ke liye), especially agar app ke andar embed karna ho.
- Sabse safe: stream ko **app ke andar embed mat karo** — bas **official link
  kholo** (YouTube app/browser me). Tab mandir ke ads/monetization intact
  rehte hain aur koi rights issue nahi. **Yahi app abhi karta hai (default).**

**Mat karo:**
- Kisi aur ka stream **rip / re-host / re-stream** — Play se app hat jayega +
  copyright strike.
- Unofficial "re-upload" channels — sirf official verify karke.
- YouTube ki video ko download karke apni hosting par daalna.

> YouTube content sirf YouTube ke official player/link se dikhao (YouTube Terms).
> Isliye default "open official link" hi rakha gaya hai.

---

## 🔧 Official stream kaise jodein
`app/src/main/assets/web/data/darshan.js` — har mandir me `channel` set karo:

```js
{ id:"mahakal", name:"महाकालेश्वर", city:"उज्जैन", ...,
  channel: "https://www.youtube.com/@ShriMahakaleshwar/live" }
```

- `channel` = us mandir ke **official** YouTube channel ka **/live** URL (ya
  official website ka darshan page). Pehle khud verify karo ki ye official hai.
- `channel` **khali** chhodo → app us mandir ka *"live darshan official"*
  YouTube **search** khol dega, taaki user khud official tak pahunche
  (galat/unofficial link hardcode karne se accha).

Naya mandir jodna ho → `darshan.js` ke array me ek entry aur daal do
(id, name, city, deity, accent, icon, aarti, channel).

---

## 🧩 (Advanced) App ke andar embed karna
Agar tum mandir trust se **permission** le lo, to link kholne ki jagah stream
ko app ke andar embed kiya ja sakta hai (YouTube IFrame player). Ye badlav
chhota hai (darshan detail me link kholne ki jagah ek embed screen), par
**bina permission ke recommend nahi** — aur YouTube Terms ka dhyan rakhna.
Bolo to main ye embed-mode bhi jod dunga.

---

## ✅ Jo already ban chuka hai
- 9 famous mandir (Kashi, Mahakal, Somnath, Vaishno Devi, Ram Mandir, Siddhi-
  vinayak, Khatu Shyam, Salasar, Tirupati) — list + detail + aarti timings
- 🔴 "लाइव दर्शन देखें" → official link/search kholta hai (safe)
- Home par "📺 लाइव दर्शन" card + live indicator
- Data-driven — naye mandir / official URL aasaani se add
