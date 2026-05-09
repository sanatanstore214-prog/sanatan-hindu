import time
import json
import requests
from config import GEMINI_API_KEY, GEMINI_MODEL
from utils.logger import get_logger

logger = get_logger("GeminiClient")

_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"


def _call(payload: dict, retries: int = 2) -> str:
    """Core API call with exponential backoff retry."""
    url = _API_URL.format(model=GEMINI_MODEL, key=GEMINI_API_KEY)
    delay = 3
    for attempt in range(retries):
        try:
            resp = requests.post(url, json=payload, timeout=20)
            if resp.status_code == 200:
                return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            if resp.status_code in (429, 503, 500):
                logger.warning(f"Gemini {resp.status_code}, retry {attempt+1}/{retries} in {delay}s...")
                time.sleep(delay)
                delay = min(delay * 2, 10)
                continue
            resp.raise_for_status()
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout, retry {attempt+1}/{retries} in {delay}s...")
            time.sleep(delay)
            delay = min(delay * 2, 10)
    raise RuntimeError(f"Gemini API failed after {retries} retries")


def generate(system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> str:
    """Single-turn generation."""
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.7},
    }
    return _call(payload)


def generate_chat(system_prompt: str, history: list, new_message: str, max_tokens: int = 400) -> str:
    """Multi-turn chat."""
    contents = []
    for h in history:
        role = "model" if h["role"] == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": h["content"]}]})
    contents.append({"role": "user", "parts": [{"text": new_message}]})
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.7},
    }
    return _call(payload)
