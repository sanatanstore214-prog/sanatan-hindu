# 🟢 AdMob Setup — 5 minute ka click-by-click

Ye kaam **aapke AdMob login** me hota hai (browser me). Jaisa likha hai waisa hi type karo.
Ant me 5 IDs mujhe chat me bhej do — baaki sab (code, build, app-ads.txt) main kar dunga.

> Kaunsa Google account? Wahi jisme **payment** lena hai (aur jisse Play Console banaoge).

---

## 1) App banao
1. Kholo: **https://apps.admob.com** → left me **Apps** → **Add app**
2. Platform: **Android**
3. "Is the app listed on a supported app store?" → **No** (abhi Play par nahi hai)
4. App name: **Bhakti Daily** → **Add app**
5. Jo **App ID** dikhe use copy karo — isme **`~`** hota hai:
   `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`

## 2) Charon ad units banao
Apps → **Bhakti Daily** → **Ad units** → **Add ad unit** — har ek ke liye:

| Format chuno | Ad unit name (type karo) | Extra setting |
|---|---|---|
| **Banner** | `Bhakti Banner` | — |
| **Interstitial** | `Bhakti Interstitial` | — |
| **Rewarded** | `Bhakti Rewarded` | Reward amount: `1` · Reward item: `Punya` |
| **App open** | `Bhakti App Open` | — |

Har unit banne par uski **Ad unit ID** copy karo — isme **`/`** hota hai:
`ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`

## 3) Europe consent message (policy ke liye zaroori)
Left me **Privacy & messaging** → **European regulations** → **Create message** →
app: **Bhakti Daily** chuno → baaki default rehne do → **Publish**.

## 4) Payment (sirf aap — main kabhi bank/PAN nahi bharunga)
**Payments** → payment profile: naam, pata, **PAN**, bank. $100 (~₹8,700) jama hone par paisa aata hai.

## 5) Mujhe ye bhej do (chat me paste karo)
```
App ID:        ca-app-pub-...~...
Banner:        ca-app-pub-.../...
Interstitial:  ca-app-pub-.../...
Rewarded:      ca-app-pub-.../...
App open:      ca-app-pub-.../...
```
> Ye IDs **secret nahi** hote (har APK ke andar khule rehte hain) — chat me bhejna safe hai.
> Main `scripts/set_admob_ids.sh` se inhe check karke lagaunga (galat `~`/`/`, test ID,
> ya doosre account ki ID pakad leta hai), `app-ads.txt` me aapka publisher ID daalunga,
> aur final **.aab + .apk** bana kar bhej dunga.

---

## Baad me (Play par app live hone ke baad)
- AdMob → Apps → Bhakti Daily → **App settings** → app ko Play listing se **link** karo.
- **app-ads.txt** website ke root par (main isme madad karunga).
- Shuru me "**Limited ad serving**" dikhe to ghabrana nahi — naye account me normal hai.
- Apna phone **Settings → Test devices** me jodo. **Apne ads par kabhi click mat karna.**
