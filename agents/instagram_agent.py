import time
import base64
import requests
from pathlib import Path
from typing import Optional
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, ChallengeRequired, TwoFactorRequired
from config import INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD, IMGBB_API_KEY
from utils.logger import get_logger

logger = get_logger("InstagramAgent")

SESSION_FILE = Path("ig_session.json")


class InstagramAgent:
    def __init__(self):
        self.cl = Client()
        self.cl.delay_range = [2, 5]  # Random delay between actions (anti-spam)
        self._logged_in = False

    def login(self) -> bool:
        """Login to Instagram — session reuse karo agar possible ho."""
        if SESSION_FILE.exists():
            try:
                self.cl.load_settings(SESSION_FILE)
                self.cl.set_settings(self.cl.get_settings())
                # login() mat call karo — GitHub Actions IP blacklisted hota hai Instagram pe
                # Sirf session cookie se timeline check karo
                self.cl.get_timeline_feed()
                logger.info("Session se login successful")
                self._logged_in = True
                return True
            except Exception:
                logger.warning("Saved session expire ho gayi, fresh login kar raha hoon...")

        try:
            self.cl.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
            self.cl.dump_settings(SESSION_FILE)
            logger.info("Fresh login successful, session save ho gayi")
            self._logged_in = True
            return True
        except TwoFactorRequired:
            logger.error("2FA enabled hai — Instagram mein 2FA band karo ya app password use karo")
            return False
        except ChallengeRequired:
            logger.error("Instagram ne challenge diya — kuch der baad try karo")
            return False
        except Exception as e:
            logger.error(f"Login fail: {e}")
            return False

    def _ensure_logged_in(self):
        if not self._logged_in:
            if not self.login():
                raise RuntimeError("Instagram login fail hua")

    def _upload_to_imgbb(self, image_path: str) -> Optional[str]:
        """ImgBB pe image upload karo (Instagram ko URL chahiye)."""
        if not IMGBB_API_KEY:
            return None
        with open(image_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode("utf-8")
        resp = requests.post(
            "https://api.imgbb.com/1/upload",
            data={"key": IMGBB_API_KEY, "image": img_b64},
            timeout=30,
        )
        if resp.status_code == 200:
            return resp.json()["data"]["url"]
        return None

    def post_image(self, image_path: str, caption: str, hashtags: str) -> Optional[str]:
        """Instagram pe photo post karo."""
        self._ensure_logged_in()
        full_caption = f"{caption}\n\n.\n.\n.\n{hashtags}"
        try:
            media = self.cl.photo_upload(image_path, caption=full_caption)
            post_id = str(media.id)
            logger.info(f"Post successful! Media ID: {post_id}")
            return post_id
        except LoginRequired:
            logger.warning("Session expire, re-login kar raha hoon...")
            self._logged_in = False
            self._ensure_logged_in()
            media = self.cl.photo_upload(image_path, caption=full_caption)
            return str(media.id)
        except Exception as e:
            logger.error(f"Post fail: {e}")
            return None

    def get_recent_messages(self) -> list:
        """Inbox se recent DMs fetch karo."""
        self._ensure_logged_in()
        messages = []
        try:
            threads = self.cl.direct_threads(amount=20)
            for thread in threads:
                for msg in thread.messages[:3]:  # Last 3 messages per thread
                    if msg.item_type == "text":
                        messages.append({
                            "id": str(msg.id),
                            "text": msg.text or "",
                            "from_id": str(msg.user_id),
                            "thread_id": str(thread.id),
                        })
        except Exception as e:
            logger.error(f"DM fetch fail: {e}")
        return messages

    def send_dm(self, recipient_id: str, message: str, thread_id: Optional[str] = None) -> bool:
        """Kisi ko DM bhejo."""
        self._ensure_logged_in()
        try:
            if thread_id:
                self.cl.direct_send(message, thread_ids=[thread_id])
            else:
                self.cl.direct_send(message, user_ids=[int(recipient_id)])
            logger.info(f"DM sent to {recipient_id}")
            time.sleep(2)
            return True
        except Exception as e:
            logger.error(f"DM fail to {recipient_id}: {e}")
            return False

    def search_hashtag_media(self, hashtag: str, limit: int = 20) -> list:
        """Hashtag se recent posts dhundho."""
        self._ensure_logged_in()
        try:
            medias = self.cl.hashtag_medias_recent(hashtag.lstrip("#"), amount=limit)
            return [
                {
                    "id": str(m.id),
                    "caption": m.caption_text or "",
                    "owner": {"id": str(m.user.pk), "username": m.user.username},
                }
                for m in medias
            ]
        except Exception as e:
            logger.error(f"Hashtag search fail: {e}")
            return []

    # user_id property for dm_handler compatibility
    @property
    def user_id(self) -> str:
        if self._logged_in:
            return str(self.cl.user_id)
        return ""
