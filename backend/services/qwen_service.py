"""Recruiter outreach generation.

Uses the central LLM service (TokenRouter primary, Qwen secondary). If no LLM
is reachable, returns a clean templated message so the demo never breaks.
"""

from services.llm_service import llm_chat
from utils.logger import add_log

AGENT = "OutreachLLM"


def _fallback(company: str, role: str) -> str:
    return (
        f"Hi, I came across the {role} opening at {company} and I'm genuinely "
        f"excited about the work your team is doing. I'd love to connect and "
        f"learn more — happy to share my resume and portfolio. Thanks for your time!"
    )


def generate_outreach(company: str, role: str) -> str:
    add_log(AGENT, f"Generating outreach for {company} ({role})")
    text = llm_chat(
        prompt=(
            f"Write a concise, warm recruiter outreach message for a student "
            f"applying to a {role} role at {company}. 2-4 sentences, specific, "
            f"human, no placeholders, no subject line."
        ),
        system="You write short, genuine job-outreach messages.",
        max_tokens=180,
        temperature=0.7,
    )
    if text:
        add_log(AGENT, f"LLM outreach ready for {company}")
        return text
    add_log(AGENT, f"LLM unavailable — templated outreach for {company}")
    return _fallback(company, role)
