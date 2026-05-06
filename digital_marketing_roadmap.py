"""
Digital Marketing Roadmap - Beginners ke liye
==============================================
Zero se paise kamane tak ka complete guide
Total time: 6 months | Investment: ₹0 – ₹20,000
"""

ROADMAP = {
    "phase_1": {
        "title": "Phase 1 – Neenv banao (Month 1-2)",
        "goal": "Basics seekho - bilkul free mein",
        "topics": [
            {
                "topic": "Google Digital Garage",
                "kya_sikhega": "Digital marketing ke basics - SEO, Social Media, Email",
                "link": "https://learndigital.withgoogle.com/digitalgarage",
                "time": "40 ghante",
                "cost": "FREE + Certificate milega",
            },
            {
                "topic": "Meta Blueprint",
                "kya_sikhega": "Facebook & Instagram Ads chalana",
                "link": "https://www.facebook.com/business/learn",
                "time": "20 ghante",
                "cost": "FREE + Badge milega",
            },
            {
                "topic": "Canva Design",
                "kya_sikhega": "Social media posts, banners, ads banana",
                "link": "https://www.canva.com/learn/",
                "time": "10 ghante",
                "cost": "FREE",
            },
        ],
        "daily_target": "1-2 ghante roz seekho",
        "result": "Digital marketing ki basic understanding + 3 certificates",
    },
    "phase_2": {
        "title": "Phase 2 – Skills pakki karo (Month 3-4)",
        "goal": "Practical karo - asli kaam seekho",
        "topics": [
            {
                "topic": "SEO (Search Engine Optimization)",
                "kya_sikhega": "Google pe website rank karana",
                "resource": "Ahrefs YouTube Channel (free) + Neil Patel blog",
                "time": "30 ghante",
                "cost": "FREE",
            },
            {
                "topic": "Instagram & YouTube Marketing",
                "kya_sikhega": "Organic growth, content calendar, reels strategy",
                "resource": "YouTube pe 'Social Media Marketing Hindi' search karo",
                "time": "20 ghante",
                "cost": "FREE",
            },
            {
                "topic": "Google Ads (Basic)",
                "kya_sikhega": "Paid ads chalana, budget set karna",
                "resource": "Google Skillshop - free certification",
                "link": "https://skillshop.withgoogle.com",
                "time": "25 ghante",
                "cost": "FREE",
            },
        ],
        "practical_task": "2-3 local businesses ke liye FREE project karo portfolio ke liye",
        "result": "Kaam ka experience + portfolio ready",
    },
    "phase_3": {
        "title": "Phase 3 – Pehla Client (Month 5-6)",
        "goal": "Paise kamana shuru karo",
        "steps": [
            "Portfolio website banao (free - Google Sites ya Notion)",
            "LinkedIn profile professional banao",
            "Local dukandaaron se baat karo (salon, restaurant, boutique)",
            "Pehle 2-3 clients se ₹3,000-5,000/month charge karo",
            "Kaam acha hua toh reviews lo aur zyada clients lo",
        ],
        "earning_potential": "₹15,000 – ₹50,000/month (3-4 clients ke saath)",
        "platforms_to_find_clients": [
            "Fiverr (international clients)",
            "Internshala (fresher friendly)",
            "LinkedIn Jobs",
            "Local Facebook Groups",
            "WhatsApp Business Groups",
        ],
    },
}

FREE_TOOLS = {
    "Design": ["Canva (free)", "Adobe Express (free)"],
    "Analytics": ["Google Analytics (free)", "Meta Business Suite (free)"],
    "SEO": ["Google Search Console (free)", "Ubersuggest (limited free)"],
    "Scheduling": ["Buffer (free plan)", "Meta Business Suite (free)"],
    "Email": ["Mailchimp (free upto 500 contacts)"],
    "AI Help": ["ChatGPT (free)", "Claude (free tier)"],
}

MONTHLY_EARNING_TIMELINE = {
    "Month 1-2": "₹0 (seekh raha hai)",
    "Month 3-4": "₹0 – ₹5,000 (free projects)",
    "Month 5-6": "₹10,000 – ₹25,000 (2-3 clients)",
    "Month 7-12": "₹30,000 – ₹75,000 (agency mode)",
    "Year 2+": "₹1,00,000+ (team banao)",
}


def print_roadmap():
    print("=" * 60)
    print("DIGITAL MARKETING ROADMAP - BEGINNERS")
    print("=" * 60)
    for phase_key, phase in ROADMAP.items():
        print(f"\n{phase['title']}")
        print(f"Goal: {phase['goal']}")
    print("\nEarning Timeline:")
    for month, earning in MONTHLY_EARNING_TIMELINE.items():
        print(f"  {month}: {earning}")


if __name__ == "__main__":
    print_roadmap()
