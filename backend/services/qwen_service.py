"""Recruiter outreach generation.

Uses the central LLM service (TokenRouter primary, Qwen secondary). If no LLM
is reachable, returns a clean templated message so the demo never breaks.
"""

from services.llm_service import llm_chat
from utils.logger import add_log

AGENT = "OutreachLLM"


def _fallback(company: str, role: str, title: str = "") -> str:
    target = title or role
    return (
        f"Hi, I came across the {target} opening at {company} and I'm genuinely "
        f"excited about the work your team is doing. I'd love to connect and "
        f"learn more - happy to share my resume and portfolio. Thanks for your time!"
    )


def generate_outreach(company: str, role: str, title: str = "", resume_text: str = "") -> str:
    add_log(AGENT, f"Generating outreach for {company} ({role})")
    resume_context = (
        f"\nCandidate resume excerpt:\n{resume_text[:2500]}"
        if resume_text.strip()
        else ""
    )
    text = llm_chat(
        prompt=(
            f"Write a concise, warm recruiter outreach message for a candidate "
            f"applying to the {title or role} role at {company}. Use 1 or 2 "
            f"specific skills/projects from the resume if available. 2-4 "
            f"sentences, human, no placeholders, no subject line."
            f"{resume_context}"
        ),
        system="You write short, genuine job-outreach messages.",
        max_tokens=180,
        temperature=0.7,
    )
    if text:
        add_log(AGENT, f"LLM outreach ready for {company}")
        return text
    add_log(AGENT, f"LLM unavailable - templated outreach for {company}")
    return _fallback(company, role, title)
