import json
import time
import anthropic
from typing import Optional
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL, DM_CHECK_INTERVAL_MINUTES
from prompts.system_prompts import DM_HANDLER_PROMPT
from utils.logger import get_logger

logger = get_logger("DMHandler")


class DMHandler:
    def __init__(self, instagram_agent, product_context: Optional[dict] = None):
        self.ig = instagram_agent
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.conversation_history: dict[str, list] = {}
        self.processed_message_ids: set = set()
        self.product_context = product_context or {}

    def update_product_context(self, product: dict, content: dict):
        """Aaj ka product update karo (DM replies mein use hoga)."""
        self.product_context = {
            "product": product,
            "affiliate_url": content.get("affiliate_url", ""),
        }

    def _get_ai_reply(self, user_id: str, incoming_message: str) -> dict:
        """Claude se DM reply generate karo."""
        history = self.conversation_history.get(user_id, [])

        product_info = ""
        if self.product_context.get("product"):
            p = self.product_context["product"]
            product_info = (
                f"\nAaj ka featured product: {p.get('product_name')} by {p.get('brand')}\n"
                f"Price: {p.get('price_range')}\n"
                f"Affiliate link: {self.product_context.get('affiliate_url', 'N/A')}\n"
                f"Benefits: {', '.join(p.get('key_benefits', []))}"
            )

        messages = history.copy()
        messages.append({
            "role": "user",
            "content": f"User message: {incoming_message}\n{product_info}",
        })

        try:
            response = self.client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=400,
                system=DM_HANDLER_PROMPT,
                messages=messages,
            )
            raw = response.content[0].text.strip()
            start = raw.find("{")
            end = raw.rfind("}") + 1
            result = json.loads(raw[start:end])

            # Update conversation history
            history.append({"role": "user", "content": incoming_message})
            history.append({"role": "assistant", "content": result.get("reply", "")})
            # Keep last 10 messages only
            self.conversation_history[user_id] = history[-10:]

            return result
        except Exception as e:
            logger.error(f"AI reply fail for {user_id}: {e}")
            return {
                "reply": "Haan bhai! Batao kya help chahiye? 💪",
                "action": "continue",
                "sentiment": "neutral",
            }

    def process_new_messages(self) -> int:
        """Nayi DMs check karo aur reply karo. Returns count of replies sent."""
        logger.info("DMs check kar raha hoon...")
        messages = self.ig.get_recent_messages()

        # Filter bot's own messages and already processed
        own_id = self.ig.user_id
        new_messages = [
            m for m in messages
            if m.get("id") not in self.processed_message_ids
            and m.get("from_id") != own_id
            and m.get("text", "").strip()
        ]

        if not new_messages:
            logger.info("Koi nayi DM nahi")
            return 0

        replied = 0
        for msg in new_messages:
            msg_id = msg.get("id")
            from_id = msg.get("from_id")
            text = msg.get("text", "")

            logger.info(f"New DM from {from_id}: '{text[:50]}...'")
            ai_response = self._get_ai_reply(from_id, text)
            reply_text = ai_response.get("reply", "")
            action = ai_response.get("action", "continue")
            sentiment = ai_response.get("sentiment", "neutral")

            # Agar negative hai toh end karo
            if sentiment == "negative" or action == "end_conversation":
                logger.info(f"Conversation ended with {from_id}")
                self.processed_message_ids.add(msg_id)
                continue

            # Agar affiliate link share karna hai
            if action == "share_link" and self.product_context.get("affiliate_url"):
                reply_text += f"\n\n🛒 Yahan se le lo: {self.product_context['affiliate_url']}"

            success = self.ig.send_dm(from_id, reply_text)
            if success:
                replied += 1
                logger.info(f"Replied to {from_id}: '{reply_text[:60]}...'")

            self.processed_message_ids.add(msg_id)

            # Small delay between replies
            time.sleep(2)

        logger.info(f"DM check done — {replied} replies bheje")
        return replied
