#!/bin/bash
# ─────────────────────────────────────────────────────
#  Instagram Bot — One Click Start
#  Usage: bash start.sh
# ─────────────────────────────────────────────────────

GREEN='\033[92m'
YELLOW='\033[93m'
RED='\033[91m'
RESET='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${GREEN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   Instagram Automation Bot           ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${RESET}"

# .env check
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file nahi mili!${RESET}"
    echo -e "${YELLOW}Pehle setup karo: python setup_wizard.py${RESET}"
    exit 1
fi

# Python check
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 nahi mila! python.org se install karo.${RESET}"
    exit 1
fi

# Packages check
echo -e "${YELLOW}📦 Packages check ho rahi hain...${RESET}"
python3 -m pip install -r requirements.txt -q
echo -e "${GREEN}✅ Sab ready!${RESET}"

echo ""
echo -e "${BOLD}Kya karna hai?${RESET}"
echo "  1) Bot abhi chalao (full cycle — post + clients + DM)"
echo "  2) Daily scheduler start karo (24/7)"
echo "  3) Sirf test karo (Instagram pe kuch post nahi hoga)"
echo "  4) Exit"
echo ""
read -p "Choice (1/2/3/4): " choice

case $choice in
    1)
        echo -e "${GREEN}▶ Full cycle abhi chal raha hai...${RESET}"
        python3 main.py --run-now
        ;;
    2)
        echo -e "${GREEN}▶ Daily scheduler shuru ho raha hai...${RESET}"
        echo -e "${YELLOW}Tip: Ctrl+C se band karo${RESET}"
        echo ""
        python3 main.py
        ;;
    3)
        echo -e "${GREEN}▶ Test mode...${RESET}"
        echo ""
        echo "  a) Trend test"
        echo "  b) Content test"
        echo "  c) Image design test"
        echo "  d) Full post test (actual Instagram pe jayega!)"
        read -p "  Choice (a/b/c/d): " test_choice
        case $test_choice in
            a) python3 main.py --test-trend   ;;
            b) python3 main.py --test-content ;;
            c) python3 main.py --test-design
               echo -e "${GREEN}Image saved: /tmp/ig_post.jpg${RESET}"
               ;;
            d) python3 main.py --test-post    ;;
            *) echo "Invalid choice" ;;
        esac
        ;;
    4)
        echo "Bye!"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${RESET}"
        exit 1
        ;;
esac
