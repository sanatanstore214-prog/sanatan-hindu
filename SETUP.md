# Health & Fitness Instagram Bot — Setup Guide

## Step 1: Python Install Karo

```bash
python3 --version  # 3.10+ chahiye
pip install -r requirements.txt
```

---

## Step 2: .env File Banao

```bash
cp .env.example .env
```

Ab `.env` file open karo aur apni values bhari karo (neeche explained hai).

---

## Step 3: API Keys Kahan Se Milenge

### A) Anthropic API Key (Claude AI)
1. https://console.anthropic.com pe jao
2. Sign up / Login karo
3. "API Keys" section mein "Create Key" karo
4. Copy karo aur `.env` mein `ANTHROPIC_API_KEY=sk-ant-...` paste karo

---

### B) Instagram Graph API Token (IMPORTANT — Business Account)

**Yeh thoda kaam ka hai lekin ek baar karo, phir 60 din kaam karega.**

**Step B1: Facebook Developer Account**
1. https://developers.facebook.com pe jao
2. "My Apps" → "Create App" → "Business" select karo
3. App naam: `HealthFitnessBot`

**Step B2: Instagram Basic Display API Setup**
1. Dashboard mein: "Add Product" → "Instagram Graph API"
2. Settings mein apna Instagram Business account connect karo

**Step B3: Instagram Messaging (DMs ke liye)**
1. "Add Product" → "Messenger" bhi add karo
2. Instagram Messaging permissions request karo:
   - `instagram_basic`
   - `instagram_manage_comments`
   - `instagram_manage_messages`
   - `pages_messaging`

**Step B4: Access Token Generate Karo**
1. Tools → Graph API Explorer
2. Apni App select karo
3. "Generate Access Token" → Instagram account se login karo
4. "Get Long-Lived Token" (60-day token milega):
   ```
   https://graph.facebook.com/v18.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={APP_ID}
     &client_secret={APP_SECRET}
     &fb_exchange_token={SHORT_LIVED_TOKEN}
   ```

**Step B5: Instagram User ID**
```bash
curl "https://graph.facebook.com/v18.0/me?fields=id,name&access_token=YOUR_TOKEN"
```
Milne wala `id` field hi `INSTAGRAM_USER_ID` hai.

Dono `.env` mein paste karo:
```
INSTAGRAM_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
INSTAGRAM_USER_ID=17841400000000000
```

---

### C) ImgBB API Key (Free Image Hosting)
1. https://imgbb.com pe sign up karo (free)
2. https://api.imgbb.com pe jao
3. "Get API Key" → Copy karo
4. `.env` mein paste: `IMGBB_API_KEY=xxxxxxx`

---

### D) Amazon Affiliate Tag (Optional lekin recommended)
1. https://affiliate-program.amazon.in join karo
2. Apna Associate ID copy karo (e.g. `yourname-21`)
3. `.env` mein: `AMAZON_AFFILIATE_TAG=yourname-21`

---

## Step 4: Test Karo (Ek ek step)

```bash
# Step 1: Sirf trend research test karo
python main.py --test-trend

# Step 2: Content generation test karo
python main.py --test-content

# Step 3: Image design test karo (image /tmp/ig_post.jpg mein save hogi)
python main.py --test-design

# Step 4: Full post test karo (actual Instagram pe post hoga!)
python main.py --test-post

# Agar sab theek hai — abhi run karo
python main.py --run-now

# Daily scheduler shuru karo
python main.py
```

---

## Step 5: Server Pe Run Karo (24/7 ke liye)

### Option A: Screen (Simple)
```bash
screen -S instagram-bot
python main.py
# Ctrl+A then D to detach
# screen -r instagram-bot to reattach
```

### Option B: systemd Service (Best for VPS)
```bash
sudo nano /etc/systemd/system/instagram-bot.service
```
```ini
[Unit]
Description=Health Fitness Instagram Bot
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/user/sanatan-hindu
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable instagram-bot
sudo systemctl start instagram-bot
sudo systemctl status instagram-bot
```

---

## Bot Kya Karta Hai — Daily Schedule

| Time | Action |
|------|--------|
| 08:00 AM | Trending health product dhundta hai + Hinglish caption + ad image banata hai + Instagram pe post karta hai |
| 12:00 PM | 5 potential clients dhundta hai (#fitnessindia etc.) aur unhe friendly DM bhejta hai |
| 06:00 PM | 5 aur clients dhundta hai + DM bhejta hai |
| Har 30 min | Incoming DMs check karta hai aur Claude AI se automatically reply karta hai |
| 12:01 AM | Daily DM counter reset karta hai |

---

## Important Notes

- **Instagram Spam**: Bot maximum 10 DMs/day bhejta hai — isse Instagram block nahi karega
- **Token Renewal**: Access token 60 din mein expire hota hai — 55ve din pe renew kar lena
- **Logs**: `bot_YYYYMM.log` file mein sab activity record hoti hai
- **Test Mode**: Pehle `--test-design` run karo image quality check karne ke liye

---

## Troubleshooting

**"Missing .env variables" error:**
→ `.env` file check karo, koi value missing nahi honi chahiye

**"Media container error":**
→ Instagram account Business/Creator hai confirm karo
→ Token permissions check karo

**"Google Trends fetch failed":**
→ Normal hai — fallback product use hoga, post fir bhi hogi

**Image mein font nahi aa rahi:**
```bash
sudo apt install fonts-dejavu-core fonts-liberation
```
