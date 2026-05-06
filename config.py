import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME", "")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD", "")
IMGBB_API_KEY = os.getenv("IMGBB_API_KEY", "")
AMAZON_AFFILIATE_TAG = os.getenv("AMAZON_AFFILIATE_TAG", "")

# Schedule
POST_TIME = os.getenv("POST_TIME", "08:00")
CLIENT_HUNT_TIME_1 = os.getenv("CLIENT_HUNT_TIME_1", "12:00")
CLIENT_HUNT_TIME_2 = os.getenv("CLIENT_HUNT_TIME_2", "18:00")
DM_CHECK_INTERVAL_MINUTES = 30

# Gemini model (free tier)
GEMINI_MODEL = "gemini-2.0-flash"

# Daily limits (Instagram spam prevention)
MAX_DMS_PER_DAY = 10
MAX_CLIENTS_PER_SEARCH = 5

# Image dimensions (Instagram square post)
IMAGE_WIDTH = 1080
IMAGE_HEIGHT = 1080

# Category color themes (RGB)
CATEGORY_COLORS = {
    "supplements":   {"bg": (20, 20, 35),    "accent": (255, 140, 0),   "text": (255, 255, 255)},
    "equipment":     {"bg": (10, 25, 50),    "accent": (0, 150, 255),   "text": (255, 255, 255)},
    "nutrition":     {"bg": (15, 40, 20),    "accent": (50, 200, 80),   "text": (255, 255, 255)},
    "yoga":          {"bg": (40, 10, 40),    "accent": (200, 100, 255), "text": (255, 255, 255)},
    "weight_loss":   {"bg": (40, 10, 10),    "accent": (255, 60, 60),   "text": (255, 255, 255)},
    "default":       {"bg": (15, 15, 25),    "accent": (255, 165, 0),   "text": (255, 255, 255)},
}

# Instagram hashtags pool (30 mix Hindi + English)
BASE_HASHTAGS = [
    "#fitness", "#health", "#healthylifestyle", "#fitnessmotivation",
    "#workout", "#gym", "#weightloss", "#nutrition", "#muscle",
    "#fitindia", "#indianfitness", "#swasthya", "#tandrusti",
    "#fitnessindia", "#healthproducts", "#supplements", "#protein",
    "#bodybuilding", "#yoga", "#ayurveda", "#wellness",
    "#healthyeating", "#fitfam", "#gymlife", "#motivation",
    "#transformation", "#indiangymer", "#desifit", "#healthstore",
    "#fitnessblogger",
]

# Product search keywords
HEALTH_KEYWORDS = [
    "protein powder india", "weight loss supplement india",
    "gym equipment home", "health supplement bestseller",
    "mass gainer india", "fat burner india", "multivitamin india",
    "yoga mat india", "resistance band india", "whey protein india",
]

# Instagram Graph API base URL
IG_API_BASE = "https://graph.facebook.com/v18.0"
