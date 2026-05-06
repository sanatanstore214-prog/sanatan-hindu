import json
import random
from typing import Optional
from config import GEMINI_API_KEY, GEMINI_MODEL, MAX_DMS_PER_DAY, MAX_CLIENTS_PER_SEARCH
from prompts.system_prompts import CLIENT_FINDER_PROMPT, DM_OPENER_TEMPLATE
from utils.ai_client import GeminiClient
from utils.logger import get_logger

logger = get_logger("ClientFinder")

# Hashtags to search for potential clients
TARGET_HASHTAGS = [
    "weightloss", "weightlossjourney", "musclegain", "gymlife",
    "fitnessmotivationindia", "proteinshake", "homeworkout",
    "indianfitness", "fitnesstransformation", "healthylifestyleindia",
]


class ClientFinder:
    def __init__(self, instagram_agent):
        self.ig = instagram_agent
        self.client = GeminiClient(api_key=GEMINI_API_KEY)
        self._dms_sent_today = 0

    def _can_send_more_dms(self) -> bool:
        return self._dms_sent_today < MAX_DMS_PER_DAY

    def _extract_profiles_from_media(self, media_list: list) -> list:
        """Media list se unique profile IDs nikalo."""
        seen = set()
        profiles = []
        for item in media_list:
            owner = item.get("owner", {})
            uid = owner.get("id")
            if uid and uid not in seen:
                seen.add(uid)
                profiles.append({
                    "id": uid,
                    "caption": item.get("caption", "")[:200],
                })
        return profiles

    def _ask_claude_to_filter(self, profiles: list) -> list:
        """Claude se decide karao kaun worthy clients hain."""
        profiles_text = json.dumps(profiles, ensure_ascii=False, indent=2)
        prompt = f"""
Ye Instagram profiles hain jo health/fitness hashtags use karte hain.
Inke captions dekh ke decide karo kaun potential customers ho sakte hain:

{profiles_text}

Sirf unhe select karo jo genuinely help chahte hain ya products mein interested lag rahe hain.
Max {MAX_CLIENTS_PER_SEARCH} log select karo.
"""
        try:
            response = self.client.messages_create(
                model=GEMINI_MODEL,
                max_tokens=800,
                system=CLIENT_FINDER_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.content[0].text.strip()
            start = raw.find("{")
            end = raw.rfind("}") + 1
            result = json.loads(raw[start:end])
            return result.get("selected_users", [])
        except Exception as e:
            logger.error(f"Claude filter fail: {e}")
            return []

    def hunt_and_dm(self, batch_size: int = MAX_CLIENTS_PER_SEARCH) -> int:
        """Potential clients dhundho aur unhe DM bhejo. Returns DMs sent count."""
        if not self._can_send_more_dms():
            logger.info(f"Aaj ka DM limit ({MAX_DMS_PER_DAY}) reach ho gaya")
            return 0

        hashtag = random.choice(TARGET_HASHTAGS)
        logger.info(f"#{hashtag} pe clients dhundh raha hoon...")

        media_list = self.ig.search_hashtag_media(hashtag, limit=50)
        if not media_list:
            logger.warning(f"#{hashtag} pe koi media nahi mila")
            return 0

        profiles = self._extract_profiles_from_media(media_list)
        selected = self._ask_claude_to_filter(profiles)

        sent = 0
        for user in selected:
            if not self._can_send_more_dms():
                break
            opener = user.get("personalized_opener", "Teri fitness journey dekhi, kafi inspiring hai!")
            message = DM_OPENER_TEMPLATE.format(personalized_opener=opener)
            recipient_id = next(
                (p["id"] for p in profiles if p["id"] == user.get("id")), None
            ) or user.get("id", "")

            if recipient_id:
                success = self.ig.send_dm(recipient_id, message)
                if success:
                    self._dms_sent_today += 1
                    sent += 1
                    logger.info(f"DM sent to user {recipient_id} (reason: {user.get('reason', '')})")

        logger.info(f"Client hunting done — {sent} DMs bheji gayi")
        return sent

    def reset_daily_count(self):
        """Daily DM count reset karo (midnight pe call karo)."""
        self._dms_sent_today = 0
