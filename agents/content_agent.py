import json
import random
from typing import Optional
from config import GEMINI_API_KEY, GEMINI_MODEL, BASE_HASHTAGS, AMAZON_AFFILIATE_TAG
from prompts.system_prompts import CONTENT_CREATOR_PROMPT
from utils.ai_client import GeminiClient
from utils.logger import get_logger

logger = get_logger("ContentAgent")


class ContentAgent:
    def __init__(self):
        self.client = GeminiClient(api_key=GEMINI_API_KEY)

    def _build_affiliate_url(self, keyword: str) -> str:
        """Amazon affiliate search URL banao."""
        encoded = keyword.replace(" ", "+")
        base = f"https://www.amazon.in/s?k={encoded}"
        if AMAZON_AFFILIATE_TAG:
            base += f"&tag={AMAZON_AFFILIATE_TAG}"
        return base

    def generate_content(self, product: dict) -> Optional[dict]:
        """Claude se Hinglish caption, hashtags aur story text generate karo."""
        logger.info(f"Content generate kar raha hoon: {product.get('product_name')}")

        affiliate_url = self._build_affiliate_url(product.get("affiliate_keyword", product["product_name"]))

        prompt = f"""
Product details:
- Naam: {product['product_name']} by {product.get('brand', 'Brand')}
- Category: {product.get('category', 'health')}
- Price: {product.get('price_range', 'Check link')}
- Kyon trending: {product.get('why_trending', '')}
- Key benefits: {', '.join(product.get('key_benefits', []))}
- Target audience: {product.get('target_audience', 'Fitness lovers')}
- Urgency: {product.get('urgency_factor', '')}
- Affiliate link: {affiliate_url}

Inke basis pe Instagram post ke liye content create karo.
Caption mein end pe "👇 Link bio mein hai!" zaroor likhna.
"""
        try:
            response = self.client.messages_create(
                model=GEMINI_MODEL,
                max_tokens=1000,
                system=CONTENT_CREATOR_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.content[0].text.strip()
            start = raw.find("{")
            end = raw.rfind("}") + 1
            content = json.loads(raw[start:end])

            # Ensure we have exactly 30 hashtags, pad if needed
            existing_tags = content.get("hashtags", "").split()
            if len(existing_tags) < 30:
                extra = random.sample(BASE_HASHTAGS, 30 - len(existing_tags))
                existing_tags.extend(extra)
            content["hashtags"] = " ".join(existing_tags[:30])
            content["affiliate_url"] = affiliate_url

            logger.info("Content ready!")
            return content
        except Exception as e:
            logger.error(f"Content generation fail: {e}")
            return self._fallback_content(product, affiliate_url)

    def _fallback_content(self, product: dict, affiliate_url: str) -> dict:
        name = product.get("product_name", "Health Product")
        price = product.get("price_range", "Best price")
        return {
            "caption": (
                f"💪 Bhai, ye toh lena hi tha!\n\n"
                f"{name} — {price}\n\n"
                f"India ka best seller health product, results guaranteed! 🔥\n\n"
                f"👇 Link bio mein hai!"
            ),
            "hashtags": " ".join(BASE_HASHTAGS),
            "story_text": f"🔥 {name} — Ab discount mein!",
            "affiliate_url": affiliate_url,
        }
