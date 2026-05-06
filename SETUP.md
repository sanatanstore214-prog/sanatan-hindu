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

Ab `.env` file open karo aur values bhari karo.

---

## Step 3: API Keys (3 cheezein)

### A) Google Gemini API Key — BILKUL FREE!
1. https://aistudio.google.com/app/apikey kholho
2. Gmail account se login karo
3. "Create API Key" dabao
4. Copy karke `.env` mein paste karo:
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXX
   ```

---

### B) Instagram Username + Password — Koi developer account nahi chahiye!
Sirf apna Instagram username aur password daalo:
```
INSTAGRAM_USERNAME=tera_instagram_username
INSTAGRAM_PASSWORD=tera_instagram_password
```

> **Tip:** Agar 2FA (Two-Factor Authentication) on hai toh band kar do ya
> Instagram ke settings mein "App Password" banao.

---

### C) ImgBB API Key — FREE Image Hosting
1. https://imgbb.com pe signup karo (Google se bhi ho sakta hai)
2. https://api.imgbb.com pe jao
3. "Get API Key" copy karo
4. `.env` mein paste karo:
   ```
   IMGBB_API_KEY=abc123def456
   ```

---

### D) Amazon Affiliate Tag (Optional — income ke liye)
1. https://affiliate-program.amazon.in join karo
2. Associate ID copy karo (e.g. `yourname-21`)
3. `.env` mein: `AMAZON_AFFILIATE_TAG=yourname-21`

---

## Step 4: Test Karo

```bash
# AI + trend test (Instagram ki zaroorat nahi)
python main.py --test-trend

# Caption + hashtags test
python main.py --test-content

# Ad image banao (saves to /tmp/ig_post.jpg)
python main.py --test-design

# Instagram pe actual post karo!
python main.py --test-post

# Sab theek hai? Daily scheduler start karo:
python main.py
```

---

## Step 5: 24/7 Server Pe Run Karo

### Option A: Screen (Simple)
```bash
screen -S healthbot
python main.py
# Ctrl+A then D to detach
```

### Option B: systemd (VPS pe best)
```bash
sudo nano /etc/systemd/system/healthbot.service
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

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable healthbot && sudo systemctl start healthbot
```

---

## Daily Schedule

| Time | Kya karta hai |
|------|--------------|
| 08:00 AM | Trending product dhundta hai + ad image banata hai + Instagram post |
| 12:00 PM | 5 potential clients dhundta hai + DM bhejta hai |
| 06:00 PM | 5 aur clients + DM (max 10/day total) |
| Har 30 min | Inbox check karta hai + AI se auto-reply |

---

## Troubleshooting

**Login fail:**
→ 2FA band karo Instagram mein, phir try karo

**"Challenge required":**
→ Kuch ghante baad try karo, Instagram ne suspicious activity detect ki

**Image font issue:**
```bash
sudo apt install fonts-dejavu-core
```

**Google Trends 429:**
→ Normal hai, bot fallback product use karta hai automatically
