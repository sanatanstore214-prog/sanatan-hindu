"""
Google Gemini wrapper using REST API directly (no heavy SDK needed).
Free tier: 1500 requests/day — no credit card required.
"""
import json
import requests
from types import SimpleNamespace


GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


class GeminiClient:
    def __init__(self, api_key: str):
        self._api_key = api_key

    def messages_create(self, model: str, max_tokens: int, system: str, messages: list):
        """
        Anthropic-compatible call using Gemini REST API.
        Returns object with .content[0].text
        """
        contents = []

        # System instruction as first user turn (Gemini REST workaround)
        contents.append({
            "role": "user",
            "parts": [{"text": f"[System instructions]: {system}"}]
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "Understood. I will follow these instructions."}]
        })

        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            text = msg["content"]
            if isinstance(text, list):
                text = " ".join(c.get("text", "") for c in text if isinstance(c, dict))
            contents.append({"role": role, "parts": [{"text": text}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.7,
            },
        }

        resp = requests.post(
            GEMINI_API_URL,
            params={"key": self._api_key},
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return SimpleNamespace(content=[SimpleNamespace(text=text)])
