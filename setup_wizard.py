"""
Instagram Bot Setup Wizard
--------------------------
Beginners ke liye — step by step sab set ho jayega.
Run karo: python setup_wizard.py
"""

import os
import sys
import subprocess


# ── Colors ──────────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):    print(f"{GREEN}✅ {msg}{RESET}")
def warn(msg):  print(f"{YELLOW}⚠️  {msg}{RESET}")
def err(msg):   print(f"{RED}❌ {msg}{RESET}")
def info(msg):  print(f"{BLUE}ℹ️  {msg}{RESET}")
def header(msg):print(f"\n{BOLD}{BLUE}{'='*55}{RESET}\n{BOLD}{msg}{RESET}\n{BOLD}{BLUE}{'='*55}{RESET}")
def ask(prompt):
    try:
        return input(f"{YELLOW}👉 {prompt}: {RESET}").strip()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled.")
        sys.exit(0)


# ── Step 1: Python + packages ────────────────────────────────────────────────
def check_python():
    header("Step 1/5 — Python Check")
    v = sys.version_info
    if v.major < 3 or (v.major == 3 and v.minor < 10):
        err(f"Python 3.10+ chahiye, tumhara: {v.major}.{v.minor}")
        info("python.org se latest Python install karo")
        sys.exit(1)
    ok(f"Python {v.major}.{v.minor} — theek hai!")


def install_packages():
    header("Step 2/5 — Packages Install")
    info("Required packages install ho rahi hain...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-q"],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        ok("Sab packages install ho gayi!")
    else:
        warn("Kuch packages install mein problem — manually karo:")
        print(f"  pip install -r requirements.txt")


# ── Step 3: API Keys ─────────────────────────────────────────────────────────
def collect_api_keys():
    header("Step 3/5 — API Keys Setup")

    print("""
Tumhe 3 FREE API keys chahiye. Neeche links hain:

  1. Claude AI Key   → https://console.anthropic.com  (signup → API Keys → Create)
  2. Instagram Token → SETUP.md mein Step B dekho     (thoda kaam ka, 1 baar)
  3. ImgBB Key       → https://api.imgbb.com          (signup → API Key copy karo)

Optional:
  4. Amazon Affiliate → https://affiliate-program.amazon.in
""")

    keys = {}

    # Gemini (FREE)
    print(f"{BOLD}--- Google Gemini Key (FREE) ---{RESET}")
    info("https://aistudio.google.com/apikey → Google se login karo → 'Get API Key' → Create")
    ok("Bilkul free hai — koi credit card nahi chahiye!")
    keys["GEMINI_API_KEY"] = ask("Gemini API Key paste karo (AIzaSy...)")

    # Instagram
    print(f"\n{BOLD}--- Instagram Login ---{RESET}")
    info("Bas apna Instagram username aur password — koi token nahi chahiye!")
    warn("Note: Bot tumhare account se post karega — Business/Creator account best hai")
    keys["INSTAGRAM_USERNAME"] = ask("Instagram username (@ ke bina, e.g. rahul_fitness)")
    keys["INSTAGRAM_PASSWORD"] = ask("Instagram password")

    # ImgBB
    print(f"\n{BOLD}--- ImgBB Image Hosting ---{RESET}")
    info("https://imgbb.com → Sign up → https://api.imgbb.com → API Key copy karo")
    keys["IMGBB_API_KEY"] = ask("ImgBB API Key paste karo")

    # Amazon Affiliate (optional)
    print(f"\n{BOLD}--- Amazon Affiliate (Optional) ---{RESET}")
    info("https://affiliate-program.amazon.in join karo — paise milenge har sale pe")
    aff = ask("Amazon Affiliate Tag (e.g. yourname-21) — skip ke liye Enter dabao")
    keys["AMAZON_AFFILIATE_TAG"] = aff if aff else ""

    # Schedule
    print(f"\n{BOLD}--- Post Schedule ---{RESET}")
    info("Kab post karna hai? Default: 08:00 AM")
    post_time = ask("Post time (e.g. 08:00) — default ke liye Enter dabao")
    keys["POST_TIME"]           = post_time if post_time else "08:00"
    keys["CLIENT_HUNT_TIME_1"]  = "12:00"
    keys["CLIENT_HUNT_TIME_2"]  = "18:00"

    return keys


def write_env_file(keys: dict):
    header("Step 4/5 — .env File Save")
    lines = []
    for k, v in keys.items():
        lines.append(f"{k}={v}")
    with open(".env", "w") as f:
        f.write("\n".join(lines) + "\n")
    ok(".env file save ho gayi!")


# ── Step 4: Test run ──────────────────────────────────────────────────────────
def run_test():
    header("Step 5/5 — Test Run")
    info("Pehle trend research test karte hain (internet chahiye)...")
    result = subprocess.run(
        [sys.executable, "main.py", "--test-trend"],
        capture_output=True, text=True, timeout=60
    )
    if result.returncode == 0:
        ok("Trend test pass!")
        print(result.stdout[-800:] if len(result.stdout) > 800 else result.stdout)
    else:
        warn("Trend test fail hua — lekin .env set hai, manually check karo")
        print(result.stderr[-400:])

    print()
    design_test = ask("Image design test karna hai? (y/n)")
    if design_test.lower() == "y":
        info("Image ban rahi hai...")
        r = subprocess.run(
            [sys.executable, "main.py", "--test-design"],
            capture_output=True, text=True, timeout=60
        )
        if r.returncode == 0:
            ok("Image /tmp/ig_post.jpg pe save ho gayi!")
            info("Dekho: xdg-open /tmp/ig_post.jpg")
        else:
            warn("Image test fail — PIL install check karo: pip install pillow")


# ── Final instructions ────────────────────────────────────────────────────────
def show_final_guide():
    print(f"""
{BOLD}{GREEN}{'='*55}
  SETUP COMPLETE! Bot ready hai. 🎉
{'='*55}{RESET}

{BOLD}Bot start karne ke liye:{RESET}

  {GREEN}python main.py{RESET}                  ← Daily scheduler (24/7)
  {GREEN}python main.py --run-now{RESET}         ← Abhi ek cycle chalao
  {GREEN}python main.py --test-post{RESET}       ← Instagram pe test post

{BOLD}Bot kya karega automatically:{RESET}

  08:00 AM → Trending product dhundega + post karega
  12:00 PM → 5 new clients ko DM karega
  06:00 PM → 5 aur clients ko DM karega
  Har 30 min → DMs ka reply dega (AI se)

{BOLD}Paise kab milenge:{RESET}

  Amazon Affiliate tag set hai?
  → Har sale pe {YELLOW}4–10% commission{RESET} automatically milega!
  → Ek post se ₹500–₹5000+ possible hai.

{BOLD}24/7 chalane ke liye (VPS/server pe):{RESET}

  screen -S bot
  python main.py
  Ctrl+A → D   (background mein chala do)

{YELLOW}Note: Instagram token 60 din mein expire hota hai.
      Renew karna mat bhoolna — SETUP.md Step B4 dekho.{RESET}
""")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print(f"""
{BOLD}{BLUE}
  ╔═══════════════════════════════════════════════╗
  ║   Instagram Automation Bot — Setup Wizard     ║
  ║   Beginners ke liye — 5 minute mein ready     ║
  ╚═══════════════════════════════════════════════╝
{RESET}""")

    # Check if .env already exists
    if os.path.exists(".env"):
        redo = ask(".env file pehle se hai! Phir se setup karna hai? (y/n)")
        if redo.lower() != "y":
            info("Setup skip. Bot chalane ke liye: python main.py")
            return

    check_python()
    install_packages()
    keys = collect_api_keys()
    write_env_file(keys)

    test = ask("\nTest run karna hai? (y/n)")
    if test.lower() == "y":
        run_test()

    show_final_guide()


if __name__ == "__main__":
    main()
