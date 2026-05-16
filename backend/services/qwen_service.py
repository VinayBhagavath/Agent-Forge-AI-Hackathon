"""Recruiter outreach generation.

Uses Z.ai GLM (via TokenRouter) for outreach — the GLM model family is
purpose-built for long-horizon reasoning and natural language generation,
making it well-suited for personalized recruiter messages. Falls back to
the default TokenRouter model, then a template if no LLM is reachable.
"""

import os
import httpx
from services.llm_service import llm_chat
from utils.logger import add_log

AGENT = "OutreachLLM"

_ZAI_MODEL = os.getenv("ZAI_MODEL", "z-ai/glm-5.1")


def _zai_chat(prompt: str, system: str, max_tokens: int) -> str | None:
    """Route outreach generation to Z.ai GLM via TokenRouter."""
    key = os.getenv("TOKENROUTER_API_KEY", "")
    if not key:
        return None
    base = os.getenv("TOKENROUTER_BASE_URL", "https://api.tokenrouter.com/v1").rstrip("/")
    try:
        r = httpx.post(
            f"{base}/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            timeout=45.0,
            json={
                "model": _ZAI_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": max_tokens,
                "temperature": 0.7,
            },
        )
        r.raise_for_status()
        msg = r.json()["choices"][0]["message"]
        text = (msg.get("content") or "").strip()
        if not text:
            return None
        add_log(AGENT, f"Z.ai GLM ({_ZAI_MODEL}) generated outreach")
        return text
    except Exception as exc:
        add_log(AGENT, f"Z.ai GLM call failed ({type(exc).__name__}) — using fallback model")
        return None


def _fallback(company: str, role: str, title: str = "") -> str:
    target = title or role
    return (
        f"Hi, I came across the {target} opening at {company} and I'm genuinely "
        f"excited about the work your team is doing. I'd love to connect and "
        f"learn more - happy to share my resume and portfolio. Thanks for your time!"
    )


def generate_outreach(company: str, role: str, title: str = "", resume_text: str = "") -> str:
    add_log(AGENT, f"Generating outreach for {company} ({role}) via Z.ai GLM")
    resume_context = (
        f"\nCandidate resume excerpt:\n{resume_text[:2500]}"
        if resume_text.strip()
        else ""
    )
    system = "You write short, genuine job-outreach messages."
    prompt = (
        f"Write a concise, warm recruiter outreach message for a candidate "
        f"applying to the {title or role} role at {company}. Use 1 or 2 "
        f"specific skills/projects from the resume if available. 2-4 "
        f"sentences, human, no placeholders, no subject line."
        f"{resume_context}"
    )

    # Primary: Z.ai GLM via TokenRouter (GLM uses reasoning tokens; budget ~1500)
    text = _zai_chat(prompt, system, max_tokens=1500)
    # Fallback: default TokenRouter model
    if not text:
        text = llm_chat(prompt, system=system, max_tokens=180, temperature=0.7)
    if text:
        add_log(AGENT, f"Outreach ready for {company}")
        return text
    add_log(AGENT, f"LLM unavailable — templated outreach for {company}")
    return _fallback(company, role, title)
