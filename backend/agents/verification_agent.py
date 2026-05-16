from models.schemas import Job
from utils.logger import add_log

AGENT = "VerificationAgent"

_AI_STARTUPS = {
    "anthropic", "perplexity", "openai", "mistral ai", "cohere",
    "groq", "together ai", "scale ai", "hugging face", "runway ml",
    "deepmind", "inflection", "adept", "character ai", "stability ai",
}

_RECENT_COMPANIES = {
    "anthropic", "perplexity", "groq", "mistral ai", "together ai",
    "runway ml", "inflection", "character ai",
}

_ACTIVE_ATS = {"Greenhouse", "Ashby", "Lever"}


def verify_job(job: Job) -> dict:
    add_log(AGENT, f"Verifying job: {job.title} at {job.company}")

    score = 50  # baseline
    reasons = []

    company_lower = job.company.lower()

    if company_lower in _RECENT_COMPANIES:
        score += 20
        reasons.append("recently funded company")

    if company_lower in _AI_STARTUPS:
        score += 20
        reasons.append("active AI startup")

    if job.source in _ACTIVE_ATS:
        score += 15
        reasons.append(f"live {job.source} ATS")

    if len(job.title) > 40:
        score -= 10
        reasons.append("long/vague title")

    if company_lower not in _AI_STARTUPS and company_lower not in _RECENT_COMPANIES:
        score -= 20
        reasons.append("lesser-known company")

    score = max(0, min(100, score))
    reason = ", ".join(reasons).capitalize() if reasons else "Standard posting"

    add_log(AGENT, f"Scored {job.company} — {score}/100 ({reason})")
    return {"score": score, "reason": reason}
