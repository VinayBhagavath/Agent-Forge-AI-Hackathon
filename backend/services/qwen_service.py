import os
import httpx
from utils.logger import add_log

AGENT = "QwenService"

_MOCK_MESSAGES = {
    "default": (
        "Hi, I came across the {role} opening at {company} and I'm genuinely excited about "
        "the work your team is doing. I'd love to connect and learn more about the role — "
        "happy to share my resume and portfolio. Looking forward to hearing from you!"
    )
}


def _build_prompt(company: str, role: str) -> str:
    return (
        f"Write a concise, friendly recruiter outreach message for a student applying to a "
        f"{role} position at {company}. Keep it to 2-4 sentences. Sound human, not generic."
    )


def generate_outreach(company: str, role: str) -> str:
    add_log(AGENT, f"Generating outreach message for {company} ({role})")

    api_key = os.getenv("QWEN_API_KEY", "")
    base_url = os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")

    if api_key:
        try:
            response = httpx.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "qwen-plus",
                    "messages": [{"role": "user", "content": _build_prompt(company, role)}],
                    "max_tokens": 150,
                    "temperature": 0.7,
                },
                timeout=8.0,
            )
            response.raise_for_status()
            message = response.json()["choices"][0]["message"]["content"].strip()
            add_log(AGENT, f"Outreach generated via Qwen API for {company}")
            return message
        except Exception as exc:
            add_log(AGENT, f"Qwen API error ({exc}), falling back to mock response")

    # TokenRouter fallback
    tokenrouter_key = os.getenv("TOKENROUTER_API_KEY", "")
    if tokenrouter_key:
        try:
            response = httpx.post(
                "https://api.tokenrouter.io/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {tokenrouter_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "qwen-plus",
                    "messages": [{"role": "user", "content": _build_prompt(company, role)}],
                    "max_tokens": 150,
                },
                timeout=8.0,
            )
            response.raise_for_status()
            message = response.json()["choices"][0]["message"]["content"].strip()
            add_log(AGENT, f"Outreach generated via TokenRouter for {company}")
            return message
        except Exception as exc:
            add_log(AGENT, f"TokenRouter error ({exc}), using mock response")

    # Graceful mock fallback — demo never breaks
    msg = _MOCK_MESSAGES["default"].format(company=company, role=role)
    add_log(AGENT, f"Outreach mock response returned for {company}")
    return msg
