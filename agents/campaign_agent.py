import json
import re
import os
from datetime import datetime, timedelta
from typing import Optional
from prompts.marketing_prompts import CAMPAIGN_STRATEGIST_PROMPT
from utils.gemini_client import generate
from utils.logger import get_logger

logger = get_logger("CampaignAgent")


def _extract_json(raw: str) -> dict:
    """Extract JSON from Gemini output, handling truncation and markdown blocks."""
    # Strip markdown code fences
    raw = re.sub(r"```(?:json)?", "", raw).strip()
    start = raw.find("{")
    if start == -1:
        raise ValueError("No JSON object found in response")
    # Walk braces to find the longest valid JSON prefix
    depth = 0
    end = start
    for i, ch in enumerate(raw[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    json_str = raw[start:end]
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # Attempt to close any open arrays/objects from a truncated response
        open_brackets = json_str.count("[") - json_str.count("]")
        open_braces = json_str.count("{") - json_str.count("}")
        json_str = json_str.rstrip().rstrip(",")
        json_str += "]" * max(open_brackets, 0)
        json_str += "}" * max(open_braces, 0)
        return json.loads(json_str)

CAMPAIGNS_FILE = "campaigns.json"


class CampaignAgent:
    def __init__(self):
        self._campaigns = self._load_campaigns()

    def _load_campaigns(self) -> list:
        if os.path.exists(CAMPAIGNS_FILE):
            try:
                with open(CAMPAIGNS_FILE) as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save_campaigns(self):
        with open(CAMPAIGNS_FILE, "w") as f:
            json.dump(self._campaigns, f, indent=2, ensure_ascii=False)

    def create_campaign(self, product: dict, duration_days: int = 7) -> Optional[dict]:
        logger.info(f"Campaign bana raha hoon: {product.get('product_name')}")

        prompt = f"""
Product details:
- Naam: {product.get('product_name')} by {product.get('brand', 'Brand')}
- Category: {product.get('category', 'health')}
- Price: {product.get('price_range', 'Check link')}
- Benefits: {', '.join(product.get('key_benefits', []))}
- Target audience: {product.get('target_audience', 'Fitness lovers')}
- Trending reason: {product.get('why_trending', '')}
- Campaign duration: {duration_days} days

Iske liye ek complete {duration_days}-day marketing campaign strategy banao.
"""
        try:
            raw = generate(CAMPAIGN_STRATEGIST_PROMPT, prompt, max_tokens=2000)
            campaign = _extract_json(raw)

            campaign["id"] = f"campaign_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            campaign["product"] = product
            campaign["created_at"] = datetime.now().isoformat()
            campaign["start_date"] = datetime.now().strftime("%Y-%m-%d")
            campaign["end_date"] = (datetime.now() + timedelta(days=duration_days)).strftime("%Y-%m-%d")
            campaign["status"] = "active"
            campaign["completed_tasks"] = []

            self._campaigns.append(campaign)
            self._save_campaigns()

            logger.info(f"Campaign ready: {campaign.get('campaign_name')}")
            return campaign
        except Exception as e:
            logger.error(f"Campaign creation fail: {e}")
            return None

    def get_active_campaigns(self) -> list:
        return [c for c in self._campaigns if c.get("status") == "active"]

    def get_today_tasks(self) -> list:
        today = datetime.now().strftime("%Y-%m-%d")
        tasks = []
        for campaign in self.get_active_campaigns():
            start = campaign.get("start_date", today)
            try:
                start_dt = datetime.strptime(start, "%Y-%m-%d")
            except ValueError:
                continue
            day_num = (datetime.now() - start_dt).days + 1

            for task in campaign.get("daily_tasks", []):
                if task.get("day") == day_num:
                    enriched = dict(task)
                    enriched["campaign_id"] = campaign["id"]
                    enriched["campaign_name"] = campaign.get("campaign_name")
                    enriched["product"] = campaign.get("product")
                    tasks.append(enriched)
        return tasks

    def mark_task_done(self, campaign_id: str, day: int, platform: str):
        for campaign in self._campaigns:
            if campaign["id"] == campaign_id:
                campaign["completed_tasks"].append(f"day{day}_{platform}")
                self._save_campaigns()
                return

    def complete_campaign(self, campaign_id: str):
        for campaign in self._campaigns:
            if campaign["id"] == campaign_id:
                campaign["status"] = "completed"
                campaign["completed_at"] = datetime.now().isoformat()
                self._save_campaigns()
                logger.info(f"Campaign complete: {campaign_id}")
                return

    def list_campaigns(self) -> list:
        return self._campaigns
