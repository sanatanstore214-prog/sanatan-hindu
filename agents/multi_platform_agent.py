import json
import random
from typing import Optional
from config import AMAZON_AFFILIATE_TAG, BASE_HASHTAGS
from prompts.marketing_prompts import MULTI_PLATFORM_PROMPT, WHATSAPP_BROADCAST_PROMPT
from utils.gemini_client import generate
from utils.logger import get_logger

logger = get_logger("MultiPlatformAgent")


class MultiPlatformAgent:
    def _build_affiliate_url(self, keyword: str) -> str:
        encoded = keyword.replace(" ", "+")
        base = f"https://www.amazon.in/s?k={encoded}"
        if AMAZON_AFFILIATE_TAG:
            base += f"&tag={AMAZON_AFFILIATE_TAG}"
        return base

    def generate_all_platforms(self, product: dict) -> Optional[dict]:
        logger.info(f"Multi-platform content bana raha hoon: {product.get('product_name')}")
        affiliate_url = self._build_affiliate_url(
            product.get("affiliate_keyword", product.get("product_name", "health product"))
        )

        prompt = f"""
Product details:
- Naam: {product['product_name']} by {product.get('brand', 'Brand')}
- Category: {product.get('category', 'health')}
- Price: {product.get('price_range', 'Best price')}
- Key benefits: {', '.join(product.get('key_benefits', []))}
- Target audience: {product.get('target_audience', 'Fitness lovers')}
- Why trending: {product.get('why_trending', '')}
- Affiliate link: {affiliate_url}

Har platform ke liye optimized content banao.
"""
        try:
            raw = generate(MULTI_PLATFORM_PROMPT, prompt, max_tokens=2000)
            start = raw.find("{")
            end = raw.rfind("}") + 1
            content = json.loads(raw[start:end])
            content["affiliate_url"] = affiliate_url
            content["product"] = product
            logger.info("Multi-platform content ready!")
            return content
        except Exception as e:
            logger.error(f"Multi-platform content fail: {e}")
            return self._fallback_content(product, affiliate_url)

    def generate_whatsapp_sequence(self, product: dict) -> Optional[dict]:
        logger.info(f"WhatsApp sequence bana raha hoon: {product.get('product_name')}")
        affiliate_url = self._build_affiliate_url(
            product.get("affiliate_keyword", product.get("product_name", "health product"))
        )

        prompt = f"""
Product:
- Naam: {product['product_name']} by {product.get('brand', 'Brand')}
- Benefits: {', '.join(product.get('key_benefits', []))}
- Price: {product.get('price_range', '')}
- Affiliate link: {affiliate_url}

WhatsApp broadcast sequence ke 4 messages banao.
"""
        try:
            raw = generate(WHATSAPP_BROADCAST_PROMPT, prompt, max_tokens=1000)
            start = raw.find("{")
            end = raw.rfind("}") + 1
            messages = json.loads(raw[start:end])
            messages["affiliate_url"] = affiliate_url
            return messages
        except Exception as e:
            logger.error(f"WhatsApp sequence fail: {e}")
            return self._fallback_whatsapp(product, affiliate_url)

    def _fallback_content(self, product: dict, affiliate_url: str) -> dict:
        name = product.get("product_name", "Health Product")
        price = product.get("price_range", "Best price")
        tags_sample = " ".join(random.sample(BASE_HASHTAGS, 10))
        return {
            "instagram": {
                "caption": f"💪 {name} — India ka No.1 choice!\n{price}\n👇 Link bio mein hai!",
                "hashtags": " ".join(BASE_HASHTAGS),
                "story_text": f"🔥 {name} — Ab order karo!",
            },
            "facebook": {
                "post_text": (
                    f"Friends, agar aap health goals achieve karna chahte ho toh {name} zaroor try karo!\n\n"
                    f"Price: {price}\nBuy now: {affiliate_url}"
                ),
                "hashtags": tags_sample,
                "engagement_question": "Kya tumne isko try kiya hai? Comment mein batao!",
            },
            "whatsapp": {
                "message": (
                    f"Bhai/Didi, {name} try kiya kya? 💪\n"
                    f"Bahut acha results de raha hai — {price}.\n"
                    f"Check karo: {affiliate_url}"
                ),
                "cta": "Order karne ke liye link check karo!",
            },
            "twitter_x": {
                "tweet": f"💪 {name} — India ka best health product!\n{price}\n{affiliate_url}",
                "hashtags": "#fitness #health #india #wellness #gym",
            },
            "email": {
                "subject": f"🔥 {name} — Special offer!",
                "body": (
                    f"Namaste!\n\nAaj hum share kar rahe hain {name} ke baare mein.\n\n"
                    f"Price: {price}\n\nKhareedne ke liye: {affiliate_url}\n\nDhanyawad!"
                ),
            },
            "blog": {
                "title": f"{name} Review: Kya Ye Sach Mein Kaam Karta Hai?",
                "intro": (
                    f"Aaj hum baat karte hain {name} ke baare mein jo India mein bahut popular ho raha hai. "
                    f"Health aur fitness enthusiasts ke beech yeh product kaafi demand mein hai."
                ),
                "seo_keywords": ["health product india", "fitness supplement", name.lower()],
            },
            "affiliate_url": affiliate_url,
            "product": product,
        }

    def _fallback_whatsapp(self, product: dict, affiliate_url: str) -> dict:
        name = product.get("product_name", "Health Product")
        price = product.get("price_range", "")
        return {
            "awareness": f"Bhai! {name} ke baare mein suna? 💪 India mein bahut log results le rahe hain!",
            "social_proof": f"⭐ Ek dost ne {name} use kiya aur 30 din mein amazing results mile! {price}",
            "offer": f"🛒 Abhi {name} order karo! {price}\nLink: {affiliate_url}",
            "follow_up": f"Bhai, koi sawaal ho {name} ke baare mein? Batao, help karunga! 😊",
            "affiliate_url": affiliate_url,
        }
