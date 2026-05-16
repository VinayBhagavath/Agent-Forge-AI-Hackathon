"""Cover letter generation.

Uses Z.ai GLM (via TokenRouter) for the top-scored job. GLM's reasoning
depth produces well-structured, personalized letters that reference specific
resume evidence rather than generic boilerplate.

Falls back to the default TokenRouter model if Z.ai returns empty content.
"""

import os
import httpx
from models.schemas import Job
from services.llm_service import llm_chat
from utils.logger import add_log

AGENT = "CoverLetterAgent"
_ZAI_MODEL = os.getenv("ZAI_MODEL", "z-ai/glm-5.1")
_TIMEOUT = 90.0


def _zai_chat(prompt: str, system: str) -> str | None:
    key = os.getenv("TOKENROUTER_API_KEY", "")
    if not key:
        return None
    base = os.getenv("TOKENROUTER_BASE_URL", "https://api.tokenrouter.com/v1").rstrip("/")
    try:
        r = httpx.post(
            f"{base}/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            timeout=_TIMEOUT,
            json={
                "model": _ZAI_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 2000,
                "temperature": 0.65,
            },
        )
        r.raise_for_status()
        msg = r.json()["choices"][0]["message"]
        text = (msg.get("content") or "").strip()
        if text:
            add_log(AGENT, f"Z.ai GLM ({_ZAI_MODEL}) generated cover letter")
        return text or None
    except Exception as exc:
        add_log(AGENT, f"Z.ai call failed ({type(exc).__name__}) — using fallback")
        return None


def generate_cover_letter(job: Job, resume_text: str, role: str) -> str | None:
    add_log(AGENT, f"Generating cover letter for {job.title} @ {job.company}")

    system = (
        "You are a professional career coach who writes compelling, personalized "
        "cover letters. Draw specific evidence from the resume — projects, metrics, "
        "technologies — rather than generic phrases. Tone: confident, warm, concise."
    )
    prompt = (
        f"Write a complete, ready-to-send cover letter for this candidate applying "
        f"to the **{job.title}** role at **{job.company}** (sourced from {job.source}).\n\n"
        f"Requirements:\n"
        f"- 3–4 paragraphs: opening hook, 2 body paragraphs referencing specific "
        f"resume evidence (projects, metrics, skills), closing with clear call-to-action\n"
        f"- No placeholders — use the candidate's actual background from the resume\n"
        f"- Address it to the Hiring Manager if no specific name is known\n"
        f"- Professional but warm tone\n"
        f"- End with 'Sincerely,' and a blank line for signature\n\n"
        f"Candidate's resume:\n{resume_text[:6000]}\n\n"
        f"Target role: {role or job.title}"
    )

    text = _zai_chat(prompt, system)
    if not text:
        text = llm_chat(prompt, system=system, max_tokens=800, temperature=0.65)
        if text:
            add_log(AGENT, "Cover letter generated via fallback model")

    if not text:
        add_log(AGENT, "Cover letter generation failed — no LLM available")

    return text
