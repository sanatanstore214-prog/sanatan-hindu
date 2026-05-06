import json
import random
from typing import Optional
from config import MAX_DMS_PER_DAY, MAX_CLIENTS_PER_SEARCH
from prompts.system_prompts import CLIENT_FINDER_PROMPT, DM_OPENER_TEMPLATE
from utils.gemini_client import generate
from utils.logger import get_logger

logger = get_logger("ClientFinder")

TARGET_HASHTAGS = [
    "weightloss", "weightlossjourney", "musclegain", "gymlife",
    "fitnessmotivationindia", "proteinshake", "homeworkout",
    "indianfitness", "fitnesstransformation", "healthylifestyleindia",
]


class ClientFinder:
    def __init__(self, instagram_agent):
        self.ig = instagram_agent
        self._dms_sent_today = 0

    def _can_send_more_dms(self) -> bool:
        return self._dms_sent_today < MAX_DMS_PER_DAY

    def _extract_profiles_from_media(self, media_list: list) -> list:
        seen = set()
        profiles = []
        for item in media_list:
            owner = item.get("owner", {})
            uid = owner.get("id")
            if uid and uid not in seen:
                seen.add(uid)
                profiles.append({"id": uid, "caption": item.get("caption", "")[:200]})
        return profiles

    def _ask_ai_to_filter(self, profiles: list) -> list:
        profiles_text = json.dumps(profiles, ensure_ascii=False, indent=2)
        prompt = f"""
Ye Instagram profiles hain jo health/fitness hashtags use karte hain.
Inke captions dekh ke decide karo kaun potential customers ho sakte hain:

{profiles_text}

Sirf unhe select karo jo genuinely help chahte hain ya products mein interested lag rahe hain.
Max {MAX_CLIENTS_PER_SEARCH} log select karo.
"""
        try:
            raw = generate(CLIENT_FINDER_PROMPT, prompt, max_tokens=800)
            start = raw.find("{")
            end = raw.rfind("}") + 1
            result = json.loads(raw[start:end])
            return result.get("selected_users", [])
        except Exception as e:
            logger.error(f"AI filter fail: {e}")
            return []

    def hunt_and_dm(self, batch_size: int = MAX_CLIENTS_PER_SEARCH) -> int:
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
        selected = self._ask_ai_to_filter(profiles)

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
                    logger.info(f"DM sent to {recipient_id} (reason: {user.get('reason', '')})")

        logger.info(f"Client hunting done — {sent} DMs bheji gayi")
        return sent

    def reset_daily_count(self):
        self._dms_sent_today = 0
