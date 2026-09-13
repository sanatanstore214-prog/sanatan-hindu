# 🎧 Bhakti Daily — Audio Setup & Licensing Guide

Background audio ka **poora system ban chuka hai** (background play, lockscreen/
notification controls, seek, mini-player). Bas **legal audio files** daalne
baaki hain. Ye guide wahi bताता hai — legal tareeke + kaise add karein.

---

## ⚠️ Sabse zaroori (Legal) — ye padho
Aarti/bhajan/mantra ki **recordings par copyright hota hai** (jaise T-Series,
Times Music, ya kisi singer/label ki). **Inhe YouTube/dusre app/website se
download karke app me daalna GAIREKANOONI hai** → Google Play app hata dega +
AdSense/AdMob ban + copyright strike.

**Karo ye (legal):**
1. **Khud record karo** — sabse best. Aap (ya koi jaanne wala) aarti/chalisa
   gaakar record karo → copyright **aapka**. 100% safe.
2. **Reciter/singer hire karo** — likhit me "full rights transfer / work for
   hire" lo (Fiverr/local artist). Fir aap maalik.
3. **Public-domain / CC0 audio** — sirf tab jab license saaf-saaf commercial
   use + redistribution allow kare (license screenshot save rakho).
4. **Licensed stock** — proper commercial license khareed ke.

**Mat karo:** YouTube/Spotify/kisi app se rip; "free download" wali sites se
bina license; kisi label/singer ki recording bina permission.

---

## 📥 App me audio kaise add karein (2 tareeke)

### A) Bundle karke (offline, app ke andar)
1. Apni `.mp3` file (128 kbps recommended) yahan rakho:
   `sanatan-app/app/src/main/assets/web/audio/hanuman-chalisa.mp3`
2. `data/content.js` me us item me `audio` set karo:
   ```json
   { "id": "hanuman-chalisa", ... "audio": "hanuman-chalisa.mp3" }
   ```
   (sirf filename — app khud `web/audio/` se utha lega)
3. Rebuild. Reader me ▶ button chalu ho jayega, background + lockscreen sab.

> Formats: **mp3 / m4a / ogg** (build config inhe uncompressed rakhta hai
> taaki native player seedha chala sake). Har file ~1–3 MB rakho warna APK
> bada ho jayega — bahut saari files ho to "streaming" (neeche) use karo.

### B) Streaming (remote URL — APK chhota rehta hai)
`content.js` me `audio` me poora URL do:
```json
"audio": "https://tumhara-server.com/audio/hanuman-chalisa.mp3"
```
Player streaming se chala lega (internet chahiye). Apni files kisi storage
(Firebase Storage / S3 / apni hosting) par daalo jinke aapke paas rights hain.

---

## 🎙️ Khud record karne ke tips (free)
- Shaant kamra, phone ka Recorder ya **Audacity** (free, PC).
- Ek hi speed/pitch, background noise kam.
- Audacity me: Noise Reduction → Normalize → Export as MP3 (128 kbps).
- File ka naam item id jaisa rakho (e.g. `ganesh-aarti.mp3`).

---

## ℹ️ Abhi kya laga hai
- `web/audio/sample-om.wav` — ye ek **synthesized "ॐ" drone** hai (machine se
  banaya, koi copyright nahi) — sirf ye dikhane ke liye ki player kaam karta
  hai. **Ise apni asli recording se replace kar dena.** Filhaal ye
  "शिव पंचाक्षर मंत्र" par laga hai demo ke liye.
- Jin items me `audio` nahi hai, wahan **"🔊 सुनें" (TTS)** button hai — phone
  ki Hindi awaaz se paath sunata hai, bina kisi file ke (legal, hamesha available).

---

## ✅ System jo already ban chuka hai
- Background playback (screen off / app minimize) — foreground MediaService
- Lockscreen + notification controls (play/pause/stop, seek)
- Audio focus (call aaye to auto-pause), headset/bluetooth
- In-app player (seek bar, time) + **mini-player** jo har screen par dikhta hai
- Bundled asset **ya** streaming URL — dono support
