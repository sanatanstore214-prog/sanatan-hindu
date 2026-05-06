import json
import random
import requests
from typing import Optional
from config import HEALTH_KEYWORDS
from prompts.system_prompts import TREND_RESEARCHER_PROMPT
from utils.gemini_client import generate
from utils.logger import get_logger

logger = get_logger("TrendAgent")


class TrendAgent:
    def _fetch_amazon_bestsellers(self) -> str:
        rss_url = "https://www.amazon.in/gp/rss/bestsellers/hpc/ref=zg_bs_hpc_rsslink"
        try:
            resp = requests.get(rss_url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code == 200:
                return f"Amazon India Health Bestsellers RSS:\n{resp.text[:3000]}"
        except Exception as e:
            logger.warning(f"Amazon RSS fetch failed: {e}")
        return ""

    def _fetch_google_trends_summary(self) -> str:
        try:
            from pytrends.request import TrendReq
            pt = TrendReq(hl="en-IN", tz=330, timeout=(10, 25))
            keyword = random.choice(HEALTH_KEYWORDS)
            pt.build_payload([keyword], cat=0, timeframe="now 7-d", geo="IN")
            related = pt.related_queries()
            top = related.get(keyword, {}).get("top")
            if top is not None and not top.empty:
                queries = top["query"].head(10).tolist()
                return f"Google Trends (India, last 7 days) for '{keyword}':\n" + "\n".join(queries)
        except Exception as e:
            logger.warning(f"Google Trends fetch failed: {e}")
        return f"Focus on popular Indian health keyword: {random.choice(HEALTH_KEYWORDS)}"

    def find_trending_product(self) -> Optional[dict]:
        logger.info("Trending product dhundh raha hoon...")
        amazon_data = self._fetch_amazon_bestsellers()
        trends_data = self._fetch_google_trends_summary()

        context = f"""
Aaj ki date: {__import__('datetime').date.today()}

{amazon_data}

{trends_data}

Upar diye data ke basis pe, aaj ke liye BEST ek health/fitness product select karo jo:
1. India mein trending hai
2. Amazon/Flipkart pe available hai
3. Affiliate promotion ke liye suitable hai
4. Indians ke common problems solve karta hai (weight, protein, energy, etc.)
"""
        try:
            raw = generate(TREND_RESEARCHER_PROMPT, context, max_tokens=800)
            start = raw.find("{")
            end = raw.rfind("}") + 1
            product = json.loads(raw[start:end])
            logger.info(f"Product mila: {product.get('product_name')} ({product.get('category')})")
            return product
        except Exception as e:
            logger.error(f"Trend research fail hua: {e}")
            return self._fallback_product()

    def _fallback_product(self) -> dict:
        return {
            "product_name": "Whey Protein Isolate",
            "brand": "MuscleBlaze",
            "category": "supplements",
            "price_range": "INR 1999 - 3499",
            "why_trending": "India ka #1 selling protein, beginners aur athletes dono ke liye",
            "key_benefits": ["Fast muscle recovery", "25g protein per serving", "No added sugar"],
            "target_audience": "Gym goers, beginners, weight gainers",
            "affiliate_keyword": "MuscleBlaze whey protein isolate",
            "urgency_factor": "Amazon Great Indian Sale mein discount chal raha hai",
        }
