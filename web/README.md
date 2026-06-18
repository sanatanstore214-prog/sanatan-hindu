# 🌐 Sanatan Hindu — Website (PWA) | PC + Mobile dono

Yahi content (Hanuman Chalisa, Aarti, Mantra, 2026 Tyohar calendar) ek
**website** ke roop me — jo **PC browser aur mobile browser dono** par chalti
hai, **offline** bhi, aur **install** bhi ho jaati hai (app jaisa).

Kamai web par **Google AdSense** se hoti hai (mobile app me AdMob, web me AdSense).

---

## ✅ Kya-kya milega
- 💻 **PC**: kisi bhi browser me link kholo. Chrome/Edge me address bar ke
  paas **install icon (⬇)** se desktop app ban jata hai.
- 📱 **Mobile**: browser me kholo → menu → **"Add to Home Screen"** → app ban gaya.
- 📴 **Offline**: ek baar khulne ke baad bina internet bhi chalti hai.

---

## 🚀 Site ko LIVE kaise karein (free, GitHub Pages)

1. Code push ho chuka hai. Ab GitHub repo me jao →
   **Settings → Pages → Build and deployment → Source = "GitHub Actions"** chuno.
2. Repo → **Actions** → "Deploy Sanatan Website (PWA)" → **Run workflow**
   (ya `web/` me kuch bhi push karo).
3. 1-2 min me site live ho jayegi is link par:
   ```
   https://sanatanstore214-prog.github.io/sanatan-hindu/
   ```
4. Yahi link PC aur mobile, dono par share kar sakte ho.

> Apni khud ki domain (jaise sanatanhindu.in) bhi Pages me jod sakte ho.

---

## 💰 AdSense se kamai ON karein

> **AdMob (app) aur AdSense (web) alag hain.** Website ke liye AdSense chahiye.

1. Site pehle **live** karo (upar wale steps), kyunki AdSense **live URL**
   maangta hai approval ke liye.
2. https://adsense.google.com par account banao → apni site
   `sanatanstore214-prog.github.io` add karo → approval ka wait (kuch din).
3. Approve hone par **Publisher ID** milega: `ca-pub-XXXXXXXXXXXXXXXX`.
4. `web/index.html` me 2 jagah edit karo:
   - `<head>` me AdSense `<script>` line ka **comment hatao**, apna `ca-pub-...` ID dalo.
   - `.web-ad` wale `<ins>` block ka **comment hatao**, usme apna `data-ad-client`
     (ca-pub-...) aur `data-ad-slot` (AdSense me ad unit banane par milega) dalo.
5. Push karo → site update → ads dikhne lagenge.

> ⚠️ AdSense rule: apne hi ad par **khud click mat karo** (account ban ho jayega).

---

## 📝 Content badalna
Sab kuch yahan hai (mobile app jaisa hi):
- `web/data/content.js` → aarti / mantra / tyohar (yahi file mobile app me bhi hai)
- `web/css/style.css` → design

> Tip: `data/content.js`, `js/app.js`, `css/style.css` mobile app
> (`sanatan-app/app/src/main/assets/web/`) aur website dono me hai. Content
> badlo to dono jagah update kar dena (ya ek se doosre me copy kar dena).
