"""
Digital Marketing Bot — Sanatan Hindu Store
=============================================
Multi-platform automated marketing system for health & fitness products.

Features:
  - Multi-platform content (Instagram, Facebook, WhatsApp, Twitter/X, Email, Blog)
  - 7-day automated campaign management
  - Lead CRM (discovery → conversion funnel)
  - AI-powered lead scoring
  - Weekly analytics reports

Usage:
  python marketing_bot.py                  # Start full daily scheduler
  python marketing_bot.py --campaign       # Create new 7-day campaign now
  python marketing_bot.py --multi-content  # Generate content for all platforms
  python marketing_bot.py --analytics      # Generate weekly analytics report
  python marketing_bot.py --leads          # Show lead funnel stats
  python marketing_bot.py --hot-leads      # Show hot leads + follow-ups due
  python marketing_bot.py --today-tasks    # Show today's campaign tasks
  python marketing_bot.py --whatsapp-seq   # Generate WhatsApp broadcast sequence
  python marketing_bot.py --run-now        # Run full marketing cycle immediately
"""

import sys
import json
import time
import schedule
from datetime import datetime
from config import GEMINI_API_KEY, POST_TIME
from agents.trend_agent import TrendAgent
from agents.campaign_agent import CampaignAgent
from agents.multi_platform_agent import MultiPlatformAgent
from agents.analytics_agent import AnalyticsAgent
from agents.lead_manager import LeadManager
from utils.logger import get_logger

logger = get_logger("MarketingBot")

SEP = "=" * 55


def validate_config():
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY missing! .env file mein GEMINI_API_KEY daalo.")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Campaign
# ---------------------------------------------------------------------------

def run_campaign_creation():
    logger.info("Campaign Creation shuru...")

    product = TrendAgent().find_trending_product()
    if not product:
        logger.error("Product nahi mila, campaign skip")
        return None

    campaign = CampaignAgent().create_campaign(product, duration_days=7)
    if campaign:
        print(f"\n{SEP}")
        print(f"✅ CAMPAIGN READY: {campaign.get('campaign_name')}")
        print(f"   Product  : {product['product_name']}")
        print(f"   Duration : {campaign.get('start_date')} → {campaign.get('end_date')}")
        print(f"   Goal     : {campaign.get('campaign_goal')}")
        print(f"\n   Key Messages:")
        for msg in campaign.get("key_messages", [])[:3]:
            print(f"   • {msg}")
        print(SEP)
    return campaign


# ---------------------------------------------------------------------------
# Multi-platform content
# ---------------------------------------------------------------------------

def run_multi_content():
    logger.info("Multi-platform content generation shuru...")

    product = TrendAgent().find_trending_product()
    if not product:
        logger.error("Product nahi mila")
        return None

    content = MultiPlatformAgent().generate_all_platforms(product)
    if content:
        print(f"\n{SEP}")
        print(f"✅ MULTI-PLATFORM CONTENT: {product['product_name']}")
        print(SEP)

        print("\n📸 INSTAGRAM:")
        ig = content.get("instagram", {})
        print(ig.get("caption", ""))
        print("Tags:", ig.get("hashtags", "")[:80] + "...")

        print("\n📘 FACEBOOK:")
        fb = content.get("facebook", {})
        print(fb.get("post_text", ""))
        print("❓", fb.get("engagement_question", ""))

        print("\n📱 WHATSAPP:")
        print(content.get("whatsapp", {}).get("message", ""))

        print("\n🐦 TWITTER/X:")
        print(content.get("twitter_x", {}).get("tweet", ""))

        print("\n📧 EMAIL:")
        em = content.get("email", {})
        print(f"Subject: {em.get('subject', '')}")

        print("\n📝 BLOG:")
        print(content.get("blog", {}).get("title", ""))

        print(f"\n🔗 Affiliate URL: {content.get('affiliate_url')}")
        print(SEP)

        filename = f"content_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
        with open(filename, "w") as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
        print(f"💾 Content saved: {filename}")
    return content


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

def run_analytics():
    logger.info("Weekly analytics report generate kar raha hoon...")

    report = AnalyticsAgent().generate_report()
    if report:
        print(f"\n{SEP}")
        print("📊 WEEKLY MARKETING REPORT")
        print(SEP)

        raw = report.get("raw_data", {})
        print(f"Period        : {raw.get('period', 'Last 7 days')}")
        print(f"Total Posts   : {raw.get('total_posts', 0)}")
        print(f"Total Likes   : {raw.get('total_likes', 0)}")
        print(f"Total Reach   : {raw.get('total_reach', 0)}")
        print(f"Link Clicks   : {raw.get('total_link_clicks', 0)}")
        print(f"DM Queries    : {raw.get('dm_queries', 0)}")
        print(f"Engagement    : {raw.get('avg_engagement_rate', 0)}%")
        print(f"\nOverall Score : {report.get('overall_score', 'N/A').upper()}")

        findings = report.get("key_findings", [])
        if findings:
            print("\nKey Findings:")
            for f in findings:
                print(f"  • {f}")

        recs = report.get("recommendations", [])
        if recs:
            print("\nTop Recommendations:")
            for rec in recs[:3]:
                pri = rec.get("priority", "").upper()
                print(f"  [{pri}] {rec.get('action')}")

        focus = report.get("next_week_focus")
        if focus:
            print(f"\nNext Week Focus: {focus}")
        print(SEP)

        filename = f"report_{datetime.now().strftime('%Y%m%d')}.json"
        with open(filename, "w") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"💾 Report saved: {filename}")
    return report


# ---------------------------------------------------------------------------
# Leads
# ---------------------------------------------------------------------------

def run_leads():
    funnel = LeadManager().get_funnel_stats()
    print(f"\n{SEP}")
    print("🎯 LEAD FUNNEL STATS")
    print(SEP)
    print(f"  Total Leads : {funnel.get('total', 0)}")
    print(f"  Discovered  : {funnel.get('discovered', 0)}")
    print(f"  Contacted   : {funnel.get('contacted', 0)}")
    print(f"  Interested  : {funnel.get('interested', 0)}")
    print(f"  Warm        : {funnel.get('warm', 0)}")
    print(f"  Converted   : {funnel.get('converted', 0)} ✅")
    print(f"  Lost        : {funnel.get('lost', 0)} ❌")
    print(f"  Conversion  : {funnel.get('conversion_rate', '0%')} 🎯")
    print(SEP)
    return funnel


def run_hot_leads():
    lm = LeadManager()
    hot = lm.get_hot_leads()
    due = lm.get_followup_due()

    print(f"\n{SEP}")
    print("🔥 HOT LEADS")
    print(SEP)
    if hot:
        for lead in hot[:10]:
            print(f"  @{lead['username']} | Score: {lead.get('score')}/10 | {lead.get('stage')}")
            action = lead.get("next_action")
            if action:
                print(f"    → Next: {action}")
    else:
        print("  Abhi koi hot lead nahi hai")

    print(f"\n⏰ FOLLOW-UP DUE ({len(due)} leads)")
    if due:
        for lead in due[:5]:
            last = (lead.get("last_contact") or "Never")[:10]
            print(f"  @{lead['username']} | Stage: {lead.get('stage')} | Last contact: {last}")
    else:
        print("  Koi follow-up pending nahi")
    print(SEP)


# ---------------------------------------------------------------------------
# Campaign tasks
# ---------------------------------------------------------------------------

def run_today_tasks():
    ca = CampaignAgent()
    tasks = ca.get_today_tasks()
    active = ca.get_active_campaigns()

    print(f"\n{SEP}")
    print(f"📋 TODAY'S TASKS — {datetime.now().strftime('%d %b %Y')}")
    print(SEP)
    print(f"Active Campaigns: {len(active)}")

    if tasks:
        for task in tasks:
            print(f"\n  [{task.get('platform').upper()}] {task.get('content_type')}")
            print(f"    Goal     : {task.get('goal')}")
            print(f"    Campaign : {task.get('campaign_name')}")
    else:
        print("  Aaj ke liye koi scheduled task nahi")
    print(SEP)


# ---------------------------------------------------------------------------
# WhatsApp sequence
# ---------------------------------------------------------------------------

def run_whatsapp_sequence():
    logger.info("WhatsApp broadcast sequence bana raha hoon...")

    product = TrendAgent().find_trending_product()
    if not product:
        logger.error("Product nahi mila")
        return None

    messages = MultiPlatformAgent().generate_whatsapp_sequence(product)
    if messages:
        print(f"\n{SEP}")
        print("📱 WHATSAPP BROADCAST SEQUENCE")
        print(f"Product: {product['product_name']}")
        print(SEP)
        print("\n📌 Message 1 — AWARENESS:")
        print(messages.get("awareness", ""))
        print("\n⭐ Message 2 — SOCIAL PROOF:")
        print(messages.get("social_proof", ""))
        print("\n🛒 Message 3 — OFFER:")
        print(messages.get("offer", ""))
        print("\n🔄 Message 4 — FOLLOW UP:")
        print(messages.get("follow_up", ""))
        print(f"\n🔗 Link: {messages.get('affiliate_url')}")
        print(SEP)

        filename = f"whatsapp_{datetime.now().strftime('%Y%m%d')}.json"
        with open(filename, "w") as f:
            json.dump(messages, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved: {filename}")
    return messages


# ---------------------------------------------------------------------------
# Full cycle
# ---------------------------------------------------------------------------

def run_full_marketing_cycle():
    logger.info(SEP)
    logger.info(f"Full Marketing Cycle — {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    product = TrendAgent().find_trending_product()
    if not product:
        logger.error("Product nahi mila, cycle skip")
        return

    CampaignAgent().create_campaign(product, duration_days=7)

    content = MultiPlatformAgent().generate_all_platforms(product)
    if content:
        filename = f"content_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
        with open(filename, "w") as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
        logger.info(f"Content saved: {filename}")

        AnalyticsAgent().record_post(
            platform="multi_platform",
            post_id=f"cycle_{datetime.now().strftime('%Y%m%d_%H%M')}",
            content_type="full_cycle",
            metadata={"product": product.get("product_name")},
        )

    logger.info("Full marketing cycle complete!")
    logger.info(SEP)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    args = sys.argv[1:]
    validate_config()

    command_map = {
        "--campaign": run_campaign_creation,
        "--multi-content": run_multi_content,
        "--analytics": run_analytics,
        "--leads": run_leads,
        "--hot-leads": run_hot_leads,
        "--today-tasks": run_today_tasks,
        "--whatsapp-seq": run_whatsapp_sequence,
        "--run-now": run_full_marketing_cycle,
    }

    for flag, fn in command_map.items():
        if flag in args:
            fn()
            return

    # Full scheduler mode
    logger.info("Digital Marketing Bot start ho raha hai...")
    logger.info(f"Daily cycle : {POST_TIME}")
    logger.info("Weekly report: Har Sunday 20:00")

    schedule.every().day.at(POST_TIME).do(run_full_marketing_cycle)
    schedule.every().day.at("09:00").do(run_today_tasks)
    schedule.every().sunday.at("20:00").do(run_analytics)

    logger.info("Scheduler chal raha hai. Ctrl+C se band karo.")
    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == "__main__":
    main()
