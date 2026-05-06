import json
import requests
from config import GEMINI_API_KEY, GEMINI_MODEL
from utils.logger import get_logger

logger = get_logger("GeminiClient")

_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"


def generate(system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> str:
    """Call Gemini REST API directly — no SDK needed."""
    url = _API_URL.format(model=GEMINI_MODEL, key=GEMINI_API_KEY)
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.7},
    }
    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()


def generate_chat(system_prompt: str, history: list, new_message: str, max_tokens: int = 400) -> str:
    """Multi-turn chat with Gemini REST API."""
    url = _API_URL.format(model=GEMINI_MODEL, key=GEMINI_API_KEY)
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
    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
