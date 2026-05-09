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
    INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD, IMGBB_API_KEY,
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
    if not INSTAGRAM_USERNAME:
        missing.append("INSTAGRAM_USERNAME")
    if not INSTAGRAM_PASSWORD:
        missing.append("INSTAGRAM_PASSWORD")
    if not IMGBB_API_KEY:
        missing.append("IMGBB_API_KEY")
    if missing:
        logger.error(f"Missing .env variables: {', '.join(missing)}")
        logger.error(".env file mein apna Instagram username aur password daalo")
        sys.exit(1)


def run_daily_post(ig: InstagramAgent, dm_handler: DMHandler):
    """Full daily post cycle: trend → content → design → post."""
    import traceback
    global _last_product, _last_content
    logger.info("=" * 50)
    logger.info(f"Daily post cycle shuru — {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    trend_agent = TrendAgent()
    content_agent = ContentAgent()
    design_agent = DesignAgent()

    # Step 1: Trending product dhundho
    logger.info("STEP 1: Trend research...")
    try:
        product = trend_agent.find_trending_product()
    except Exception as e:
        logger.error(f"STEP 1 FAILED: {e}\n{traceback.format_exc()}")
        raise
    if not product:
        logger.error("Product nahi mila, aaj skip kar raha hoon")
        return
    logger.info(f"STEP 1 OK: {product.get('product_name')}")

    # Step 2: Content generate karo
    logger.info("STEP 2: Content generation...")
    try:
        content = content_agent.generate_content(product)
    except Exception as e:
        logger.error(f"STEP 2 FAILED: {e}\n{traceback.format_exc()}")
        raise
    if not content:
        logger.error("Content generate nahi hua")
        return
    logger.info("STEP 2 OK: Content ready")

    # Step 3: Ad image banao
    logger.info("STEP 3: Image design...")
    try:
        image_path = design_agent.create_ad_image(product, content)
    except Exception as e:
        logger.error(f"STEP 3 FAILED: {e}\n{traceback.format_exc()}")
        raise
    logger.info(f"STEP 3 OK: Image at {image_path}")

    # Step 4: Instagram pe post karo
    logger.info("STEP 4: Instagram upload...")
    try:
        post_id = ig.post_image(image_path, content["caption"], content["hashtags"])
    except Exception as e:
        logger.error(f"STEP 4 FAILED: {e}\n{traceback.format_exc()}")
        raise
    if post_id:
        logger.info(f"STEP 4 OK: Post live! ID: {post_id}")
    else:
        logger.error("STEP 4 FAILED: post_image returned None")
        raise RuntimeError("Instagram post failed — post_image returned None")

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

    if "--check-dms" in args:
        validate_config()
        logger.info("=== DM CHECK ===")
        ig = InstagramAgent()
        dm_handler = DMHandler(ig)
        run_dm_check(dm_handler)
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
