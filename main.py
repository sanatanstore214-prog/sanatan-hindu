"""
Health & Fitness Instagram Automation Bot
-----------------------------------------
Daily automated workflow:
  08:00 - Trend research + content + design + post
  12:00 - Client hunting (DMs)
  18:00 - Client hunting (DMs)
  Every 30 min - DM monitoring + auto-reply

Usage:
  python main.py                  # Start full daily scheduler
  python main.py --test-trend     # Test trend research only
  python main.py --test-content   # Test content generation
  python main.py --test-design    # Test image design (saves to /tmp/ig_post.jpg)
  python main.py --test-post      # Test full post flow
  python main.py --run-now        # Run full cycle immediately (no wait)
"""

import sys
import time
import schedule
from datetime import datetime
from config import (
    POST_TIME, CLIENT_HUNT_TIME_1, CLIENT_HUNT_TIME_2,
    DM_CHECK_INTERVAL_MINUTES, GEMINI_API_KEY,
    INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID, IMGBB_API_KEY,
)
from agents.trend_agent import TrendAgent
from agents.content_agent import ContentAgent
from agents.design_agent import DesignAgent
from agents.instagram_agent import InstagramAgent
from agents.client_finder import ClientFinder
from agents.dm_handler import DMHandler
from utils.logger import get_logger

logger = get_logger("Main")

# Shared state
_last_product = None
_last_content = None


def validate_config():
    """Startup pe config check karo."""
    missing = []
    if not GEMINI_API_KEY:
        missing.append("GEMINI_API_KEY")
    if not INSTAGRAM_ACCESS_TOKEN:
        missing.append("INSTAGRAM_ACCESS_TOKEN")
    if not INSTAGRAM_USER_ID:
        missing.append("INSTAGRAM_USER_ID")
    if not IMGBB_API_KEY:
        missing.append("IMGBB_API_KEY")
    if missing:
        logger.error(f"Missing .env variables: {', '.join(missing)}")
        logger.error("SETUP.md dekho — Instagram API setup ke liye")
        sys.exit(1)


def run_daily_post(ig: InstagramAgent, dm_handler: DMHandler):
    """Full daily post cycle: trend → content → design → post."""
    global _last_product, _last_content
    logger.info("=" * 50)
    logger.info(f"Daily post cycle shuru — {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    trend_agent = TrendAgent()
    content_agent = ContentAgent()
    design_agent = DesignAgent()

    # Step 1: Trending product dhundho
    product = trend_agent.find_trending_product()
    if not product:
        logger.error("Product nahi mila, aaj skip kar raha hoon")
        return

    # Step 2: Content generate karo
    content = content_agent.generate_content(product)
    if not content:
        logger.error("Content generate nahi hua")
        return

    # Step 3: Ad image banao
    image_path = design_agent.create_ad_image(product, content)

    # Step 4: Instagram pe post karo
    post_id = ig.post_image(image_path, content["caption"], content["hashtags"])
    if post_id:
        logger.info(f"Post successful! ID: {post_id}")
    else:
        logger.error("Post fail hua!")

    # Update DM handler with today's product (for affiliate links in DMs)
    _last_product = product
    _last_content = content
    dm_handler.update_product_context(product, content)

    logger.info("Daily post cycle complete!")
    logger.info("=" * 50)


def run_client_hunt(client_finder: ClientFinder):
    """Client hunting session."""
    logger.info("Client hunting shuru...")
    sent = client_finder.hunt_and_dm()
    logger.info(f"Hunt complete — {sent} new DMs bheje gaye")


def run_dm_check(dm_handler: DMHandler):
    """DM monitoring cycle."""
    dm_handler.process_new_messages()


def main():
    args = sys.argv[1:]

    if "--test-trend" in args:
        logger.info("=== TREND TEST ===")
        product = TrendAgent().find_trending_product()
        print("\nProduct found:")
        import json; print(json.dumps(product, indent=2, ensure_ascii=False))
        return

    if "--test-content" in args:
        logger.info("=== CONTENT TEST ===")
        product = TrendAgent().find_trending_product()
        content = ContentAgent().generate_content(product)
        print("\nCaption:")
        print(content.get("caption"))
        print("\nHashtags:")
        print(content.get("hashtags"))
        print("\nStory text:")
        print(content.get("story_text"))
        return

    if "--test-design" in args:
        logger.info("=== DESIGN TEST ===")
        product = TrendAgent().find_trending_product()
        content = ContentAgent().generate_content(product)
        path = DesignAgent().create_ad_image(product, content)
        print(f"\nImage saved at: {path}")
        print("Isko open karo dekhhne ke liye: xdg-open /tmp/ig_post.jpg")
        return

    if "--test-post" in args:
        validate_config()
        logger.info("=== POST TEST ===")
        ig = InstagramAgent()
        dm_handler = DMHandler(ig)
        run_daily_post(ig, dm_handler)
        return

    # Full scheduler mode
    validate_config()
    logger.info("Bot start ho raha hai...")
    logger.info(f"Post time: {POST_TIME}")
    logger.info(f"Client hunt: {CLIENT_HUNT_TIME_1} & {CLIENT_HUNT_TIME_2}")
    logger.info(f"DM check: Har {DM_CHECK_INTERVAL_MINUTES} minute")

    ig = InstagramAgent()
    dm_handler = DMHandler(ig)
    client_finder = ClientFinder(ig)

    if "--run-now" in args:
        run_daily_post(ig, dm_handler)
        run_client_hunt(client_finder)

    # Daily schedules
    schedule.every().day.at(POST_TIME).do(run_daily_post, ig=ig, dm_handler=dm_handler)
    schedule.every().day.at(CLIENT_HUNT_TIME_1).do(run_client_hunt, client_finder=client_finder)
    schedule.every().day.at(CLIENT_HUNT_TIME_2).do(run_client_hunt, client_finder=client_finder)
    schedule.every(DM_CHECK_INTERVAL_MINUTES).minutes.do(run_dm_check, dm_handler=dm_handler)
    schedule.every().day.at("00:01").do(client_finder.reset_daily_count)

    logger.info("Scheduler chal raha hai. Ctrl+C se band karo.")
    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == "__main__":
    main()
