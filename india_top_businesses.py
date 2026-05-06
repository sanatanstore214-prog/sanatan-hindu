"""
India ke Top 5 Trending Businesses - 2026
==========================================
Ye data Instagram content aur trend research ke liye use hota hai.
Sources: Google Trends, Amazon India, Industry Reports 2026
"""

INDIA_TOP_BUSINESSES = [
    {
        "rank": 1,
        "name": "Cloud Kitchen / Food Delivery",
        "hindi_name": "Cloud Kitchen",
        "description": "Online food delivery ke liye dedicated kitchen, bina restaurant ke",
        "why_trending": "Zomato aur Swiggy ka boom, India food delivery market ₹2.5 lakh crore tak pahunchega",
        "investment": "₹5 lakh – ₹15 lakh",
        "profit_margin": "20% – 35%",
        "popular_examples": ["Rebel Foods (Faasos)", "Box8", "Biryani By Kilo"],
        "target_cities": ["Mumbai", "Bangalore", "Delhi", "Hyderabad", "Pune"],
        "growth_rate": "25% YoY",
        "instagram_content_angle": "Home cooking se business tak ka safar",
    },
    {
        "rank": 2,
        "name": "AI & SaaS (Software as a Service)",
        "hindi_name": "AI aur Software Business",
        "description": "AI tools, automation software aur subscription-based software services",
        "why_trending": "90% businesses ab AI adopt kar rahe hain, India mein tech talent sabse sasta hai",
        "investment": "₹50,000 – ₹5 lakh (low overhead)",
        "profit_margin": "40% – 70%",
        "popular_examples": ["Zoho", "Freshworks", "Razorpay"],
        "target_cities": ["Bangalore", "Hyderabad", "Pune", "Chennai"],
        "growth_rate": "35% YoY",
        "instagram_content_angle": "Laptop se crores kamate hain ye Indians",
    },
    {
        "rank": 3,
        "name": "E-Commerce & D2C Brands",
        "hindi_name": "Online Business / Direct to Consumer",
        "description": "ONDC, Shopify ya social media se seedha customer ko product bechna",
        "why_trending": "India ka e-commerce market 2026 mein $200 billion ho gaya, ONDC chhote sellers ko power de raha hai",
        "investment": "₹1 lakh – ₹10 lakh",
        "profit_margin": "15% – 50%",
        "popular_examples": ["Mamaearth", "boAt", "Mensxp", "Nykaa"],
        "target_cities": ["Pan India - Tier 1 aur Tier 2 dono"],
        "growth_rate": "30% YoY",
        "instagram_content_angle": "Ghar se shuru karo, Amazon pe becho",
    },
    {
        "rank": 4,
        "name": "Renewable Energy / Solar Business",
        "hindi_name": "Solar aur Green Energy",
        "description": "Solar panel installation, green energy consulting aur EV charging stations",
        "why_trending": "India ka 500 GW non-fossil fuel target 2030 tak, Govt subsidies available, electricity bills mein bachat",
        "investment": "₹10 lakh – ₹50 lakh",
        "profit_margin": "20% – 40%",
        "popular_examples": ["Adani Solar", "Tata Solar", "ReNew Power"],
        "target_cities": ["Rajasthan", "Gujarat", "Maharashtra", "Tamil Nadu"],
        "growth_rate": "40% YoY",
        "instagram_content_angle": "Bijli bill zero karo, paise kamao bhi",
    },
    {
        "rank": 5,
        "name": "Digital Marketing Agency",
        "hindi_name": "Digital Marketing",
        "description": "SEO, Social Media Marketing, Google/Meta Ads, Content Creation services",
        "why_trending": "Har business online aa raha hai, unhe digital marketing experts chahiye",
        "investment": "₹20,000 – ₹2 lakh (laptop aur internet se shuru)",
        "profit_margin": "50% – 80%",
        "popular_examples": ["WATConsult", "Dentsu India", "Pinstorm"],
        "target_cities": ["Mumbai", "Delhi", "Bangalore", "Remote possible"],
        "growth_rate": "28% YoY",
        "instagram_content_angle": "Phone se business - digital agency kaise shuru karein",
    },
]


def get_top_business_summary() -> str:
    """Returns a formatted summary for Instagram content generation."""
    summary = "India ke Top 5 Trending Businesses 2026:\n\n"
    for biz in INDIA_TOP_BUSINESSES:
        summary += f"{biz['rank']}. {biz['name']}\n"
        summary += f"   Investment: {biz['investment']}\n"
        summary += f"   Profit: {biz['profit_margin']}\n"
        summary += f"   Growth: {biz['growth_rate']}\n\n"
    return summary


def get_business_for_content(rank: int = 1) -> dict:
    """Get a specific business by rank for content creation."""
    for biz in INDIA_TOP_BUSINESSES:
        if biz["rank"] == rank:
            return biz
    return INDIA_TOP_BUSINESSES[0]
