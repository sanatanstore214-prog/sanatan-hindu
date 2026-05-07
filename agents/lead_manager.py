import json
import os
from datetime import datetime, timedelta
from typing import Optional
from prompts.marketing_prompts import LEAD_SCORER_PROMPT
from utils.gemini_client import generate
from utils.logger import get_logger

logger = get_logger("LeadManager")

LEADS_FILE = "leads.json"
STAGES = ["discovered", "contacted", "interested", "warm", "converted", "lost"]


class LeadManager:
    def __init__(self):
        self._leads = self._load_leads()

    def _load_leads(self) -> dict:
        if os.path.exists(LEADS_FILE):
            try:
                with open(LEADS_FILE) as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_leads(self):
        with open(LEADS_FILE, "w") as f:
            json.dump(self._leads, f, indent=2, ensure_ascii=False)

    def add_lead(self, username: str, platform: str = "instagram", source: str = "hashtag_hunt") -> dict:
        if username in self._leads:
            return self._leads[username]

        lead = {
            "username": username,
            "platform": platform,
            "source": source,
            "stage": "discovered",
            "score": 0,
            "tier": "cold",
            "discovered_at": datetime.now().isoformat(),
            "last_contact": None,
            "contact_count": 0,
            "dm_history": [],
            "notes": [],
            "tags": [],
            "converted": False,
        }
        self._leads[username] = lead
        self._save_leads()
        logger.info(f"New lead added: @{username} ({platform})")
        return lead

    def update_stage(self, username: str, stage: str, note: str = ""):
        if username not in self._leads:
            logger.warning(f"Lead not found: @{username}")
            return
        if stage not in STAGES:
            logger.warning(f"Invalid stage: {stage}")
            return
        self._leads[username]["stage"] = stage
        self._leads[username]["updated_at"] = datetime.now().isoformat()
        if note:
            self._leads[username]["notes"].append({
                "text": note,
                "at": datetime.now().isoformat(),
            })
        if stage == "converted":
            self._leads[username]["converted"] = True
            self._leads[username]["converted_at"] = datetime.now().isoformat()
        self._save_leads()
        logger.info(f"@{username} stage → {stage}")

    def score_lead(self, username: str, dm_context: str = "", profile_info: str = "") -> Optional[dict]:
        if username not in self._leads:
            return None

        lead = self._leads[username]
        prompt = f"""
Lead info:
- Username: @{username}
- Platform: {lead.get('platform')}
- Stage: {lead.get('stage')}
- Contact count: {lead.get('contact_count', 0)}
- DM history (last 3): {json.dumps(lead.get('dm_history', [])[-3:])}
- Profile info: {profile_info or 'N/A'}
- Recent DM context: {dm_context or 'N/A'}
- Tags: {lead.get('tags', [])}

Is lead ko score karo aur next action batao.
"""
        try:
            raw = generate(LEAD_SCORER_PROMPT, prompt, max_tokens=500)
            start = raw.find("{")
            end = raw.rfind("}") + 1
            result = json.loads(raw[start:end])

            self._leads[username]["score"] = result.get("score", 0)
            self._leads[username]["tier"] = result.get("tier", "cold")
            self._leads[username]["next_action"] = result.get("next_action")
            self._leads[username]["scored_at"] = datetime.now().isoformat()
            self._save_leads()

            return result
        except Exception as e:
            logger.error(f"Lead scoring fail for @{username}: {e}")
            return None

    def record_interaction(self, username: str, message: str, direction: str = "outbound"):
        if username not in self._leads:
            self.add_lead(username)

        self._leads[username]["dm_history"].append({
            "message": message[:200],
            "direction": direction,
            "at": datetime.now().isoformat(),
        })
        # Keep last 20 messages only
        self._leads[username]["dm_history"] = self._leads[username]["dm_history"][-20:]

        if direction == "outbound":
            self._leads[username]["contact_count"] = (
                self._leads[username].get("contact_count", 0) + 1
            )
            self._leads[username]["last_contact"] = datetime.now().isoformat()

        self._save_leads()

    def get_leads_by_stage(self, stage: str) -> list:
        return [l for l in self._leads.values() if l.get("stage") == stage]

    def get_hot_leads(self) -> list:
        return [
            l for l in self._leads.values()
            if l.get("tier") == "hot" and not l.get("converted")
        ]

    def get_followup_due(self) -> list:
        cutoff = datetime.now() - timedelta(hours=48)
        due = []
        for lead in self._leads.values():
            if lead.get("stage") in ("contacted", "interested") and not lead.get("converted"):
                last = lead.get("last_contact")
                if not last or datetime.fromisoformat(last) < cutoff:
                    due.append(lead)
        return due

    def get_funnel_stats(self) -> dict:
        stats = {s: 0 for s in STAGES}
        for lead in self._leads.values():
            stage = lead.get("stage", "discovered")
            if stage in stats:
                stats[stage] += 1
        total = len(self._leads)
        stats["total"] = total
        conversion_rate = round(stats["converted"] / max(total, 1) * 100, 1)
        stats["conversion_rate"] = f"{conversion_rate}%"
        return stats

    def add_tag(self, username: str, tag: str):
        if username in self._leads:
            tags = self._leads[username].setdefault("tags", [])
            if tag not in tags:
                tags.append(tag)
                self._save_leads()

    def get_all_leads(self) -> list:
        return list(self._leads.values())

    def remove_lead(self, username: str):
        if username in self._leads:
            del self._leads[username]
            self._save_leads()
            logger.info(f"Lead removed: @{username}")
