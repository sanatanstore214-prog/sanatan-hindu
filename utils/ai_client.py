"""
Google Gemini wrapper — Anthropic jaise interface deta hai
Free tier: 1500 requests/day, koi credit card nahi chahiye
"""
from types import SimpleNamespace
import google.generativeai as genai


class GeminiClient:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self._api_key = api_key

    def _to_gemini_history(self, messages: list) -> list:
        """Anthropic format → Gemini history format."""
        history = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            content = msg["content"]
            if isinstance(content, list):
                content = " ".join(c.get("text", "") for c in content if isinstance(c, dict))
            history.append({"role": role, "parts": [content]})
        return history

    def messages_create(self, model: str, max_tokens: int, system: str, messages: list):
        """
        Anthropic-compatible call.
        Returns object with .content[0].text
        """
        gemini_model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system,
            generation_config=genai.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=0.7,
            ),
        )

        history = self._to_gemini_history(messages[:-1])
        chat = gemini_model.start_chat(history=history)
        last = messages[-1]["content"]
        if isinstance(last, list):
            last = " ".join(c.get("text", "") for c in last if isinstance(c, dict))

        response = chat.send_message(last)
        inner = SimpleNamespace(text=response.text)
        return SimpleNamespace(content=[inner])
