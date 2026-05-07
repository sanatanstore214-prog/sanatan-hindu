import json
import os
from datetime import datetime, timedelta
from typing import Optional
from prompts.marketing_prompts import ANALYTICS_INTERPRETER_PROMPT
from utils.gemini_client import generate
from utils.logger import get_logger

logger = get_logger("AnalyticsAgent")

ANALYTICS_FILE = "analytics.json"


class AnalyticsAgent:
    def __init__(self):
        self._data = self._load_data()

    def _load_data(self) -> dict:
        if os.path.exists(ANALYTICS_FILE):
            try:
                with open(ANALYTICS_FILE) as f:
                    return json.load(f)
            except Exception:
                pass
        return {"posts": [], "campaigns": {}}

    def _save_data(self):
        with open(ANALYTICS_FILE, "w") as f:
            json.dump(self._data, f, indent=2, ensure_ascii=False)

    def record_post(self, platform: str, post_id: str, content_type: str = "product_post", metadata: dict = None):
        entry = {
            "id": post_id,
            "platform": platform,
            "content_type": content_type,
            "posted_at": datetime.now().isoformat(),
            "likes": 0,
            "comments": 0,
            "shares": 0,
            "reach": 0,
            "link_clicks": 0,
            "dm_queries": 0,
        }
        if metadata:
            entry.update(metadata)
        self._data["posts"].append(entry)
        self._save_data()
        logger.info(f"Post recorded: {platform}/{post_id}")

    def update_post_metrics(self, post_id: str, metrics: dict):
        for post in self._data["posts"]:
            if post["id"] == post_id:
                post.update(metrics)
                post["updated_at"] = datetime.now().isoformat()
                self._save_data()
                return
        logger.warning(f"Post not found for update: {post_id}")

    def record_campaign_metric(self, campaign_id: str, metric: str, value):
        if campaign_id not in self._data["campaigns"]:
            self._data["campaigns"][campaign_id] = {}
        self._data["campaigns"][campaign_id][metric] = value
        self._save_data()

    def get_weekly_summary(self) -> dict:
        week_ago = datetime.now() - timedelta(days=7)
        recent = [
            p for p in self._data["posts"]
            if datetime.fromisoformat(p["posted_at"]) > week_ago
        ]

        if not recent:
            return {
                "total_posts": 0,
                "period": f"{week_ago.strftime('%d %b')} - {datetime.now().strftime('%d %b %Y')}",
                "message": "Is hafte koi post nahi tha",
            }

        total_likes = sum(p.get("likes", 0) for p in recent)
        total_comments = sum(p.get("comments", 0) for p in recent)
        total_reach = sum(p.get("reach", 0) for p in recent)
        total_clicks = sum(p.get("link_clicks", 0) for p in recent)
        total_dms = sum(p.get("dm_queries", 0) for p in recent)

        by_platform: dict = {}
        for p in recent:
            plat = p.get("platform", "unknown")
            if plat not in by_platform:
                by_platform[plat] = {"posts": 0, "likes": 0, "reach": 0}
            by_platform[plat]["posts"] += 1
            by_platform[plat]["likes"] += p.get("likes", 0)
            by_platform[plat]["reach"] += p.get("reach", 0)

        engagement_rate = round(
            (total_likes + total_comments) / max(total_reach, 1) * 100, 2
        )

        return {
            "total_posts": len(recent),
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_reach": total_reach,
            "total_link_clicks": total_clicks,
            "dm_queries": total_dms,
            "avg_engagement_rate": engagement_rate,
            "by_platform": by_platform,
            "period": f"{week_ago.strftime('%d %b')} - {datetime.now().strftime('%d %b %Y')}",
        }

    def generate_report(self) -> Optional[dict]:
        summary = self.get_weekly_summary()
        if not summary.get("total_posts"):
            return summary

        from agents.lead_manager import LeadManager
        funnel = LeadManager().get_funnel_stats()

        prompt = f"""
Weekly Performance Data:
{json.dumps(summary, indent=2, ensure_ascii=False)}

Lead Funnel:
{json.dumps(funnel, indent=2, ensure_ascii=False)}

Is data ka analysis karo aur actionable recommendations do.
"""
        try:
            raw = generate(ANALYTICS_INTERPRETER_PROMPT, prompt, max_tokens=1200)
            start = raw.find("{")
            end = raw.rfind("}") + 1
            report = json.loads(raw[start:end])
            report["raw_data"] = summary
            report["generated_at"] = datetime.now().isoformat()
            logger.info("Weekly report ready!")
            return report
        except Exception as e:
            logger.error(f"Report generation fail: {e}")
            summary["error"] = str(e)
            return summary
