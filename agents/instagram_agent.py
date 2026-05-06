import time
import random
from pathlib import Path
from typing import Optional
from config import INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD, AMAZON_AFFILIATE_TAG
from utils.logger import get_logger

logger = get_logger("InstagramAgent")


class InstagramAgent:
    def __init__(self):
        self.username = INSTAGRAM_USERNAME
        self.password = INSTAGRAM_PASSWORD
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client
        try:
            from instagrapi import Client
            cl = Client()
            # Human-like delays to avoid detection
            cl.delay_range = [2, 5]
            cl.login(self.username, self.password)
            self._client = cl
            logger.info(f"Instagram login successful: @{self.username}")
        except Exception as e:
            logger.error(f"Instagram login fail: {e}")
            raise
        return self._client

    def post_image(self, image_path: str, caption: str, hashtags: str) -> Optional[str]:
        """Photo + caption Instagram pe post karo."""
        full_caption = f"{caption}\n\n{hashtags}"
        logger.info("Instagram pe post kar raha hoon...")
        try:
            cl = self._get_client()
            media = cl.photo_upload(
                path=Path(image_path),
                caption=full_caption,
            )
            post_id = str(media.pk)
            logger.info(f"Post successful! ID: {post_id}")
            return post_id
        except Exception as e:
            logger.error(f"Post fail: {e}")
            return None

    def get_recent_messages(self) -> list:
        """Recent DMs fetch karo."""
        try:
            cl = self._get_client()
            threads = cl.direct_threads(amount=20)
            messages = []
            for thread in threads:
                for msg in thread.messages[:3]:
                    if msg.item_type == "text":
                        messages.append({
                            "id": str(msg.id),
                            "text": msg.text or "",
                            "from_id": str(msg.user_id),
                            "from_name": "",
                            "time": str(msg.timestamp),
                        })
            return messages
        except Exception as e:
            logger.error(f"Messages fetch fail: {e}")
            return []

    def send_dm(self, recipient_id: str, message: str) -> bool:
        """Kisi user ko DM bhejo."""
        try:
            cl = self._get_client()
            # Random delay — human jaise lagega
            time.sleep(random.uniform(3, 8))
            cl.direct_send(message, user_ids=[int(recipient_id)])
            logger.info(f"DM sent to {recipient_id}")
            return True
        except Exception as e:
            logger.error(f"DM fail to {recipient_id}: {e}")
            return False

    def search_hashtag_media(self, hashtag: str, limit: int = 20) -> list:
        """Hashtag se recent posts dhundho (client finding ke liye)."""
        try:
            cl = self._get_client()
            medias = cl.hashtag_medias_recent(hashtag.lstrip("#"), amount=limit)
            result = []
            for m in medias:
                result.append({
                    "id": str(m.pk),
                    "caption": m.caption_text[:200] if m.caption_text else "",
                    "owner": {"id": str(m.user.pk)},
                })
            return result
        except Exception as e:
            logger.error(f"Hashtag search fail ({hashtag}): {e}")
            return []
