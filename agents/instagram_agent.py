import time
import base64
import requests
from typing import Optional
from config import INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID, IMGBB_API_KEY, IG_API_BASE
from utils.logger import get_logger

logger = get_logger("InstagramAgent")


class InstagramAgent:
    def __init__(self):
        self.token = INSTAGRAM_ACCESS_TOKEN
        self.user_id = INSTAGRAM_USER_ID
        self.base = IG_API_BASE

    def _upload_image_to_imgbb(self, image_path: str) -> Optional[str]:
        """ImgBB pe image upload karo aur public URL lo."""
        if not IMGBB_API_KEY:
            raise ValueError("IMGBB_API_KEY .env mein set nahi hai!")
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")
        resp = requests.post(
            "https://api.imgbb.com/1/upload",
            data={"key": IMGBB_API_KEY, "image": image_data},
            timeout=30,
        )
        resp.raise_for_status()
        url = resp.json()["data"]["url"]
        logger.info(f"Image hosted at: {url}")
        return url

    def _create_media_container(self, image_url: str, caption: str) -> Optional[str]:
        """Instagram Graph API se media container banao."""
        url = f"{self.base}/{self.user_id}/media"
        payload = {
            "image_url": image_url,
            "caption": caption,
            "access_token": self.token,
        }
        resp = requests.post(url, data=payload, timeout=30)
        data = resp.json()
        if "id" not in data:
            logger.error(f"Media container error: {data}")
            return None
        container_id = data["id"]
        logger.info(f"Media container created: {container_id}")
        return container_id

    def _wait_for_container_ready(self, container_id: str, max_wait: int = 60):
        """Container ke ready hone ka wait karo."""
        url = f"{self.base}/{container_id}"
        params = {"fields": "status_code", "access_token": self.token}
        for _ in range(max_wait // 5):
            resp = requests.get(url, params=params, timeout=15)
            status = resp.json().get("status_code", "")
            if status == "FINISHED":
                return True
            if status == "ERROR":
                logger.error(f"Container failed: {resp.json()}")
                return False
            time.sleep(5)
        return False

    def _publish_container(self, container_id: str) -> Optional[str]:
        """Container ko publish karo Instagram pe."""
        url = f"{self.base}/{self.user_id}/media_publish"
        payload = {"creation_id": container_id, "access_token": self.token}
        resp = requests.post(url, data=payload, timeout=30)
        data = resp.json()
        if "id" not in data:
            logger.error(f"Publish error: {data}")
            return None
        post_id = data["id"]
        logger.info(f"Post published! ID: {post_id}")
        return post_id

    def post_image(self, image_path: str, caption: str, hashtags: str) -> Optional[str]:
        """Full workflow: image upload → container → publish."""
        full_caption = f"{caption}\n\n{hashtags}"
        logger.info("Instagram post shuru kar raha hoon...")
        try:
            image_url = self._upload_image_to_imgbb(image_path)
            container_id = self._create_media_container(image_url, full_caption)
            if not container_id:
                return None
            ready = self._wait_for_container_ready(container_id)
            if not ready:
                logger.error("Container ready nahi hua")
                return None
            post_id = self._publish_container(container_id)
            return post_id
        except Exception as e:
            logger.error(f"Post fail hua: {e}")
            return None

    def get_recent_messages(self) -> list:
        """Recent DMs fetch karo (Instagram Messaging API)."""
        url = f"{self.base}/{self.user_id}/conversations"
        params = {
            "fields": "messages{message,from,created_time,id}",
            "access_token": self.token,
            "platform": "instagram",
        }
        try:
            resp = requests.get(url, params=params, timeout=15)
            data = resp.json()
            conversations = data.get("data", [])
            messages = []
            for conv in conversations:
                for msg in conv.get("messages", {}).get("data", []):
                    messages.append({
                        "id": msg.get("id"),
                        "text": msg.get("message", ""),
                        "from_id": msg.get("from", {}).get("id"),
                        "from_name": msg.get("from", {}).get("name", ""),
                        "time": msg.get("created_time"),
                    })
            return messages
        except Exception as e:
            logger.error(f"Messages fetch fail: {e}")
            return []

    def send_dm(self, recipient_id: str, message: str) -> bool:
        """Kisi ko DM bhejo."""
        url = f"{self.base}/{self.user_id}/messages"
        payload = {
            "recipient": {"id": recipient_id},
            "message": {"text": message},
            "access_token": self.token,
        }
        try:
            resp = requests.post(url, json=payload, timeout=15)
            if resp.status_code == 200:
                logger.info(f"DM sent to {recipient_id}")
                return True
            logger.error(f"DM fail: {resp.json()}")
            return False
        except Exception as e:
            logger.error(f"DM exception: {e}")
            return False

    def search_hashtag_media(self, hashtag: str, limit: int = 20) -> list:
        """Hashtag se recent posts dhundho (client finding ke liye)."""
        try:
            # Step 1: hashtag ID lo
            search_url = f"{self.base}/ig_hashtag_search"
            params = {"user_id": self.user_id, "q": hashtag.lstrip("#"), "access_token": self.token}
            resp = requests.get(search_url, params=params, timeout=15)
            hashtag_id = resp.json().get("data", [{}])[0].get("id")
            if not hashtag_id:
                return []

            # Step 2: Recent media lo
            media_url = f"{self.base}/{hashtag_id}/recent_media"
            params = {
                "user_id": self.user_id,
                "fields": "id,caption,media_type,owner",
                "access_token": self.token,
                "limit": limit,
            }
            resp = requests.get(media_url, params=params, timeout=15)
            return resp.json().get("data", [])
        except Exception as e:
            logger.error(f"Hashtag search fail: {e}")
            return []
